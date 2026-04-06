"""
EduAI MCQ Service
Fixed: Better question quality, correct answer validation, no obvious questions.
"""

import json
import random
import re

from .model_manager import ModelManager
from .pdf_service import extract_text_from_pdf, clean_text, chunk_text


def _get_difficulty_instruction(difficulty: str) -> str:
    if difficulty == "recall":
        return (
            "Generate RECALL level questions that test specific factual knowledge. "
            "Questions should require remembering specific details, definitions, or facts from the text. "
            "DO NOT make questions where the answer is obvious from the question wording. "
            "All 4 options must be plausible and related to the topic. "
            "Example: Instead of 'What does photosynthesis produce? A) Food B) Nothing C) Rocks D) Darkness', "
            "write 'Which of the following is a direct product of the light-dependent reactions of photosynthesis? "
            "A) Glucose B) ATP and NADPH C) Pyruvate D) Amino acids'"
        )
    elif difficulty == "comprehension":
        return (
            "Generate COMPREHENSION level questions that test deep understanding of concepts. "
            "Questions should require explaining WHY something happens, comparing processes, "
            "understanding cause and effect, or interpreting relationships between concepts. "
            "Use stems like: 'Why does...', 'What would happen if...', 'How does X differ from Y...', "
            "'Which best explains the relationship between...', 'What is the significance of...' "
            "All options must be detailed and plausible, not single words."
        )
    elif difficulty == "application":
        return (
            "Generate APPLICATION level questions that present real-world scenarios. "
            "Each question MUST describe a specific situation, experiment, or case study, "
            "then ask students to apply their knowledge to analyze it. "
            "Use stems like: 'A researcher observes that...', 'During an experiment...', "
            "'A patient presents with...', 'In a scenario where...', 'If a student measures...' "
            "Options should describe different possible explanations or outcomes. "
            "These questions should require critical thinking, not just memorization."
        )
    else:
        return (
            "Generate a MIX of difficulty levels: "
            "3 RECALL questions (specific factual details, not obvious), "
            "4 COMPREHENSION questions (why/how/compare/explain), "
            "3 APPLICATION questions (real scenarios requiring analysis). "
            "Label each question with its difficulty. "
            "IMPORTANT: No question should have an obvious answer. All 4 options must be plausible."
        )


def _build_mcq_prompt(text: str, num_questions: int, difficulty: str) -> str:
    diff_instruction = _get_difficulty_instruction(difficulty)

    # Pick a random section of the text each time to avoid repetitive questions
    words = text.split()
    total_words = len(words)
    max_words = 1200  # roughly 5000 chars

    if total_words <= max_words:
        selected_text = text
    else:
        # Pick a random starting point
        import random
        max_start = total_words - max_words
        start = random.randint(0, max_start)
        selected_text = " ".join(words[start:start + max_words])

    return f"""You are an expert exam creator for university-level assessments. Generate exactly {num_questions} high-quality multiple-choice questions based on the text below.

CRITICAL RULES:
1. {diff_instruction}
2. Every question MUST have exactly 4 options labeled as strings in an array.
3. The "correctAnswer" field MUST be the index (0, 1, 2, or 3) of the CORRECT option in the options array. Double-check this is accurate.
4. NEVER make the answer obvious from the question wording. If the question asks "What does X do?", do NOT include "X does [exact thing]" as an option.
5. All wrong options (distractors) must be plausible and related to the same topic. No joke answers, no "None of the above", no "All of the above".
6. Each option should be a meaningful phrase or sentence, NOT a single word.
7. Include a clear explanation for why the correct answer is right and why the others are wrong.
8. Vary which position (0, 1, 2, or 3) the correct answer appears in. Do NOT always put it in position 0.
9. Each question must test a DIFFERENT concept. No two questions should ask about the same topic.

Text to generate questions from:
{selected_text}

Return ONLY a valid JSON array with NO extra text, NO markdown, NO code fences:
[
  {{
    "question": "A detailed, thought-provoking question?",
    "options": ["Detailed option A", "Detailed option B", "Detailed option C", "Detailed option D"],
    "correctAnswer": 2,
    "difficulty": "recall",
    "explanation": "Option C is correct because... Option A is wrong because... Option B is wrong because..."
  }}
]

Generate exactly {num_questions} questions now:"""


