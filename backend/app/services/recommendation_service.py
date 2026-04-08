"""
EduAI Recommendation Service
Analyzes quiz results to identify weak topics and generate personalized study recommendations.
"""

import json
from .model_manager import ModelManager
from .pdf_service import extract_text_from_pdf


def generate_recommendations(file_path: str, wrong_answers: list, all_questions: list, prefer: str = "local") -> dict:
    """
    Analyze quiz results and generate study recommendations.
    
    wrong_answers: list of { questionIndex, question, correctAnswer, userAnswer, explanation, difficulty }
    all_questions: list of all quiz questions with their details
    """
    manager = ModelManager.get_instance()
    
    if not wrong_answers:
        return {
            "recommendations": [],
            "weak_topics": [],
            "summary": "You answered all questions correctly. Keep up the excellent work!",
            "overall_performance": "excellent",
            "model_used": "none"
        }
    
    # Extract document text for context
    try:
        doc_text = extract_text_from_pdf(file_path)
    except Exception:
        doc_text = ""
    
    # Build the analysis prompt
    wrong_details = []
    for wa in wrong_answers[:10]:  # Limit to 10 for prompt length
        wrong_details.append(
            f"Question: {wa.get('question', 'N/A')}\n"
            f"Correct Answer: {wa.get('correctAnswer', 'N/A')}\n"
            f"Student's Answer: {wa.get('userAnswer', 'N/A')}\n"
            f"Difficulty: {wa.get('difficulty', 'N/A')}"
        )
    
    wrong_text = "\n\n".join(wrong_details)
    
    total_questions = len(all_questions)
    wrong_count = len(wrong_answers)
    score_pct = round(((total_questions - wrong_count) / total_questions) * 100)
    
    prompt = f"""A student just completed a quiz and got {wrong_count} out of {total_questions} questions wrong (scored {score_pct}%).

Here are the questions they got wrong:

{wrong_text}

Based on these mistakes, provide personalized study recommendations. Address the user directly using "you" and "your" (NOT "the student"). Be professional but warm.

IMPORTANT: Keep ALL descriptions and tips concise. Each "why_weak" must be exactly 1 sentence. Each study tip must be exactly 1 short sentence. Each study_plan step must be exactly 1 short sentence.

Return ONLY valid JSON with no extra text:
{{
  "weak_topics": [
    {{
      "topic": "Name of the weak topic",
      "description": "One sentence describing what this topic covers",
      "why_weak": "One sentence explaining why you struggled with this, addressing the user as you",
      "study_tips": ["Short tip 1", "Short tip 2", "Short tip 3"],
      "priority": "high/medium/low"
    }}
  ],
  "overall_analysis": "A short paragraph analyzing your performance and patterns in your mistakes. Address the user as you.",
  "study_plan": [
    "Short actionable step 1",
    "Short actionable step 2",
    "Short actionable step 3"
  ],
  "encouragement": "A brief encouraging message addressing the user as you"
}}"""

    system_prompt = (
        "You are an expert educational advisor speaking directly to a student. "
        "Always address them as 'you' and 'your', never say 'the student'. "
        "Be professional, encouraging, and concise. Keep all text short and actionable. "
        "Return ONLY valid JSON."
    )

    try:
        if prefer in ("groq", "groq_only") and manager.use_groq_fallback:
            response = manager.generate_groq(prompt, system_prompt=system_prompt, max_tokens=1500)
            model_used = "groq"
        else:
            response = manager.generate_local(prompt, system_prompt=system_prompt, max_tokens=1500)
            model_used = "mistral_local"
        
        # Parse JSON response
        cleaned = response.strip()
        if "```" in cleaned:
            for part in cleaned.split("```"):
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    cleaned = part
                    break
        
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start != -1 and end > start:
            cleaned = cleaned[start:end]
        
        result = json.loads(cleaned)
        
        # Determine overall performance level
        if score_pct >= 90:
            performance = "excellent"
        elif score_pct >= 70:
            performance = "good"
        elif score_pct >= 50:
            performance = "satisfactory"
        else:
            performance = "needs_improvement"
        
        return {
            "weak_topics": result.get("weak_topics", []),
            "overall_analysis": result.get("overall_analysis", ""),
            "study_plan": result.get("study_plan", []),
            "encouragement": result.get("encouragement", ""),
            "score": score_pct,
            "wrong_count": wrong_count,
            "total_questions": total_questions,
            "overall_performance": performance,
            "model_used": model_used,
        }
        
    except (json.JSONDecodeError, Exception) as e:
        print(f"[Recommendations] Error: {e}")
        
        # Fallback: basic analysis without AI
        topics = set()
        for wa in wrong_answers:
            q = wa.get("question", "")
            words = q.lower().split()
            for word in words:
                if len(word) > 5 and word not in ("which", "following", "about", "between", "would", "should", "could"):
                    topics.add(word.capitalize())
        
        return {
            "weak_topics": [{"topic": t, "description": "", "why_weak": "You answered a question about this incorrectly", "study_tips": ["Review this topic in your notes", "Create flashcards for key terms", "Practice more questions on this topic"], "priority": "medium"} for t in list(topics)[:5]],
            "overall_analysis": f"You scored {score_pct}% on this quiz, getting {wrong_count} out of {total_questions} questions wrong. Review the topics listed below to strengthen your understanding.",
            "study_plan": ["Review the incorrect answers and their explanations", "Generate flashcards for the weak topics identified", "Take another quiz focusing on the areas you struggled with"],
            "encouragement": "Every mistake is a learning opportunity. Focus on the weak areas and you will improve!",
            "score": score_pct,
            "wrong_count": wrong_count,
            "total_questions": total_questions,
            "overall_performance": "satisfactory" if score_pct >= 50 else "needs_improvement",
            "model_used": "fallback",
        }