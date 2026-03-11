import os
import json
import numpy as np
import faiss
from pathlib import Path

from .model_manager import ModelManager
from .pdf_service import extract_text_from_pdf, clean_text, chunk_text

FAISS_DIR = Path("faiss_indexes")
FAISS_DIR.mkdir(exist_ok=True)


class DocumentIndex:
    """Manages FAISS index and chunks for a single document"""

    def __init__(self, document_id: int):
        self.document_id = document_id
        self.chunks = []
        self.index = None
        self.index_path = FAISS_DIR / f"doc_{document_id}.index"
        self.chunks_path = FAISS_DIR / f"doc_{document_id}_chunks.json"

    def is_built(self) -> bool:
        return self.index_path.exists() and self.chunks_path.exists()

    def build(self, file_path: str):
        """Build FAISS index from a PDF file — text is already cleaned by pdf_service"""
        manager = ModelManager.get_instance()

        text = extract_text_from_pdf(file_path)
        self.chunks = chunk_text(text, chunk_size=400, overlap=80)

        if not self.chunks:
            raise ValueError("No text chunks could be created from the document")

        embeddings = manager.encode_texts(self.chunks)

        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings)

        faiss.write_index(self.index, str(self.index_path))
        with open(self.chunks_path, "w", encoding="utf-8") as f:
            json.dump(self.chunks, f, ensure_ascii=False)

        return len(self.chunks)

    def load(self):
        if not self.is_built():
            raise FileNotFoundError(f"No index found for document {self.document_id}")

        self.index = faiss.read_index(str(self.index_path))
        with open(self.chunks_path, "r", encoding="utf-8") as f:
            self.chunks = json.load(f)

    def search(self, query: str, top_k: int = 3) -> list:
        if self.index is None:
            self.load()

        manager = ModelManager.get_instance()
        q_embedding = manager.encode_texts([query])

        distances, indices = self.index.search(q_embedding, min(top_k, len(self.chunks)))

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self.chunks):
                results.append({
                    "chunk": self.chunks[idx],
                    "distance": float(dist),
                    "chunk_index": int(idx)
                })

        return results

    def delete(self):
        if self.index_path.exists():
            os.remove(self.index_path)
        if self.chunks_path.exists():
            os.remove(self.chunks_path)


_index_cache: dict = {}


def get_or_build_index(document_id: int, file_path: str) -> DocumentIndex:
    if document_id in _index_cache:
        return _index_cache[document_id]

    doc_index = DocumentIndex(document_id)

    if doc_index.is_built():
        doc_index.load()
    else:
        doc_index.build(file_path)

    _index_cache[document_id] = doc_index
    return doc_index


def ask_question(document_id: int, file_path: str, question: str,
                 top_k: int = 3, prefer: str = "local") -> dict:
    """Full RAG Q&A pipeline"""
    manager = ModelManager.get_instance()

    doc_index = get_or_build_index(document_id, file_path)

    search_results = doc_index.search(question, top_k=top_k)

    if not search_results:
        return {
            "answer": "I couldn't find relevant information in the document to answer this question.",
            "sources": [],
            "model_used": "none"
        }

    context = "\n\n".join([r["chunk"] for r in search_results])

    if prefer in ("groq", "groq_only") and manager.use_groq_fallback:
        prompt = (
            f"Based on the following document excerpts, answer the question clearly and accurately.\n\n"
            f"Document excerpts:\n{context[:3000]}\n\n"
            f"Question: {question}\n\n"
            f"Provide a detailed, educational answer based only on the information in the document excerpts."
        )
        answer = manager.generate_groq(
            prompt,
            system_prompt="You are an educational AI assistant. Answer questions based on the provided document context. Be accurate, detailed, and educational.",
            max_tokens=600
        )
        model_used = "groq"
    else:
        prompt = (
            f"Instruction: Provide a concise educational answer based on the context.\n"
            f"Question: {question}\n"
            f"Context: {context[:1500]}\n"
            f"Answer:"
        )
        answer = manager.generate_flan_t5(prompt, max_length=256, min_length=20)
        model_used = "flan_t5_local"

        if len(answer.strip()) < 20 and manager.use_groq_fallback:
            groq_prompt = (
                f"Based on the following context, answer the question.\n\n"
                f"Context:\n{context[:3000]}\n\n"
                f"Question: {question}\n\nAnswer:"
            )
            answer = manager.generate_groq(
                groq_prompt,
                system_prompt="You are an educational AI assistant.",
                max_tokens=600
            )
            model_used = "groq_fallback"

    sources = []
    for r in search_results:
        source_text = r["chunk"][:200]
        source_text = source_text.strip()
        if len(source_text) > 200:
            source_text = source_text[:200] + "..."

        sources.append({
            "text": source_text,
            "relevance_score": round(1 / (1 + r["distance"]), 3)
        })

    return {
        "answer": answer.strip(),
        "sources": sources,
        "model_used": model_used,
        "chunks_searched": doc_index.index.ntotal if doc_index.index else 0
    }


def delete_document_index(document_id: int):
    if document_id in _index_cache:
        _index_cache[document_id].delete()
        del _index_cache[document_id]
    else:
        doc_index = DocumentIndex(document_id)
        doc_index.delete()