def _parse_mcq_response(response: str, difficulty: str) -> list:
    """Parse and validate MCQ JSON response"""
    try:
        cleaned = response.strip()

        # Remove markdown code fences
        if "```" in cleaned:
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
            if not isinstance(q, dict):
                continue
            if "question" not in q or "options" not in q:
                continue

            options = q.get("options", [])
            if len(options) < 4:
                continue

            # Ensure exactly 4 options
            options = options[:4]

            # Validate correctAnswer
            correct = q.get("correctAnswer", 0)

            # Handle string correctAnswer (e.g., "B" or "Option B")
            if isinstance(correct, str):
                correct_lower = correct.strip().lower()
                if correct_lower in ["a", "0"]:
                    correct = 0
                elif correct_lower in ["b", "1"]:
                    correct = 1
                elif correct_lower in ["c", "2"]:
                    correct = 2
                elif correct_lower in ["d", "3"]:
                    correct = 3
                else:
                    # Try to find the correct answer text in options
                    found = False
                    for idx, opt in enumerate(options):
                        if correct.strip().lower() in opt.lower() or opt.lower() in correct.strip().lower():
                            correct = idx
                            found = True
                            break
                    if not found:
                        correct = 0

            if not isinstance(correct, int):
                try:
                    correct = int(correct)
                except (ValueError, TypeError):
                    correct = 0

            if correct < 0 or correct >= len(options):
                correct = 0

            # Validate the explanation matches the correct answer
            explanation = q.get("explanation", "")

            # Check if the correct answer text appears in the explanation
            # If explanation mentions a DIFFERENT option as correct, try to fix it
            if explanation:
                correct_option_text = options[correct].lower()[:30]
                explanation_lower = explanation.lower()

                # Look for patterns like "correct answer is X" or "X is correct"
                for idx, opt in enumerate(options):
                    opt_lower = opt.lower()[:30]
                    if idx != correct:
                        # Check if explanation says THIS option is correct
                        if (f"correct answer is {opt_lower[:15]}" in explanation_lower or
                            f"{opt_lower[:15]} is correct" in explanation_lower or
                            f"answer is {chr(65+idx).lower()}" in explanation_lower):
                            # The explanation suggests a different answer is correct
                            # Trust the explanation over the index
                            correct = idx
                            break

            q_difficulty = q.get("difficulty", difficulty if difficulty != "all" else "recall")
            if q_difficulty not in ("recall", "comprehension", "application"):
                q_difficulty = "recall"

            valid.append({
                "id": i + 1,
                "question": q["question"],
                "options": options,
                "correctAnswer": correct,
                "difficulty": q_difficulty,
                "explanation": explanation
            })

        return valid

    except (json.JSONDecodeError, KeyError, TypeError) as e:
        print(f"[MCQ] Parse error: {e}")
        print(f"[MCQ] Raw response: {response[:500]}")
        return []


def generate_mcqs_local(text: str, num_questions: int = 10, difficulty: str = "all") -> list:
    """Generate MCQs using local model"""
    manager = ModelManager.get_instance()
    prompt = _build_mcq_prompt(text, num_questions, difficulty)

    try:
        response = manager.generate_local(
            prompt,
            system_prompt="You are an expert university exam creator. Generate challenging, high-quality MCQs. Return ONLY valid JSON array. Double-check that correctAnswer index matches the actual correct option.",
            max_tokens=3000,
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
            system_prompt="You are an expert university exam creator. Generate challenging, high-quality MCQs that truly test understanding. Return ONLY valid JSON array with no markdown. CRITICAL: Verify that the correctAnswer index points to the actually correct option.",
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