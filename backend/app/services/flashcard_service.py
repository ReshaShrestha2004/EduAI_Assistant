import re
import random
from collections import Counter

from .model_manager import ModelManager
from .pdf_service import extract_text_from_pdf, clean_text, chunk_text


# Words to omit in fc 
STOP_ENTITIES = {
    'whatsapp', 'email', 'gmail', 'megalecture', 'mega lecture', 'youtube',
    'http', 'www', 'com', 'org', 'page', 'copyright', 'refined', 'kmq',
    'pdf', 'doc', 'the', 'this', 'that', 'which', 'they', 'them', 'their',
    'what', 'where', 'when', 'how', 'who', 'why', 'will', 'would', 'could',
    'should', 'also', 'just', 'very', 'much', 'many', 'some', 'any', 'all',
    'each', 'every', 'both', 'most', 'more', 'less', 'than', 'then',
}


def extract_key_terms(text: str, max_terms: int = 30) -> list:
    """Extract key terms using spaCy NER + noun chunk frequency"""
    manager = ModelManager.get_instance()
    nlp = manager.get_spacy()

    # Process cleaned text
    doc = nlp(text[:50000])

    entities = []
    for ent in doc.ents:
        if ent.label_ in ("PERSON", "ORG", "GPE", "EVENT", "WORK_OF_ART",
                          "LAW", "PRODUCT", "NORP", "FAC"):
            clean_ent = ent.text.strip()
            if _is_valid_term(clean_ent):
                entities.append(clean_ent)

    noun_chunks = []
    for chunk in doc.noun_chunks:
        text_clean = chunk.text.strip()
        if len(text_clean) > 3 and len(text_clean.split()) <= 5 and _is_valid_term(text_clean):
            noun_chunks.append(text_clean)

    all_terms = entities + noun_chunks
    term_counts = Counter(all_terms)

    top_terms = [term for term, count in term_counts.most_common(max_terms * 2)
                 if count >= 2 and len(term) > 3 and _is_valid_term(term)]

    unique_terms = []
    seen_lower = set()
    for term in top_terms:
        lower = term.lower()
        if lower not in seen_lower:
            seen_lower.add(lower)
            unique_terms.append(term)

    return unique_terms[:max_terms]


def _is_valid_term(term: str) -> bool:
    """Check if a term is valid for flashcard generation"""
    lower = term.lower().strip()

    # Skip very short terms
    if len(lower) < 3:
        return False

    # Skip stop entities
    for stop in STOP_ENTITIES:
        if stop in lower:
            return False

    # Skip if it's just numbers
    if re.match(r'^[\d\s\.\-\+]+$', lower):
        return False

    # Skip URLs and emails
    if '@' in lower or 'http' in lower or 'www' in lower:
        return False

    return True


def get_term_context(text: str, term: str, window: int = 300) -> str:
    """Find the context around a term"""
    lower_text = text.lower()
    lower_term = term.lower()
    idx = lower_text.find(lower_term)

    if idx == -1:
        return ""

    start = max(0, idx - window)
    end = min(len(text), idx + len(term) + window)

    return text[start:end].strip()


def generate_flashcards_local(text: str, terms: list) -> list:
    """Generate flashcards using FLAN-T5"""
    manager = ModelManager.get_instance()
    flashcards = []
    card_id = 1

    for term in terms[:15]:
        context = get_term_context(text, term)
        if not context or len(context) < 30:
            continue

        # Definition card 
        prompt = f"Define '{term}' based on this context:\n{context[:500]}\nDefinition:"
        try:
            definition = manager.generate_flan_t5(prompt, max_length=100, min_length=10)
            if len(definition.strip()) > 10 and _is_valid_term(definition):
                flashcards.append({
                    "id": card_id,
                    "type": "definition",
                    "difficulty": "easy",
                    "front": f"What is {term}?",
                    "back": definition.strip()
                })
                card_id += 1
        except Exception:
            pass

        # Concept card 
        prompt = f"Explain why '{term}' is important based on:\n{context[:500]}\nExplanation:"
        try:
            explanation = manager.generate_flan_t5(prompt, max_length=120, min_length=15)
            if len(explanation.strip()) > 15 and _is_valid_term(explanation):
                flashcards.append({
                    "id": card_id,
                    "type": "concept",
                    "difficulty": "medium",
                    "front": f"Explain the significance of {term}.",
                    "back": explanation.strip()
                })
                card_id += 1
        except Exception:
            pass

    return flashcards


def generate_flashcards_groq(text: str, num_cards: int = 20) -> list:
    """Generate flashcards using Groq"""
    manager = ModelManager.get_instance()

    prompt = f"""Based on the following educational text, generate exactly {num_cards} study flashcards.

Create a mix of:
- Definition cards (easy): "What is X?" → clear definition
- Concept cards (medium): "Explain X" or "How does X relate to Y?" → deeper understanding  
- Example/Application cards (hard): "Give an example of X" or "Why is X important?" → application

Rules:
- Every flashcard must be about actual educational content from the text
- Front should be a clear question
- Back should be a complete, accurate answer
- Cover different topics from across the entire text

Text:
{text[:5000]}

Return flashcards in this exact format, one per line:
TYPE|DIFFICULTY|FRONT|BACK

Where TYPE is definition/concept/example and DIFFICULTY is easy/medium/hard.

Generate {num_cards} flashcards now:"""

    try:
        response = manager.generate_groq(
            prompt,
            system_prompt="You are an expert educational content creator. Generate high-quality study flashcards that cover all major topics in the text. Return ONLY the flashcards in the pipe-separated format, nothing else.",
            max_tokens=2000
        )

        flashcards = []
        card_id = 1

        for line in response.strip().split("\n"):
            line = line.strip()
            if not line or "|" not in line:
                continue

            parts = line.split("|")
            if len(parts) >= 4:
                card_type = parts[0].strip().lower()
                difficulty = parts[1].strip().lower()
                front = parts[2].strip()
                back = "|".join(parts[3:]).strip()

                if card_type not in ("definition", "concept", "example"):
                    card_type = "concept"
                if difficulty not in ("easy", "medium", "hard"):
                    difficulty = "medium"

                if front and back and len(front) > 5 and len(back) > 5:
                    flashcards.append({
                        "id": card_id,
                        "type": card_type,
                        "difficulty": difficulty,
                        "front": front,
                        "back": back
                    })
                    card_id += 1

        return flashcards

    except Exception as e:
        print(f"[Flashcard] Groq error: {e}")
        return []


def generate_flashcards(file_path: str, num_cards: int = 20, prefer: str = "local") -> dict:
    """Generate flashcards from a PDF document."""
    text = extract_text_from_pdf(file_path)

    if len(text) < 100:
        return {"flashcards": [], "model_used": "none", "error": "Document too short"}

    manager = ModelManager.get_instance()

    if prefer in ("groq", "groq_only") and manager.use_groq_fallback:
        flashcards = generate_flashcards_groq(text, num_cards)
        if flashcards:
            return {"flashcards": flashcards, "total": len(flashcards), "model_used": "groq"}

    terms = extract_key_terms(text)
    flashcards = generate_flashcards_local(text, terms)

    if len(flashcards) < 5 and manager.use_groq_fallback:
        groq_cards = generate_flashcards_groq(text, num_cards)
        if groq_cards:
            return {"flashcards": groq_cards, "total": len(groq_cards), "model_used": "groq_fallback"}

    return {
        "flashcards": flashcards,
        "total": len(flashcards),
        "model_used": "flan_t5_local",
        "key_terms_found": len(terms)
    }