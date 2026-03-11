from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentUpload(BaseModel):
    """Model for document upload response"""
    id: int
    filename: str
    original_filename: str
    file_size: int
    uploaded_at: datetime

class DocumentResponse(BaseModel):
    """Model for document details"""
    id: int
    user_id: int
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    file_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True