from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON, String
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    week_start = Column(String, nullable=False)  # ISO date string
    plan_data = Column(JSON, nullable=False)      # 7-day structured plan
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="workout_plans")
