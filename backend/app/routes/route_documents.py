from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
import os
import uuid
from pathlib import Path
import mysql.connector

from ..models.document import DocumentUpload, DocumentResponse
from ..utils.auth import decode_access_token
from database import execute_query

router = APIRouter(prefix="/documents", tags=["Documents"])
security = HTTPBearer()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user ID from token"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    return user_id


def log_activity(user_id: int, activity_type: str, title: str, description: str = None, document_id: int = None):
    """Helper to log activity and update streak from within routes"""
    from datetime import date, timedelta

    try:
        # Insert activity log
        insert_query = """
            INSERT INTO activity_logs (user_id, activity_type, document_id, title, description)
            VALUES (%s, %s, %s, %s, %s)
        """
        execute_query(insert_query, (user_id, activity_type, document_id, title, description))

        # Update streak
        today = date.today()
        streak_query = "SELECT current_streak, longest_streak, last_activity_date FROM user_streaks WHERE user_id = %s"
        streak = execute_query(streak_query, (user_id,), fetch_one=True)

        if not streak:
            execute_query(
                "INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date) VALUES (%s, 1, 1, %s)",
                (user_id, today)
            )
        else:
            last_date = streak['last_activity_date']
            current = streak['current_streak']
            longest = streak['longest_streak']

            if last_date != today:
                if last_date == today - timedelta(days=1):
                    current += 1
                else:
                    current = 1

                if current > longest:
                    longest = current

                execute_query(
                    "UPDATE user_streaks SET current_streak = %s, longest_streak = %s, last_activity_date = %s WHERE user_id = %s",
                    (current, longest, today, user_id)
                )

        # Ensure user_stats exists
        check = execute_query("SELECT id FROM user_stats WHERE user_id = %s", (user_id,), fetch_one=True)
        if not check:
            execute_query("INSERT INTO user_stats (user_id) VALUES (%s)", (user_id,))

    except Exception as e:
        # Don't fail the main request if activity logging fails
        print(f"Activity logging error: {e}")


@router.post("/upload", response_model=DocumentUpload)
async def upload_document(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id)
):
    """
    Upload a PDF document
    """
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    try:
        # Save file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        file_size = len(contents)
        
        # Save to database
        insert_query = """
            INSERT INTO documents (user_id, filename, original_filename, file_path, file_size, file_type)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        document_id = execute_query(
            insert_query,
            (user_id, unique_filename, file.filename, str(file_path), file_size, 'application/pdf')
        )
        
        # Get uploaded document
        get_doc_query = """
            SELECT id, filename, original_filename, file_size, uploaded_at
            FROM documents
            WHERE id = %s
        """
        document = execute_query(get_doc_query, (document_id,), fetch_one=True)

        # Log the upload activity
        log_activity(
            user_id=user_id,
            activity_type='upload',
            title=f'Uploaded "{file.filename}"',
            description=f'PDF document ({file_size / 1024:.1f} KB)',
            document_id=document_id
        )
        
        return DocumentUpload(**document)
    
    except Exception as e:
        # Clean up file if database insert fails
        if file_path.exists():
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.get("/", response_model=List[DocumentResponse])
async def get_user_documents(user_id: int = Depends(get_current_user_id)):
    """
    Get all documents for current user
    """
    query = """
        SELECT id, user_id, filename, original_filename, file_path, file_size, file_type, uploaded_at
        FROM documents
        WHERE user_id = %s
        ORDER BY uploaded_at DESC
    """
    
    documents = execute_query(query, (user_id,), fetch=True)
    
    if not documents:
        return []
    
    return [DocumentResponse(**doc) for doc in documents]


@router.get("/count")
async def get_document_count(user_id: int = Depends(get_current_user_id)):
    """
    Get total document count for current user
    """
    query = "SELECT COUNT(*) as count FROM documents WHERE user_id = %s"
    result = execute_query(query, (user_id,), fetch_one=True)
    
    return {"count": result['count'] if result else 0}


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """
    Get specific document details
    """
    query = """
        SELECT id, user_id, filename, original_filename, file_path, file_size, file_type, uploaded_at
        FROM documents
        WHERE id = %s AND user_id = %s
    """
    
    document = execute_query(query, (document_id, user_id), fetch_one=True)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return DocumentResponse(**document)


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """
    Delete a document
    """
    # Get document to get file path
    get_query = """
        SELECT file_path, original_filename
        FROM documents
        WHERE id = %s AND user_id = %s
    """
    document = execute_query(get_query, (document_id, user_id), fetch_one=True)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    original_filename = document['original_filename']

    delete_query = "DELETE FROM documents WHERE id = %s AND user_id = %s"
    execute_query(delete_query, (document_id, user_id))
    
    file_path = Path(document['file_path'])
    if file_path.exists():
        os.remove(file_path)

    log_activity(
        user_id=user_id,
        activity_type='delete',
        title=f'Deleted "{original_filename}"',
        description='Document removed from library',
        document_id=None  
    )
    
    return {"message": "Document deleted successfully"}