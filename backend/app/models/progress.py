from sqlalchemy import Column, Integer, ForeignKey, DateTime, Float, String
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Progress(Base):
    __tablename__ = "progress_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    log_date = Column(String, nullable=False)   # ISO date string
    workouts_done = Column(Integer, default=0)
    calories_burned = Column(Float, default=0.0)
    healthy_meals = Column(Integer, default=0)
    water_glasses = Column(Integer, default=0)
    mood = Column(Integer, default=5)           # 1-10 scale
    weight_kg = Column(Float, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="progress_logs")
