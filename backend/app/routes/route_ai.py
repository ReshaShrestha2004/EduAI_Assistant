from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from pydantic import BaseModel
from fastapi import Request
import mysql.connector

from ..utils.auth import decode_access_token
from database import execute_query

router = APIRouter(prefix="/ai", tags=["AI Features"])
security = HTTPBearer()



class QuestionRequest(BaseModel):
    question: str
    prefer: Optional[str] = "local"  

class GenerateRequest(BaseModel):
    prefer: Optional[str] = "local"
    num_items: Optional[int] = 10
    difficulty: Optional[str] = "all"



async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    return user_id


def get_document_path(document_id: int, user_id: int) -> str:
    """Get file path for a document, verifying ownership"""
    query = "SELECT file_path FROM documents WHERE id = %s AND user_id = %s"
    doc = execute_query(query, (document_id, user_id), fetch_one=True)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc["file_path"]


def log_activity(user_id: int, activity_type: str, title: str,
                 description: str = None, document_id: int = None):
    """Log activity and update streak"""
    from datetime import date, timedelta
    try:
        execute_query(
            "INSERT INTO activity_logs (user_id, activity_type, document_id, title, description) VALUES (%s, %s, %s, %s, %s)",
            (user_id, activity_type, document_id, title, description)
        )
        today = date.today()
        streak = execute_query("SELECT current_streak, longest_streak, last_activity_date FROM user_streaks WHERE user_id = %s", (user_id,), fetch_one=True)
        if not streak:
            execute_query("INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date) VALUES (%s, 1, 1, %s)", (user_id, today))
        else:
            last_date = streak["last_activity_date"]
            current = streak["current_streak"]
            longest = streak["longest_streak"]
            if last_date != today:
                current = current + 1 if last_date == today - timedelta(days=1) else 1
                if current > longest:
                    longest = current
                execute_query("UPDATE user_streaks SET current_streak=%s, longest_streak=%s, last_activity_date=%s WHERE user_id=%s", (current, longest, today, user_id))
        
        check = execute_query("SELECT id FROM user_stats WHERE user_id = %s", (user_id,), fetch_one=True)
        if not check:
            execute_query("INSERT INTO user_stats (user_id) VALUES (%s)", (user_id,))
    except Exception as e:
        print(f"Activity log error: {e}")




@router.get("/status")
async def get_ai_status(user_id: int = Depends(get_current_user_id)):
    """Get current AI model status"""
    from ..services.model_manager import ModelManager
    manager = ModelManager.get_instance()
    return manager.get_status()




@router.post("/documents/{document_id}/extract-text")
async def extract_document_text(
    document_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """Extract text from a PDF document"""
    file_path = get_document_path(document_id, user_id)

    try:
        from ..services.pdf_service import extract_text_from_pdf, clean_text, get_document_info

        raw_text = extract_text_from_pdf(file_path)
        cleaned = clean_text(raw_text)
        info = get_document_info(file_path)

        return {
            "document_id": document_id,
            "text": cleaned[:5000],  
            "full_length": len(cleaned),
            "info": info
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="PDF file not found on server")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")



@router.post("/documents/{document_id}/summarize")
async def summarize_document(
    document_id: int,
    body: GenerateRequest = GenerateRequest(),
    user_id: int = Depends(get_current_user_id)
):
    """Generate AI summary of a document"""
    file_path = get_document_path(document_id, user_id)

    try:
        from ..services.summary_service import summarize_document

        result = summarize_document(file_path, prefer=body.prefer)

        log_activity(user_id, "summary", f"Generated summary", "AI-powered document summarization", document_id)

        try:
            execute_query("UPDATE user_stats SET summaries_generated = summaries_generated + 1 WHERE user_id = %s", (user_id,))
        except Exception:
            pass

        return {
            "document_id": document_id,
            **result
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="PDF file not found on server")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")



@router.post("/documents/{document_id}/ask")
async def ask_document_question(
    document_id: int,
    body: QuestionRequest,
    user_id: int = Depends(get_current_user_id)
):
    """Ask a question about a document using RAG pipeline"""
    file_path = get_document_path(document_id, user_id)

    if not body.question or len(body.question.strip()) < 3:
        raise HTTPException(status_code=400, detail="Question is too short")

    try:
        from ..services.qa_service import ask_question

        result = ask_question(document_id, file_path, body.question, prefer=body.prefer)

        log_activity(user_id, "qa", f"Asked: {body.question[:80]}", "Document Q&A", document_id)

        try:
            execute_query("UPDATE user_stats SET qa_questions_asked = qa_questions_asked + 1 WHERE user_id = %s", (user_id,))
        except Exception:
            pass

        return {
            "document_id": document_id,
            "question": body.question,
            **result
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="PDF file not found on server")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Q&A failed: {str(e)}")



@router.post("/documents/{document_id}/flashcards")
async def generate_document_flashcards(
    document_id: int,
    body: GenerateRequest = GenerateRequest(),
    user_id: int = Depends(get_current_user_id)
):
    """Generate flashcards from a document"""
    file_path = get_document_path(document_id, user_id)

    try:
        from ..services.flashcard_service import generate_flashcards

        result = generate_flashcards(file_path, num_cards=body.num_items, prefer=body.prefer)

        log_activity(user_id, "flashcard", f"Generated {result.get('total', 0)} flashcards", "AI flashcard generation", document_id)

        try:
            count = result.get("total", 0)
            execute_query("UPDATE user_stats SET flashcards_created = flashcards_created + %s WHERE user_id = %s", (count, user_id))
        except Exception:
            pass

        return {
            "document_id": document_id,
            **result
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="PDF file not found on server")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Flashcard generation failed: {str(e)}")



@router.post("/documents/{document_id}/mcqs")
async def generate_document_mcqs(
    document_id: int,
    body: GenerateRequest = GenerateRequest(),
    user_id: int = Depends(get_current_user_id)
):
    """Generate MCQ quiz from a document"""
    file_path = get_document_path(document_id, user_id)

    try:
        from ..services.mcq_service import generate_mcqs

        result = generate_mcqs(
            file_path,
            num_questions=body.num_items,
            difficulty=body.difficulty,
            prefer=body.prefer
        )

        log_activity(user_id, "quiz", f"Generated {result.get('total', 0)} MCQs", "AI quiz generation", document_id)

        try:
            execute_query("UPDATE user_stats SET quizzes_taken = quizzes_taken + 1 WHERE user_id = %s", (user_id,))
        except Exception:
            pass

        return {
            "document_id": document_id,
            **result
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="PDF file not found on server")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MCQ generation failed: {str(e)}")
    


@router.post("/documents/{document_id}/recommendations")
async def generate_study_recommendations(
    document_id: int,
    request: Request,
    user_id: int = Depends(get_current_user_id)
):
    """Generate study recommendations based on quiz results"""
    try:
        body = await request.json()
        wrong_answers = body.get("wrong_answers", [])
        all_questions = body.get("all_questions", [])
        prefer = body.get("prefer", "local")

        file_path = get_document_path(document_id, user_id)

        from ..services.recommendation_service import generate_recommendations
        result = generate_recommendations(
            file_path=file_path,
            wrong_answers=wrong_answers,
            all_questions=all_questions,
            prefer=prefer
        )

        log_activity(user_id, "quiz", "Generated study recommendations",
                     f"Analyzed {len(wrong_answers)} incorrect answers", document_id)

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))