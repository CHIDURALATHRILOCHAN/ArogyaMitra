from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    responses = Column(JSON, nullable=False)  # stores all 12 answers
    completed = Column(Boolean, default=True)
    completed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="assessments")
