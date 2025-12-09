from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import timedelta
import mysql.connector

from ..models.user import UserCreate, UserLogin, UserResponse, Token
from ..utils.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from database import execute_query, get_db_connection


router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    """
    Register a new user
    """
    # Check if user already exists (use fetch_one for single row)
    check_query = "SELECT id FROM users WHERE email = %s"
    existing_user = execute_query(check_query, (user.email,), fetch_one=True)
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(user.password)

    # Insert new user (execute_query returns lastrowid when not fetch/fetch_one)
    insert_query = """
        INSERT INTO users (email, hashed_password, full_name, created_at)
        VALUES (%s, %s, %s, NOW())
    """
    try:
        user_id = execute_query(
            insert_query,
            (user.email, hashed_password, user.full_name)
        )
        
        # Retrieve created user (fetch_one for a single user)
        get_user_query = """
            SELECT id, email, full_name, created_at 
            FROM users 
            WHERE id = %s
        """
        user_data = execute_query(get_user_query, (user_id,), fetch_one=True)
        
        return UserResponse(**user_data)
    
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """
    Login user and return JWT token
    """
    query = """
        SELECT id, email, hashed_password, full_name 
        FROM users 
        WHERE email = %s
    """

    user = execute_query(query, (user_credentials.email,), fetch_one=True)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Verify password
    if not verify_password(user_credentials.password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['email'], "user_id": user['id']},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current logged-in user information
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    email = payload.get("sub")
    user_id = payload.get("user_id")

    if email is None or user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Get user from database
    query = """
        SELECT id, email, full_name, created_at 
        FROM users 
        WHERE id = %s
    """

    user = execute_query(query, (user_id,), fetch_one=True)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse(**user)

@router.post("/logout")
async def logout():
    """
    Logout endpoint (client should discard token)
    """
    return {"message": "Successfully logged out. Please discard your token."}
