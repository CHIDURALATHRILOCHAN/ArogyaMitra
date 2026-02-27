from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class FitnessGoal(str, enum.Enum):
    WEIGHT_LOSS = "weight_loss"
    WEIGHT_GAIN = "weight_gain"
    MUSCLE_GAIN = "muscle_gain"
    MAINTENANCE = "maintenance"
    ENDURANCE = "endurance"
    GENERAL_FITNESS = "general_fitness"


class WorkoutPreference(str, enum.Enum):
    HOME = "home"
    GYM = "gym"
    OUTDOOR = "outdoor"
    HYBRID = "hybrid"


class DietPreference(str, enum.Enum):
    VEGETARIAN = "vegetarian"
    NON_VEGETARIAN = "non_vegetarian"
    VEGAN = "vegan"
    KETO = "keto"
    PALEO = "paleo"
    NO_RESTRICTION = "no_restriction"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")

    # Physical profile
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)

    # Fitness preferences
    fitness_level = Column(String, default="beginner")   # beginner / intermediate / advanced
    fitness_goal = Column(String, nullable=True)          # FitnessGoal values
    workout_preference = Column(String, nullable=True)    # WorkoutPreference values
    diet_preference = Column(String, nullable=True)       # DietPreference values

    # Medical
    medical_history = Column(String, nullable=True)
    health_conditions = Column(String, nullable=True)
    injuries = Column(String, nullable=True)

    # Platform stats
    is_active = Column(Boolean, default=True)
    streak_days = Column(Integer, default=0)
    total_workouts = Column(Integer, default=0)
    total_donations = Column(Integer, default=0)

    # Google Calendar integration
    google_calendar_token = Column(String, nullable=True)
    google_calendar_email = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assessments = relationship("Assessment", back_populates="user", cascade="all, delete")
    workout_plans = relationship("WorkoutPlan", back_populates="user", cascade="all, delete")
    meal_plans = relationship("MealPlan", back_populates="user", cascade="all, delete")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete")
    progress_logs = relationship("Progress", back_populates="user", cascade="all, delete")
