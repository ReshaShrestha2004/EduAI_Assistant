"""
EduAI Flashcard Service
Uses Mistral 7B locally for much better flashcard generation than FLAN-T5.
"""

import re
from .model_manager import ModelManager
from .pdf_service import extract_text_from_pdf


STOP_ENTITIES = {
    'whatsapp', 'email', 'gmail', 'megalecture', 'mega lecture',
    'youtube', 'http', 'www', 'com', 'org', 'page',
    'copyright', 'refined', 'kmq', 'pdf', 'doc'
}


def _is_valid_term(term: str) -> bool:
    lower = term.lower().strip()

    if len(lower) < 3:
        return False

    # Reject exact stop terms only (not substring matches)
    if lower in STOP_ENTITIES:
        return False

    # Reject numeric-only terms
    if re.match(r'^[\d\s\.\-\+]+$', lower):
        return False

    if '@' in lower or 'http' in lower or 'www' in lower:
        return False

    return True


def generate_flashcards_local(text: str, num_cards: int = 20) -> list:
    """Generate flashcards using Mistral 7B locally"""

    manager = ModelManager.get_instance()

    prompt = f"""
Based on the following educational text, generate exactly {num_cards} study flashcards.

Create a mix of:
- Definition cards (easy): "What is X?" with clear definitions
- Concept cards (medium): explain relationships and significance
- Example cards (hard): application and deeper understanding

Text:
{text[:3500]}

Return the flashcards in this exact format, one per line:
TYPE|DIFFICULTY|FRONT|BACK

Where:
TYPE = definition / concept / example
DIFFICULTY = easy / medium / hard

Generate {num_cards} flashcards now.
"""

    try:
        response = manager.generate_local(
            prompt,
            system_prompt="You are an expert educational content creator. Generate high-quality study flashcards. Return ONLY the flashcards in the pipe-separated format.",
            max_tokens=2000,
        )

        print("\n[Flashcard] MODEL OUTPUT:")
        print(response)

        return _parse_flashcard_response(response)

    except Exception as e:
        print(f"[Flashcard] Local error: {e}")
        return []


def generate_flashcards_groq(text: str, num_cards: int = 20) -> list:
    """Generate flashcards using Groq"""

    manager = ModelManager.get_instance()

    prompt = f"""
Based on the following educational text, generate exactly {num_cards} study flashcards.

Create a mix of:
- Definition cards (easy)
- Concept cards (medium)
- Example/Application cards (hard)

Text:
{text[:5000]}

Return the flashcards in this exact format, one per line:
TYPE|DIFFICULTY|FRONT|BACK

Where:
TYPE = definition / concept / example
DIFFICULTY = easy / medium / hard

Generate {num_cards} flashcards now.
"""

    try:
        response = manager.generate_groq(
            prompt,
            system_prompt="You are an expert educational content creator. Generate high-quality study flashcards covering major topics. Return ONLY the pipe-separated flashcards.",
            max_tokens=2000
        )

        print("\n[Flashcard] GROQ OUTPUT:")
        print(response)

        return _parse_flashcard_response(response)

    except Exception as e:
        print(f"[Flashcard] Groq error: {e}")
        return []


def _parse_flashcard_response(response: str) -> list:
    """Parse pipe-separated flashcards from model output"""

    flashcards = []
    card_id = 1

    for line in response.strip().split("\n"):

        line = line.strip()

        if not line:
            continue

        # Remove numbered lists like "1. definition|..."
        line = re.sub(r'^\d+\.\s*', '', line)

        if "|" not in line:
            continue

        parts = line.split("|")

        if len(parts) < 4:
            continue

        card_type = parts[0].strip().lower()
        difficulty = parts[1].strip().lower()
        front = parts[2].strip()
        back = "|".join(parts[3:]).strip()

        if card_type not in ("definition", "concept", "example"):
            card_type = "concept"

        if difficulty not in ("easy", "medium", "hard"):
            difficulty = "medium"

        if (
            front
            and back
            and len(front) > 5
            and len(back) > 5
            and _is_valid_term(front)
        ):
            flashcards.append({
                "id": card_id,
                "type": card_type,
                "difficulty": difficulty,
                "front": front,
                "back": back
            })

            card_id += 1

    return flashcards


def generate_flashcards(file_path: str, num_cards: int = 20, prefer: str = "local") -> dict:
    """Generate flashcards from a PDF document."""

    text = extract_text_from_pdf(file_path)

    if len(text) < 100:
        return {
            "flashcards": [],
            "model_used": "none",
            "error": "Document too short"
        }

    manager = ModelManager.get_instance()

    # Groq preferred
    if prefer in ("groq", "groq_only") and manager.use_groq_fallback:

        flashcards = generate_flashcards_groq(text, num_cards)

        if flashcards:
            return {
                "flashcards": flashcards,
                "total": len(flashcards),
                "model_used": "groq"
            }

    # Local Mistral
    flashcards = generate_flashcards_local(text, num_cards)

    # Fallback to Groq if local produced too few cards
    if len(flashcards) < 5 and manager.use_groq_fallback:

        groq_cards = generate_flashcards_groq(text, num_cards)

        if groq_cards:
            return {
                "flashcards": groq_cards,
                "total": len(groq_cards),
                "model_used": "groq_fallback"
            }

    return {
        "flashcards": flashcards,
        "total": len(flashcards),
        "model_used": "mistral_local"
    }