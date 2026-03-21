import gc
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class ModelManager:
    """Singleton manager for all AI models"""

    _instance = None

    def __init__(self):
        self._llm = None
        self._embed_model = None
        self._spacy_nlp = None
        self._groq_client = None

        # Mistral GGUF model path
        self.local_model_path = os.getenv(
            "LOCAL_MODEL_PATH",
            "./ai_models/mistral-7b-instruct-v0.2.Q4_K_M.gguf"
        )

        # Groq config
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        self.use_groq_fallback = bool(self.groq_api_key)

        print(f"[ModelManager] Local model: {self.local_model_path}")
        print(f"[ModelManager] Local model exists: {Path(self.local_model_path).exists()}")
        print(f"[ModelManager] Groq fallback: {'enabled' if self.use_groq_fallback else 'disabled'}")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # ── Local Mistral 7B (GGUF via llama-cpp-python) ──────────

    def get_llm(self):
        """Load Mistral GGUF model on demand"""
        if self._llm is None:
            print("[ModelManager] Loading Mistral 7B GGUF model...")

            from llama_cpp import Llama

            model_path = self.local_model_path

            if not Path(model_path).exists():
                raise FileNotFoundError(
                    f"Model file not found: {model_path}\n"
                    f"Download it with:\n"
                    f"huggingface-cli download TheBloke/Mistral-7B-Instruct-v0.2-GGUF "
                    f"mistral-7b-instruct-v0.2.Q4_K_M.gguf --local-dir ./ai_models"
                )

            self._llm = Llama(
                model_path=model_path,
                n_ctx=4096,         # Context window
                n_gpu_layers=-1,    # Use ALL GPU layers (Metal on Mac, CUDA on Windows)
                n_threads=6,        # CPU threads for non-GPU work
                verbose=False,
            )

            print("[ModelManager] Mistral 7B loaded!")

        return self._llm

    def generate_local(self, prompt: str, system_prompt: str = "You are an educational AI assistant.",
                       max_tokens: int = 800, temperature: float = 0.3) -> str:
        """Generate text using local Mistral model"""
        llm = self.get_llm()

        # Mistral instruct format
        formatted_prompt = f"<s>[INST] {system_prompt}\n\n{prompt} [/INST]"

        response = llm(
            formatted_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=0.9,
            repeat_penalty=1.1,
            stop=["</s>", "[INST]"],
        )

        return response["choices"][0]["text"].strip()

    # ── Groq API (Cloud Enhancement) ──────────────────────────

    def get_groq_client(self):
        """Initialize Groq client on demand"""
        if self._groq_client is None and self.groq_api_key:
            from groq import Groq
            self._groq_client = Groq(api_key=self.groq_api_key)
            print("[ModelManager] Groq client initialized!")
        return self._groq_client

    def generate_groq(self, prompt: str, system_prompt: str = "You are an educational AI assistant.",
                      max_tokens: int = 1024) -> str:
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

    # ── Hybrid Generate ───────────────────────────────────────

    def generate(self, prompt: str, system_prompt: str = "You are an educational AI assistant.",
                 max_tokens: int = 800, prefer: str = "local") -> str:
        """
        Hybrid generation:
        prefer="local" → Mistral 7B
        prefer="groq" → Groq API
        prefer="groq_only" → Only Groq
        prefer="local_only" → Only Mistral
        """
        if prefer == "groq_only":
            return self.generate_groq(prompt, system_prompt, max_tokens)

        if prefer == "local_only":
            return self.generate_local(prompt, system_prompt, max_tokens)

        if prefer == "groq" and self.use_groq_fallback:
            try:
                return self.generate_groq(prompt, system_prompt, max_tokens)
            except Exception as e:
                print(f"[ModelManager] Groq failed: {e}, falling back to local")
                return self.generate_local(prompt, system_prompt, max_tokens)

        # Default: try local first
        try:
            result = self.generate_local(prompt, system_prompt, max_tokens)
            if len(result.strip()) < 20 and self.use_groq_fallback:
                print("[ModelManager] Local result too short, trying Groq...")
                return self.generate_groq(prompt, system_prompt, max_tokens)
            return result
        except Exception as e:
            print(f"[ModelManager] Local failed: {e}")
            if self.use_groq_fallback:
                return self.generate_groq(prompt, system_prompt, max_tokens)
            raise e

    # ── Convenience methods matching old FLAN-T5 interface ────
    # These keep all existing services working without changes

    def generate_flan_t5(self, prompt: str, max_length: int = 256, min_length: int = 30,
                         num_beams: int = 4) -> str:
        """Backward compatible — routes to Mistral instead of FLAN-T5"""
        return self.generate_local(
            prompt,
            system_prompt="You are an educational AI assistant. Be concise and accurate.",
            max_tokens=max_length,
        )

    # ── Sentence Embeddings (for RAG) ─────────────────────────

    def get_embed_model(self):
        """Load sentence-transformers model on demand"""
        if self._embed_model is None:
            print("[ModelManager] Loading all-MiniLM-L6-v2...")
            from sentence_transformers import SentenceTransformer
            self._embed_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            print("[ModelManager] Embedding model loaded!")
        return self._embed_model

    def encode_texts(self, texts: list) -> "numpy.ndarray":
        """Generate embeddings for a list of texts"""
        import numpy as np
        model = self.get_embed_model()
        embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        return embeddings.astype("float32")

    # ── spaCy (for NER / Flashcard generation) ────────────────

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
                subprocess.run(["python3", "-m", "spacy", "download", "en_core_web_sm"], check=True)
                self._spacy_nlp = spacy.load("en_core_web_sm")
            print("[ModelManager] spaCy loaded!")
        return self._spacy_nlp

    # ── Memory Management ─────────────────────────────────────

    def unload_local_model(self):
        """Free Mistral from memory"""
        if self._llm is not None:
            del self._llm
            self._llm = None
            gc.collect()
            print("[ModelManager] Mistral model unloaded")

    def unload_embed_model(self):
        """Free embedding model from memory"""
        if self._embed_model is not None:
            del self._embed_model
            self._embed_model = None
            gc.collect()
            print("[ModelManager] Embedding model unloaded")

    def unload_all(self):
        """Free all models"""
        self.unload_local_model()
        self.unload_embed_model()
        if self._spacy_nlp:
            del self._spacy_nlp
            self._spacy_nlp = None
        gc.collect()
        print("[ModelManager] All models unloaded")

    def get_status(self) -> dict:
        """Return current model loading status"""
        return {
            "local_model": "Mistral-7B-Instruct-v0.2 (Q4_K_M)",
            "local_model_loaded": self._llm is not None,
            "local_model_exists": Path(self.local_model_path).exists(),
            "embed_model_loaded": self._embed_model is not None,
            "spacy_loaded": self._spacy_nlp is not None,
            "groq_available": self.use_groq_fallback,
            "groq_model": self.groq_model if self.use_groq_fallback else None,
        }