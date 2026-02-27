from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


# ─── Auth Schemas ───────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    """Full registration — all fitness preference fields"""
    email: EmailStr
    username: str
    password: str
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    fitness_level: Optional[str] = "beginner"
    fitness_goal: Optional[str] = "maintenance"
    workout_preference: Optional[str] = "home"
    diet_preference: Optional[str] = "no_restriction"


# Backward-compat alias
UserCreate = UserRegister


class UserLogin(BaseModel):
    username: Optional[str] = None   # Login with username
    email: Optional[str] = None      # or email
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    role: str = "user"
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    fitness_level: Optional[str] = None
    fitness_goal: Optional[str] = None
    workout_preference: Optional[str] = None
    diet_preference: Optional[str] = None
    streak_days: int = 0
    total_workouts: int = 0
    google_calendar_email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─── Assessment Schemas ──────────────────────────────────────────────────────

class AssessmentCreate(BaseModel):
    responses: Dict[str, Any]


class AssessmentOut(BaseModel):
    id: int
    responses: Dict[str, Any]
    completed: bool
    completed_at: datetime

    class Config:
        from_attributes = True


# ─── Workout Schemas ─────────────────────────────────────────────────────────

class WorkoutPlanOut(BaseModel):
    id: int
    week_start: str
    plan_data: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class WorkoutLogEntry(BaseModel):
    exercise: str
    sets_completed: int
    reps_completed: int
    notes: Optional[str] = None


# ─── Nutrition Schemas ────────────────────────────────────────────────────────

class MealPlanOut(BaseModel):
    id: int
    week_start: str
    plan_data: Dict[str, Any]
    grocery_list: Optional[Dict[str, Any]] = None
    macros_summary: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Coach / Chat Schemas ─────────────────────────────────────────────────────

class ArogyaCoachMessage(BaseModel):
    """Message sent to the AROMI AI coach"""
    message: str
    user_status: Optional[str] = "normal"       # normal | traveling | recovering | fatigued
    workout_plan: Optional[Dict[str, Any]] = None
    nutrition_plan: Optional[Dict[str, Any]] = None


class DynamicPlanAdjustmentRequest(BaseModel):
    """Adjust an existing plan based on life circumstances"""
    reason: str                      # travel | injury | time_constraint | health_issue
    duration_days: int
    current_plan: Dict[str, Any]
    user_data: Dict[str, Any]


class ChatMessageIn(BaseModel):
    message: str
    context: Optional[str] = None


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Progress Schemas ─────────────────────────────────────────────────────────

class ProgressLog(BaseModel):
    log_date: str
    workouts_done: int = 0
    calories_burned: float = 0.0
    healthy_meals: int = 0
    water_glasses: int = 0
    mood: int = 5
    weight_kg: Optional[float] = None
    notes: Optional[str] = None


class ProgressOut(ProgressLog):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
