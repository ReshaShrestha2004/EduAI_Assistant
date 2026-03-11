import gc
import os
import torch
from dotenv import load_dotenv

load_dotenv()


class ModelManager:
    """Singleton manager for all AI models"""

    _instance = None

    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._flan_t5_model = None
        self._flan_t5_tokenizer = None
        self._embed_model = None
        self._spacy_nlp = None
        self._groq_client = None

        # Config
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        self.use_groq_fallback = bool(self.groq_api_key)

        print(f"[ModelManager] Device: {self.device}")
        print(f"[ModelManager] Groq fallback: {'enabled' if self.use_groq_fallback else 'disabled'}")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    

    def get_flan_t5(self):
        """Load FLAN-T5-base on demand"""
        if self._flan_t5_model is None:
            print("[ModelManager] Loading FLAN-T5-base...")
            from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

            model_path = os.getenv("FLAN_T5_MODEL_PATH", "google/flan-t5-base")

            self._flan_t5_tokenizer = AutoTokenizer.from_pretrained(model_path)
            self._flan_t5_model = AutoModelForSeq2SeqLM.from_pretrained(model_path)
            self._flan_t5_model.to(self.device)
            self._flan_t5_model.eval()
            print("[ModelManager] FLAN-T5-base loaded!")

        return self._flan_t5_model, self._flan_t5_tokenizer

    def generate_flan_t5(self, prompt, max_length=256, min_length=30, num_beams=4):
        """Generate text using FLAN-T5"""
        model, tokenizer = self.get_flan_t5()

        inputs = tokenizer(
            prompt,
            max_length=512,
            truncation=True,
            return_tensors="pt"
        ).to(self.device)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_length=max_length,
                min_length=min_length,
                num_beams=num_beams,
                no_repeat_ngram_size=3,
                length_penalty=1.0,
                early_stopping=True
            )

        return tokenizer.decode(outputs[0], skip_special_tokens=True)

    

    def get_groq_client(self):
        """Initialize Groq client on demand"""
        if self._groq_client is None and self.groq_api_key:
            from groq import Groq
            self._groq_client = Groq(api_key=self.groq_api_key)
            print("[ModelManager] Groq client initialized!")
        return self._groq_client

    def generate_groq(self, prompt, system_prompt="You are an educational AI assistant.", max_tokens=1024):
        """Generate text using Groq API"""
        client = self.get_groq_client()
        if not client:
            raise RuntimeError("Groq API key not configured")

        response = client.chat.completions.create(
            model=self.groq_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=0.3,
        )

        return response.choices[0].message.content

    

    def generate(self, prompt, system_prompt="You are an educational AI assistant.",
                 max_length=256, min_length=30, prefer="local"):
        """
        Hybrid generation: tries local FLAN-T5 first, falls back to Groq.
        prefer="local" → try FLAN-T5 first
        prefer="groq" → try Groq first
        prefer="groq_only" → only use Groq
        prefer="local_only" → only use FLAN-T5
        """
        if prefer == "groq_only":
            return self.generate_groq(prompt, system_prompt)

        if prefer == "local_only":
            return self.generate_flan_t5(prompt, max_length=max_length, min_length=min_length)

        if prefer == "groq" and self.use_groq_fallback:
            try:
                return self.generate_groq(prompt, system_prompt)
            except Exception as e:
                print(f"[ModelManager] Groq failed: {e}, falling back to local")
                return self.generate_flan_t5(prompt, max_length=max_length, min_length=min_length)

        
        try:
            result = self.generate_flan_t5(prompt, max_length=max_length, min_length=min_length)
            
            if len(result.strip()) < 20 and self.use_groq_fallback:
                print("[ModelManager] Local result too short, trying Groq...")
                return self.generate_groq(prompt, system_prompt)
            return result
        except Exception as e:
            print(f"[ModelManager] Local failed: {e}")
            if self.use_groq_fallback:
                return self.generate_groq(prompt, system_prompt)
            raise e

    

    def get_embed_model(self):
        """Load sentence-transformers model on demand"""
        if self._embed_model is None:
            print("[ModelManager] Loading all-MiniLM-L6-v2...")
            from sentence_transformers import SentenceTransformer
            self._embed_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            print("[ModelManager] Embedding model loaded!")
        return self._embed_model

    def encode_texts(self, texts):
        """Generate embeddings for a list of texts"""
        import numpy as np
        model = self.get_embed_model()
        embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        return embeddings.astype("float32")

    

    def get_spacy(self):
        """Load spaCy model on demand"""
        if self._spacy_nlp is None:
            print("[ModelManager] Loading spaCy en_core_web_sm...")
            import spacy
            try:
                self._spacy_nlp = spacy.load("en_core_web_sm")
            except OSError:
                print("[ModelManager] Downloading spaCy model...")
                import subprocess
                subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"], check=True)
                self._spacy_nlp = spacy.load("en_core_web_sm")
            print("[ModelManager] spaCy loaded!")
        return self._spacy_nlp

    

    def unload_flan_t5(self):
        """Free FLAN-T5 from memory"""
        if self._flan_t5_model is not None:
            del self._flan_t5_model
            del self._flan_t5_tokenizer
            self._flan_t5_model = None
            self._flan_t5_tokenizer = None
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            print("[ModelManager] FLAN-T5 unloaded")

    def unload_embed_model(self):
        """Free embedding model from memory"""
        if self._embed_model is not None:
            del self._embed_model
            self._embed_model = None
            gc.collect()
            print("[ModelManager] Embedding model unloaded")

    def unload_all(self):
        """Free all models"""
        self.unload_flan_t5()
        self.unload_embed_model()
        if self._spacy_nlp:
            del self._spacy_nlp
            self._spacy_nlp = None
        gc.collect()
        print("[ModelManager] All models unloaded")

    def get_status(self):
        """Return current model loading status"""
        return {
            "device": str(self.device),
            "flan_t5_loaded": self._flan_t5_model is not None,
            "embed_model_loaded": self._embed_model is not None,
            "spacy_loaded": self._spacy_nlp is not None,
            "groq_available": self.use_groq_fallback,
            "groq_model": self.groq_model if self.use_groq_fallback else None,
        }