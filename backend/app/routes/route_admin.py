from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Dict, Any
import mysql.connector

from ..models.user import UserResponse
from ..utils.auth import decode_access_token
from database import execute_query


router = APIRouter(prefix="/admin", tags=["Admin"])
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current logged-in user from token
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
        SELECT id, email, full_name, usertype, created_at 
        FROM users 
        WHERE id = %s
    """
    user = execute_query(query, (user_id,), fetch_one=True)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


async def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify that the current user is an admin
    """
    user = await get_current_user(credentials)
    
    if user['usertype'] != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return user


@router.get("/stats")
async def get_admin_stats(current_admin: dict = Depends(verify_admin)) -> Dict[str, int]:
    """
    Get admin dashboard statistics
    Requires admin privileges
    """
    try:
        # Get total users count
        total_users_query = "SELECT COUNT(*) as count FROM users"
        total_users_result = execute_query(total_users_query, fetch_one=True)
        total_users = total_users_result['count'] if total_users_result else 0
        
        # Get total documents count (you can modify this when you have documents table)
        # For now, returning 0 as placeholder
        total_documents = 0
        
        # Try to get document count if table exists
        try:
            total_docs_query = "SELECT COUNT(*) as count FROM documents"
            total_docs_result = execute_query(total_docs_query, fetch_one=True)
            total_documents = total_docs_result['count'] if total_docs_result else 0
        except mysql.connector.Error:
            # Documents table doesn't exist yet, that's fine
            total_documents = 0
        
        # Get active users (users created in last 30 days as a metric)
        # You can modify this to track last_login when you implement that feature
        active_users_query = """
            SELECT COUNT(*) as count 
            FROM users 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        """
        active_users_result = execute_query(active_users_query, fetch_one=True)
        active_users = active_users_result['count'] if active_users_result else 0
        
        return {
            "totalUsers": total_users,
            "totalDocuments": total_documents,
            "activeUsers": active_users
        }
    
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/users/recent", response_model=List[UserResponse])
async def get_recent_users(
    limit: int = 10,
    current_admin: dict = Depends(verify_admin)
) -> List[UserResponse]:
    """
    Get recently registered users
    Requires admin privileges
    """
    try:
        query = """
            SELECT id, email, full_name, usertype, created_at 
            FROM users 
            ORDER BY created_at DESC 
            LIMIT %s
        """
        
        users = execute_query(query, (limit,), fetch=True)
        
        if not users:
            return []
        
        return [UserResponse(**user) for user in users]
    
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    current_admin: dict = Depends(verify_admin)
) -> List[UserResponse]:
    """
    Get all users
    Requires admin privileges
    """
    try:
        query = """
            SELECT id, email, full_name, usertype, created_at 
            FROM users 
            ORDER BY created_at DESC
        """
        
        users = execute_query(query, fetch=True)
        
        if not users:
            return []
        
        return [UserResponse(**user) for user in users]
    
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    current_admin: dict = Depends(verify_admin)
) -> UserResponse:
    """
    Get specific user by ID
    Requires admin privileges
    """
    try:
        query = """
            SELECT id, email, full_name, usertype, created_at 
            FROM users 
            WHERE id = %s
        """
        
        user = execute_query(query, (user_id,), fetch_one=True)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )
        
        return UserResponse(**user)
    
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_admin: dict = Depends(verify_admin)
) -> Dict[str, str]:
    """
    Delete a user by ID
    Requires admin privileges
    Note: Cannot delete admin users
    """
    try:
        # First check if user exists and is not an admin
        check_query = """
            SELECT id, usertype 
            FROM users 
            WHERE id = %s
        """
        user = execute_query(check_query, (user_id,), fetch_one=True)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )
        
        if user['usertype'] == 'admin':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete admin users"
            )
        
        # Delete the user
        delete_query = "DELETE FROM users WHERE id = %s"
        execute_query(delete_query, (user_id,))
        
        return {"message": f"User with ID {user_id} has been deleted successfully"}
    
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/stats/usertype")
async def get_users_by_type(
    current_admin: dict = Depends(verify_admin)
) -> Dict[str, int]:
    """
    Get count of users by usertype
    Requires admin privileges
    """
    try:
        query = """
            SELECT usertype, COUNT(*) as count 
            FROM users 
            GROUP BY usertype
        """
        
        results = execute_query(query, fetch=True)
        
        # Convert to dictionary
        user_counts = {}
        if results:
            for row in results:
                user_counts[row['usertype']] = row['count']
        
        return user_counts
    
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )