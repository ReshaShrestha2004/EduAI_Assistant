"""
EduAI Summary Service
Uses Mistral 7B (local) + Groq (cloud enhancement).
Mistral handles 4096 token context — much better at combining summaries than FLAN-T5.
"""

from .model_manager import ModelManager
from .pdf_service import extract_text_from_pdf, clean_text, chunk_text


def summarize_document(file_path: str, prefer: str = "local") -> dict:
    """Summarize an entire PDF document."""
    text = extract_text_from_pdf(file_path)

    if len(text) < 100:
        return {
            "summary": "The document contains too little text to summarize.",
            "model_used": "none",
            "chunks_processed": 0,
            "document_length": len(text)
        }

    manager = ModelManager.get_instance()
    chunks = chunk_text(text, chunk_size=500, overlap=50)

    if prefer in ("groq", "groq_only") and manager.use_groq_fallback:
        return _summarize_groq(text, chunks, manager)

    result = _summarize_local(text, chunks, manager)

    # Fallback to Groq if local result is too short
    if len(result["summary"]) < 100 and manager.use_groq_fallback:
        return _summarize_groq(text, chunks, manager)

    return result


def _summarize_local(full_text: str, chunks: list, manager) -> dict:
    """
    Mistral 7B summarization:
    - 4096 token context = can handle much more text per chunk
    - Summarize chunks in groups, then final combination
    """
    chunk_summaries = []

    for i, chunk in enumerate(chunks):
        try:
            summary = manager.generate_local(
                f"Summarize this section of educational notes. Include all key terms, definitions, and important concepts:\n\n{chunk}",
                system_prompt="You are an expert educational summarizer. Be thorough but concise. Include every important concept and definition.",
                max_tokens=300,
            )
            if summary.strip() and len(summary.strip()) > 15:
                chunk_summaries.append(summary.strip())
        except Exception as e:
            print(f"[Summary] Local chunk {i+1} error: {e}")
            continue

    if not chunk_summaries:
        return {
            "summary": "Failed to generate summary.",
            "model_used": "mistral_local",
            "chunks_processed": 0,
            "document_length": len(full_text)
        }

    # Combine — Mistral can handle more context than FLAN-T5
    # Combine in groups of 4-5 (fits in 4096 context)
    if len(chunk_summaries) <= 3:
        combined = "\n\n".join(chunk_summaries)
        final = manager.generate_local(
            f"Combine these summaries into one well-structured, comprehensive summary with clear section headings:\n\n{combined}",
            system_prompt="You are an expert at organizing educational content. Create a well-structured summary that covers all topics. Use clear headings for each section.",
            max_tokens=1000,
        )
    else:
        # Group in batches of 4
        mid_summaries = []
        for i in range(0, len(chunk_summaries), 4):
            group = "\n\n".join(chunk_summaries[i:i+4])
            mid = manager.generate_local(
                f"Combine these section summaries into one coherent summary. Keep all key concepts and definitions:\n\n{group}",
                system_prompt="You are an educational content organizer. Combine summaries while keeping all important details.",
                max_tokens=500,
            )
            if mid.strip():
                mid_summaries.append(mid.strip())

        # Final combination
        combined = "\n\n".join(mid_summaries)
        final = manager.generate_local(
            f"Create a comprehensive, well-structured summary from these sections. Use ## headings for each major topic. Include all key terms and definitions:\n\n{combined}",
            system_prompt="You are an expert educational summarizer. Create a final comprehensive summary with clear headings that covers ALL topics. Do not skip any section.",
            max_tokens=1500,
        )

    return {
        "summary": final.strip(),
        "model_used": "mistral_local",
        "chunks_processed": len(chunks),
        "document_length": len(full_text)
    }


def _summarize_groq(full_text: str, chunks: list, manager) -> dict:
    """Groq summarization — processes every chunk then combines."""
    chunk_summaries = []

    for i, chunk in enumerate(chunks):
        try:
            summary = manager.generate_groq(
                f"Summarize this section of an educational document. Be thorough, include all key terms, definitions, and concepts:\n\n{chunk}",
                system_prompt="You are an educational content summarizer. Capture every important concept, definition, and fact.",
                max_tokens=400
            )
            if summary.strip():
                chunk_summaries.append(summary.strip())
        except Exception as e:
            print(f"[Summary] Groq chunk {i+1} error: {e}")
            continue

    if not chunk_summaries:
        return {
            "summary": "Failed to generate summary. Please try again.",
            "model_used": "groq",
            "chunks_processed": 0,
            "document_length": len(full_text)
        }

    all_summaries = "\n\n".join([f"Part {i+1}:\n{s}" for i, s in enumerate(chunk_summaries)])

    try:
        final_summary = manager.generate_groq(
            f"Below are summaries of different parts of an educational document. "
            f"Combine them into ONE comprehensive, well-structured summary. "
            f"Use markdown headings (##) for each major topic/unit. "
            f"Include ALL key concepts, definitions, and important details from every part. "
            f"Do NOT skip any section.\n\n{all_summaries}",
            system_prompt=(
                "You are an expert at organizing educational content. "
                "Create a comprehensive structured summary that covers EVERY topic. "
                "Use ## headings. Include key terms, definitions, and important facts. "
                "Make sure NOTHING is left out."
            ),
            max_tokens=3000
        )
    except Exception as e:
        print(f"[Summary] Groq combine error: {e}")
        final_summary = "\n\n".join(chunk_summaries)

    return {
        "summary": final_summary.strip(),
        "model_used": "groq",
        "chunks_processed": len(chunks),
        "document_length": len(full_text)
    }