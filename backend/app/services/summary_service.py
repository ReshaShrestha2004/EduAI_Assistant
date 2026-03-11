from .model_manager import ModelManager
from .pdf_service import extract_text_from_pdf, clean_text, chunk_text


def summarize_document(file_path: str, prefer: str = "local") -> dict:
    """
    Summarize an entire PDF document.
    Both local and Groq now process ALL content.
    """
    text = extract_text_from_pdf(file_path)

    if len(text) < 100:
        return {
            "summary": "The document contains too little text to summarize.",
            "model_used": "none",
            "chunks_processed": 0,
            "document_length": len(text)
        }

    manager = ModelManager.get_instance()

    # Split into chunks
    chunks = chunk_text(text, chunk_size=500, overlap=50)

    if prefer in ("groq", "groq_only") and manager.use_groq_fallback:
        return _summarize_groq(text, chunks, manager)

    result = _summarize_local(text, chunks, manager)

    if len(result["summary"]) < 100 and manager.use_groq_fallback:
        return _summarize_groq(text, chunks, manager)

    return result


def _summarize_groq(full_text: str, chunks: list, manager) -> dict:
    """
    Groq strategy: summarize EACH chunk, then combine ALL into final summary.
    This ensures no content is missed even for long documents.
    """
    #  Summarize each chunk individually
    chunk_summaries = []

    for i, chunk in enumerate(chunks):
        try:
            summary = manager.generate_groq(
                f"Summarize this section of an educational document. Be thorough, include all key terms, definitions, and concepts:\n\n{chunk}",
                system_prompt="You are an educational content summarizer. Capture every important concept, definition, and fact. Be concise but thorough.",
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

    # Combine all chunk summaries into final structured summary
    all_summaries = "\n\n".join([f"Part {i+1}:\n{s}" for i, s in enumerate(chunk_summaries)])

    try:
        final_summary = manager.generate_groq(
            f"Below are summaries of different parts of an educational document. "
            f"Combine them into ONE comprehensive, well-structured summary. "
            f"Use markdown headings (##) for each major topic/unit. "
            f"Include ALL key concepts, definitions, and important details from every part. "
            f"Do NOT skip any section.\n\n"
            f"{all_summaries}",
            system_prompt=(
                "You are an expert at organizing educational content. "
                "Create a comprehensive structured summary that covers EVERY topic from the document. "
                "Use ## headings for major topics. Include key terms, definitions, and important facts. "
                "The summary should be useful for studying and exam preparation. "
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


def _summarize_local(full_text: str, chunks: list, manager) -> dict:
    """
    FLAN-T5 strategy: summarize each chunk, combine in groups of 3.
    """
    chunk_summaries = []

    for i, chunk in enumerate(chunks):
        try:
            prompt = f"Summarize the following educational text:\n{chunk[:1500]}"
            summary = manager.generate_flan_t5(prompt, max_length=200, min_length=20)
            if summary.strip() and len(summary.strip()) > 15:
                chunk_summaries.append(summary.strip())
        except Exception as e:
            print(f"[Summary] FLAN-T5 chunk {i+1} error: {e}")
            continue

    if not chunk_summaries:
        return {
            "summary": "Failed to generate summary.",
            "model_used": "flan_t5_local",
            "chunks_processed": 0,
            "document_length": len(full_text)
        }

    if len(chunk_summaries) <= 3:
        combined = " ".join(chunk_summaries)
        prompt = f"Combine these summaries into one coherent summary:\n{combined[:1500]}"
        final = manager.generate_flan_t5(prompt, max_length=400, min_length=50)
    else:
        mid_summaries = []
        for i in range(0, len(chunk_summaries), 3):
            group = " ".join(chunk_summaries[i:i+3])
            prompt = f"Combine these summaries:\n{group[:1500]}"
            mid = manager.generate_flan_t5(prompt, max_length=200, min_length=30)
            if mid.strip():
                mid_summaries.append(mid.strip())

        combined = " ".join(mid_summaries)
        prompt = f"Create a comprehensive summary:\n{combined[:1500]}"
        final = manager.generate_flan_t5(prompt, max_length=500, min_length=50)

    return {
        "summary": final.strip(),
        "model_used": "flan_t5_local",
        "chunks_processed": len(chunks),
        "document_length": len(full_text)
    }