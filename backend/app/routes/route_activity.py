from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Dict, Any
from datetime import date, timedelta
import mysql.connector

from ..models.activity import ActivityLog, ActivityCreate, UserStreak, UserStats, DashboardData
from ..utils.auth import decode_access_token
from database import execute_query

router = APIRouter(prefix="/activity", tags=["Activity"])
security = HTTPBearer()


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


def update_streak(user_id: int):
    """
    Update user streak based on activity.
    Called whenever a new activity is logged.
    """
    today = date.today()

    # Get current streak record
    streak_query = "SELECT current_streak, longest_streak, last_activity_date FROM user_streaks WHERE user_id = %s"
    streak = execute_query(streak_query, (user_id,), fetch_one=True)

    if not streak:
        insert_query = """
            INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
            VALUES (%s, 1, 1, %s)
        """
        execute_query(insert_query, (user_id, today))
        return

    last_date = streak['last_activity_date']
    current = streak['current_streak']
    longest = streak['longest_streak']

    if last_date == today:
        return

    if last_date == today - timedelta(days=1):
        current += 1
    else:
        current = 1

    if current > longest:
        longest = current

    update_query = """
        UPDATE user_streaks
        SET current_streak = %s, longest_streak = %s, last_activity_date = %s
        WHERE user_id = %s
    """
    execute_query(update_query, (current, longest, today, user_id))


def ensure_user_stats(user_id: int):
    """Ensure user_stats row exists for the given user"""
    check = execute_query("SELECT id FROM user_stats WHERE user_id = %s", (user_id,), fetch_one=True)
    if not check:
        execute_query("INSERT INTO user_stats (user_id) VALUES (%s)", (user_id,))


@router.post("/log", response_model=ActivityLog)
async def log_activity(
    activity: ActivityCreate,
    user_id: int = Depends(get_current_user_id)
):
    """
    Log a user activity and update streak + stats
    """
    try:
        # Insert activity log
        insert_query = """
            INSERT INTO activity_logs (user_id, activity_type, document_id, title, description)
            VALUES (%s, %s, %s, %s, %s)
        """
        activity_id = execute_query(
            insert_query,
            (user_id, activity.activity_type, activity.document_id, activity.title, activity.description)
        )

        # Update streak
        update_streak(user_id)

        # Update user stats
        ensure_user_stats(user_id)

        stat_column_map = {
            'upload': None,  
            'summary': 'summaries_generated',
            'flashcard': 'flashcards_created',
            'quiz': 'quizzes_taken',
            'qa': 'qa_questions_asked',
        }

        stat_col = stat_column_map.get(activity.activity_type)
        if stat_col:
            update_stat_query = f"""
                UPDATE user_stats SET {stat_col} = {stat_col} + 1 WHERE user_id = %s
            """
            execute_query(update_stat_query, (user_id,))

        get_query = """
            SELECT id, user_id, activity_type, document_id, title, description, created_at
            FROM activity_logs WHERE id = %s
        """
        logged = execute_query(get_query, (activity_id,), fetch_one=True)

        return ActivityLog(**logged)

    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/recent", response_model=List[ActivityLog])
async def get_recent_activity(
    limit: int = 10,
    user_id: int = Depends(get_current_user_id)
):
    """
    Get recent activity for the current user
    """
    try:
        query = """
            SELECT id, user_id, activity_type, document_id, title, description, created_at
            FROM activity_logs
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s
        """
        activities = execute_query(query, (user_id, limit), fetch=True)

        if not activities:
            return []

        return [ActivityLog(**a) for a in activities]

    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/streak", response_model=UserStreak)
async def get_user_streak(user_id: int = Depends(get_current_user_id)):
    """
    Get current user's streak data
    """
    try:
        query = "SELECT current_streak, longest_streak, last_activity_date FROM user_streaks WHERE user_id = %s"
        streak = execute_query(query, (user_id,), fetch_one=True)

        if not streak:
            return UserStreak()

        today = date.today()
        last_date = streak['last_activity_date']

        if last_date and last_date < today - timedelta(days=1):
            execute_query(
                "UPDATE user_streaks SET current_streak = 0 WHERE user_id = %s",
                (user_id,)
            )
            return UserStreak(
                current_streak=0,
                longest_streak=streak['longest_streak'],
                last_activity_date=str(last_date) if last_date else None
            )

        return UserStreak(
            current_streak=streak['current_streak'],
            longest_streak=streak['longest_streak'],
            last_activity_date=str(last_date) if last_date else None
        )

    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/stats", response_model=UserStats)
async def get_user_stats(user_id: int = Depends(get_current_user_id)):
    """
    Get combined stats for the current user's dashboard
    """
    try:
        # Document count
        doc_query = "SELECT COUNT(*) as count FROM documents WHERE user_id = %s"
        doc_result = execute_query(doc_query, (user_id,), fetch_one=True)
        doc_count = doc_result['count'] if doc_result else 0

        # User stats
        stats_query = """
            SELECT flashcards_created, quizzes_taken, quiz_best_score,
                   summaries_generated, qa_questions_asked
            FROM user_stats WHERE user_id = %s
        """
        stats = execute_query(stats_query, (user_id,), fetch_one=True)

        # Streak
        streak_query = "SELECT current_streak FROM user_streaks WHERE user_id = %s"
        streak = execute_query(streak_query, (user_id,), fetch_one=True)

        # Check streak validity
        streak_val = 0
        if streak:
            today = date.today()
            last_date_query = "SELECT last_activity_date FROM user_streaks WHERE user_id = %s"
            last_result = execute_query(last_date_query, (user_id,), fetch_one=True)
            if last_result and last_result['last_activity_date']:
                last_date = last_result['last_activity_date']
                if last_date >= today - timedelta(days=1):
                    streak_val = streak['current_streak']

        return UserStats(
            documents_uploaded=doc_count,
            flashcards_created=stats['flashcards_created'] if stats else 0,
            quizzes_taken=stats['quizzes_taken'] if stats else 0,
            quiz_best_score=stats['quiz_best_score'] if stats else 0,
            summaries_generated=stats['summaries_generated'] if stats else 0,
            qa_questions_asked=stats['qa_questions_asked'] if stats else 0,
            study_streak=streak_val,
        )

    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard_data(user_id: int = Depends(get_current_user_id)):
    """
    Get all dashboard data in a single call
    """
    try:
        # Reuse the individual endpoints logic
        stats = await get_user_stats(user_id)
        streak = await get_user_streak(user_id)

        # Recent activity
        activity_query = """
            SELECT id, user_id, activity_type, document_id, title, description, created_at
            FROM activity_logs
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 10
        """
        activities = execute_query(activity_query, (user_id,), fetch=True)
        recent = [ActivityLog(**a) for a in activities] if activities else []

        return DashboardData(
            stats=stats,
            recent_activity=recent,
            streak=streak
        )

    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )