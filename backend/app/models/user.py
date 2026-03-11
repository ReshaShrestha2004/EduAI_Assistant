from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    """Model for user registration"""
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    full_name: Optional[str] = Field(None, max_length=255)

class UserLogin(BaseModel):
    """Model for user login"""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Model for user response (without password)"""
    id: int
    email: str
    full_name: Optional[str]
    usertype: Optional[str] = "user"
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    """Model for JWT token response"""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Model for decoded token data"""
    email: Optional[str] = None
    user_id: Optional[int] = None