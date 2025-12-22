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
        SELECT file_path
        FROM documents
        WHERE id = %s AND user_id = %s
    """
    document = execute_query(get_query, (document_id, user_id), fetch_one=True)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Delete from database
    delete_query = "DELETE FROM documents WHERE id = %s AND user_id = %s"
    execute_query(delete_query, (document_id, user_id))
    
    # Delete physical file
    file_path = Path(document['file_path'])
    if file_path.exists():
        os.remove(file_path)
    
    return {"message": "Document deleted successfully"}