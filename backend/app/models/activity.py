from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

#first
class ActivityLog(BaseModel):
    """Model for activity log entry"""
    id: int
    user_id: int
    activity_type: str
    document_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityCreate(BaseModel):
    """Model for creating a new activity"""
    activity_type: str
    document_id: Optional[int] = None
    title: str
    description: Optional[str] = None


class UserStreak(BaseModel):
    """Model for user streak data"""
    current_streak: int = 0
    longest_streak: int = 0
    last_activity_date: Optional[str] = None


class UserStats(BaseModel):
    """Model for user statistics"""
    documents_uploaded: int = 0
    flashcards_created: int = 0
    quizzes_taken: int = 0
    quiz_best_score: int = 0
    summaries_generated: int = 0
    qa_questions_asked: int = 0
    study_streak: int = 0


class DashboardData(BaseModel):
    """Combined model for dashboard response"""
    stats: UserStats
    recent_activity: List[ActivityLog] = []
    streak: UserStreak