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

    prompt = f"""Generate exactly {num_cards} study flashcards from this text.

RULES:
1. Every QUESTION must be a real question ending with a question mark
2. Every ANSWER must be a factual response, NOT a question
3. NEVER put a statement or fact as the question
4. NEVER put a question as the answer

BAD example (DO NOT do this):
definition|easy|Food consists of carbohydrates, proteins and fats.|What are the components of food?

GOOD example (DO this):
definition|easy|What are the main components of food?|Carbohydrates, proteins, fats, vitamins, minerals, and water.
concept|medium|Why is the small intestine important for digestion?|It is where most chemical digestion and absorption of nutrients occurs due to its large surface area created by villi.
example|hard|A student eats only rice for a week. What deficiency symptoms might appear?|They may develop protein deficiency symptoms such as muscle wasting and weakness, as rice alone lacks sufficient protein.

Text:
{text[:3500]}

Format: TYPE|DIFFICULTY|QUESTION|ANSWER
One per line. Generate {num_cards} now:
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

    prompt = f"""Generate exactly {num_cards} study flashcards from this text.

RULES:
1. Every QUESTION must be a real question ending with a question mark
2. Every ANSWER must be a factual response, NOT a question
3. NEVER put a statement or fact as the question
4. NEVER put a question as the answer

BAD example (DO NOT do this):
definition|easy|Food consists of carbohydrates, proteins and fats.|What are the components of food?

GOOD example (DO this):
definition|easy|What are the main components of food?|Carbohydrates, proteins, fats, vitamins, minerals, and water.
concept|medium|Why is the small intestine important for digestion?|It is where most chemical digestion and absorption of nutrients occurs due to its large surface area created by villi.
example|hard|A student eats only rice for a week. What deficiency symptoms might appear?|They may develop protein deficiency symptoms such as muscle wasting and weakness, as rice alone lacks sufficient protein.

Text:
{text[:3500]}

Format: TYPE|DIFFICULTY|QUESTION|ANSWER
One per line. Generate {num_cards} now:
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

def _ensure_question_front(front: str, back: str) -> tuple:
    """Make sure the front is a question and back is the answer"""
    front_clean = front.strip()
    back_clean = back.strip()
    
    front_is_question = front_clean.endswith('?')
    back_is_question = back_clean.endswith('?')

    if back_is_question and not front_is_question:
        return back_clean, front_clean
    
    if not front_is_question:
        q_starters = ('what ', 'how ', 'why ', 'when ', 'where ', 'which ', 'who ',
                       'define ', 'explain ', 'describe ', 'name ', 'list ', 'identify ')
        front_starts_q = any(front_clean.lower().startswith(s) for s in q_starters)
        back_starts_q = any(back_clean.lower().startswith(s) for s in q_starters)
        
        if back_starts_q and not front_starts_q:
            return back_clean, front_clean
    
    return front_clean, back_clean

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

        # Handle 4-part format: TYPE|DIFFICULTY|QUESTION|ANSWER
        if len(parts) >= 4:
            first = parts[0].strip().lower()
            second = parts[1].strip().lower()

            if first in ("definition", "concept", "example") and second in ("easy", "medium", "hard"):
                card_type = first
                difficulty = second
                front = parts[2].strip()
                back = "|".join(parts[3:]).strip()
            elif first in ("easy", "medium", "hard"):
                # 3-part with difficulty first: DIFFICULTY|QUESTION|ANSWER (extra pipes in answer)
                difficulty = first
                card_type = "concept"
                front = parts[1].strip()
                back = "|".join(parts[2:]).strip()
            else:
                card_type = "concept"
                difficulty = "medium"
                front = parts[0].strip()
                back = "|".join(parts[1:]).strip()

        # Handle 3-part format: DIFFICULTY|QUESTION|ANSWER
        elif len(parts) == 3:
            first = parts[0].strip().lower()

            if first in ("easy", "medium", "hard"):
                difficulty = first
                card_type = "concept"
                front = parts[1].strip()
                back = parts[2].strip()
            elif first in ("definition", "concept", "example"):
                card_type = first
                difficulty = "medium"
                front = parts[1].strip()
                back = parts[2].strip()
            else:
                card_type = "concept"
                difficulty = "medium"
                front = parts[0].strip()
                back = "|".join(parts[1:]).strip()

        # Handle 2-part format: QUESTION|ANSWER
        elif len(parts) == 2:
            card_type = "concept"
            difficulty = "medium"
            front = parts[0].strip()
            back = parts[1].strip()

        else:
            continue

        front, back = _ensure_question_front(front, back)

        if card_type not in ("definition", "concept", "example"):
            card_type = "concept"

        if difficulty not in ("easy", "medium", "hard"):
            difficulty = "medium"

        if (
            front
            and back
            and len(front) > 5
            and len(back) > 5
            and _is_valid_term(back)
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