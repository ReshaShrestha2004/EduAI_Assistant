"""
EduAI MCQ Service
Uses Mistral 7B locally — can now generate proper JSON MCQs like Groq.
Difficulty filter works for both local and Groq.
"""

import json
import random

from .model_manager import ModelManager
from .pdf_service import extract_text_from_pdf, clean_text, chunk_text


def _get_difficulty_instruction(difficulty: str) -> str:
    """Get difficulty-specific prompt instructions"""
    if difficulty == "recall":
        return (
            "ALL questions must be RECALL level. Test basic factual knowledge. "
            "Use: 'What is...?', 'Which of the following...?', 'Define...', 'Name the...'"
        )
    elif difficulty == "comprehension":
        return (
            "ALL questions must be COMPREHENSION level. Test understanding, not memorization. "
            "Use: 'Why does...?', 'Explain why...', 'What is the difference between X and Y?', "
            "'How does X relate to Y?', 'Compare X and Y'"
        )
    elif difficulty == "application":
        return (
            "ALL questions must be APPLICATION level. Test ability to apply knowledge. "
            "Use: 'A student observes... what is happening?', "
            "'In an experiment where... what would you expect?', "
            "'Given that X happens, which process is responsible?'"
        )
    else:
        return (
            "Create a MIX: 3-4 RECALL ('What is...?'), "
            "3-4 COMPREHENSION ('Why does...?', 'Compare...'), "
            "2-3 APPLICATION ('A student observes...'). Label each."
        )


def _build_mcq_prompt(text: str, num_questions: int, difficulty: str) -> str:
    """Build the MCQ generation prompt — used by both local and Groq"""
    diff_instruction = _get_difficulty_instruction(difficulty)

    return f"""Based on the following educational text, generate exactly {num_questions} multiple-choice questions.

{diff_instruction}

Rules:
- Each question must have exactly 4 options
- Only ONE option should be correct
- Wrong options should be plausible but clearly incorrect
- Include a brief explanation for each correct answer

Text:
{text[:4500]}

Return ONLY a valid JSON array:
[
  {{
    "question": "Your question?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "difficulty": "recall",
    "explanation": "Why this is correct"
  }}
]"""


def _parse_mcq_response(response: str, difficulty: str) -> list:
    """Parse JSON MCQ response from either model"""
    try:
        cleaned = response.strip()

        # Remove markdown code fences
        if "```" in cleaned:
            # Find content between first ``` and last ```
            parts = cleaned.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("["):
                    cleaned = part
                    break

        # Find JSON array
        start = cleaned.find("[")
        end = cleaned.rfind("]") + 1
        if start != -1 and end > start:
            cleaned = cleaned[start:end]

        questions = json.loads(cleaned)

        valid = []
        for i, q in enumerate(questions):
            if isinstance(q, dict) and "question" in q and "options" in q:
                correct = q.get("correctAnswer", 0)
                if not isinstance(correct, int) or correct < 0 or correct >= len(q.get("options", [])):
                    correct = 0

                valid.append({
                    "id": i + 1,
                    "question": q["question"],
                    "options": q["options"][:4],
                    "correctAnswer": correct,
                    "difficulty": q.get("difficulty", difficulty if difficulty != "all" else "recall"),
                    "explanation": q.get("explanation", "")
                })

        return valid

    except (json.JSONDecodeError, KeyError, TypeError) as e:
        print(f"[MCQ] Parse error: {e}")
        return []


def generate_mcqs_local(text: str, num_questions: int = 10, difficulty: str = "all") -> list:
    """Generate MCQs using Mistral 7B — now generates proper JSON like Groq"""
    manager = ModelManager.get_instance()

    prompt = _build_mcq_prompt(text, num_questions, difficulty)

    try:
        response = manager.generate_local(
            prompt,
            system_prompt="You are an expert exam question creator. Generate high-quality MCQs. Return ONLY valid JSON array, no other text.",
            max_tokens=2500,
            temperature=0.4,
        )

        return _parse_mcq_response(response, difficulty)

    except Exception as e:
        print(f"[MCQ] Local error: {e}")
        return []


def generate_mcqs_groq(text: str, num_questions: int = 10, difficulty: str = "all") -> list:
    """Generate MCQs using Groq"""
    manager = ModelManager.get_instance()

    prompt = _build_mcq_prompt(text, num_questions, difficulty)

    try:
        response = manager.generate_groq(
            prompt,
            system_prompt="You are an expert exam question creator for educational assessments. Generate high-quality MCQs. Return ONLY valid JSON array, no markdown or extra text.",
            max_tokens=3000
        )

        return _parse_mcq_response(response, difficulty)

    except Exception as e:
        print(f"[MCQ] Groq error: {e}")
        return []


def generate_mcqs(file_path: str, num_questions: int = 10,
                  difficulty: str = "all", prefer: str = "local") -> dict:
    """Generate MCQs from a PDF document."""
    text = extract_text_from_pdf(file_path)

    if len(text) < 100:
        return {"questions": [], "model_used": "none", "error": "Document too short"}

    manager = ModelManager.get_instance()

    if prefer in ("groq", "groq_only") and manager.use_groq_fallback:
        questions = generate_mcqs_groq(text, num_questions, difficulty)
        if questions:
            return {"questions": questions, "total": len(questions), "model_used": "groq"}

    questions = generate_mcqs_local(text, num_questions, difficulty)

    if len(questions) < 3 and manager.use_groq_fallback:
        groq_questions = generate_mcqs_groq(text, num_questions, difficulty)
        if groq_questions:
            return {"questions": groq_questions, "total": len(groq_questions), "model_used": "groq_fallback"}

    return {"questions": questions, "total": len(questions), "model_used": "mistral_local"}