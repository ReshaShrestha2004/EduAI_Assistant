import json
import random

from .model_manager import ModelManager
from .pdf_service import extract_text_from_pdf, clean_text, chunk_text


def generate_mcqs_local(text: str, num_questions: int = 10) -> list:
    """Generate MCQs using FLAN-T5 locally"""
    manager = ModelManager.get_instance()

    chunks = chunk_text(text, chunk_size=400, overlap=50)
    questions = []
    q_id = 1

    selected_chunks = chunks[:min(num_questions, len(chunks))]

    for i, chunk in enumerate(selected_chunks):
        if q_id > num_questions:
            break

        difficulty = ["recall", "comprehension", "application"][i % 3]

        prompt = f"Generate a multiple choice question about this text:\n{chunk[:800]}\nQuestion:"

        try:
            question_text = manager.generate_flan_t5(prompt, max_length=80, min_length=10)

            a_prompt = f"Answer this question:\nQuestion: {question_text}\nContext: {chunk[:500]}\nAnswer:"
            correct_answer = manager.generate_flan_t5(a_prompt, max_length=60, min_length=5)

            d_prompt = f"Give 3 wrong answers for:\nQuestion: {question_text}\nCorrect: {correct_answer}\nWrong answers:"
            distractors_text = manager.generate_flan_t5(d_prompt, max_length=150, min_length=10)

            distractors = [d.strip().strip("-•123.)") for d in distractors_text.split("\n") if d.strip() and len(d.strip()) > 2]
            while len(distractors) < 3:
                distractors.append(f"None of the above")
            distractors = distractors[:3]

            options = distractors + [correct_answer]
            random.shuffle(options)
            correct_index = options.index(correct_answer)

            if len(question_text.strip()) > 10 and len(correct_answer.strip()) > 3:
                questions.append({
                    "id": q_id,
                    "question": question_text.strip(),
                    "options": options,
                    "correctAnswer": correct_index,
                    "difficulty": difficulty,
                    "explanation": f"The correct answer is: {correct_answer.strip()}"
                })
                q_id += 1
        except Exception:
            continue

    return questions


def generate_mcqs_groq(text: str, num_questions: int = 10, difficulty: str = "all") -> list:
    """Generate MCQs using Groq — with proper difficulty enforcement"""
    manager = ModelManager.get_instance()

    # Build difficulty-specific instructions
    if difficulty == "recall":
        diff_instruction = (
            "ALL questions must be RECALL level only. These test basic factual knowledge. "
            "Use question stems like: 'What is...?', 'Which of the following is...?', "
            "'Name the...', 'Define...', 'What does X stand for?'. "
            "Answers should be direct facts from the text."
        )
    elif difficulty == "comprehension":
        diff_instruction = (
            "ALL questions must be COMPREHENSION level only. These test understanding, not just memorization. "
            "Use question stems like: 'Why does...?', 'Explain why...', 'What is the difference between X and Y?', "
            "'What would happen if...?', 'How does X relate to Y?', 'Compare X and Y'. "
            "Answers require understanding of concepts, not just repeating facts."
        )
    elif difficulty == "application":
        diff_instruction = (
            "ALL questions must be APPLICATION level only. These test ability to apply knowledge to new scenarios. "
            "Use question stems like: 'A student observes... what is happening?', "
            "'In an experiment where... what would you expect?', "
            "'Given that X happens, which process is responsible?', "
            "'A doctor finds... what is the likely cause?'. "
            "Present real-world scenarios that require applying the concepts from the text."
        )
    else:
        diff_instruction = (
            "Create a MIX of difficulty levels: "
            "3-4 RECALL questions (basic facts: 'What is...?'), "
            "3-4 COMPREHENSION questions (understanding: 'Why does...?', 'Compare X and Y'), "
            "2-3 APPLICATION questions (scenarios: 'A student observes... what process is this?'). "
            "Label each question with its difficulty level."
        )

    prompt = f"""Based on the following educational text, generate exactly {num_questions} multiple-choice questions.

{diff_instruction}

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- Only ONE option should be correct
- Wrong options should be plausible but clearly incorrect
- Include an explanation for each correct answer

Text:
{text[:5000]}

Return ONLY a valid JSON array with this structure:
[
  {{
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "difficulty": "recall",
    "explanation": "Explanation of correct answer"
  }}
]"""

    try:
        response = manager.generate_groq(
            prompt,
            system_prompt="You are an expert exam question creator for educational assessments. Generate high-quality MCQs. Return ONLY valid JSON array, no markdown or extra text.",
            max_tokens=3000
        )

        # Parse JSON
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

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

    except Exception as e:
        print(f"[MCQ] Groq parse error: {e}")
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

    questions = generate_mcqs_local(text, num_questions)

    if len(questions) < 3 and manager.use_groq_fallback:
        groq_questions = generate_mcqs_groq(text, num_questions, difficulty)
        if groq_questions:
            return {"questions": groq_questions, "total": len(groq_questions), "model_used": "groq_fallback"}

    return {"questions": questions, "total": len(questions), "model_used": "flan_t5_local"}