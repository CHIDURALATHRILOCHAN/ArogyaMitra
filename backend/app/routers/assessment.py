from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.assessment import Assessment
from app.models.user import User
from app.schemas.schemas import AssessmentCreate, AssessmentOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/assessment", tags=["Assessment"])

ASSESSMENT_QUESTIONS = [
    {"id": "age", "question": "What is your age?", "type": "number", "placeholder": "22"},
    {"id": "gender", "question": "What is your gender?", "type": "options", "options": ["Male", "Female", "Other"]},
    {"id": "height_cm", "question": "What is your height (in cm)?", "type": "number", "placeholder": "170"},
    {"id": "weight_kg", "question": "What is your weight (in kg)?", "type": "number", "placeholder": "e.g., 75"},
    {"id": "fitness_level", "question": "What is your current fitness level?", "type": "options", "options": ["Beginner", "Intermediate", "Advanced"]},
    {"id": "fitness_goal", "question": "What is your primary fitness goal?", "type": "options", "options": ["Weight Loss", "Muscle Gain", "General Fitness", "Strength Training", "Endurance"]},
    {"id": "workout_location", "question": "Where do you prefer to work out?", "type": "options", "options": ["Home", "Gym", "Outdoor", "Mixed"]},
    {"id": "workout_time", "question": "When do you prefer to work out?", "type": "options", "options": ["Morning", "Evening"]},
    {"id": "medical_history", "question": "Do you have any medical history? (Optional)", "type": "text", "placeholder": "e.g., Heart condition, Hypertension, etc."},
    {"id": "health_conditions", "question": "Do you have any current health conditions? (Optional)", "type": "text", "placeholder": "e.g., Diabetes, Asthma, Arthritis, etc."},
    {"id": "injuries", "question": "Do you have any injuries or physical limitations? (Optional)", "type": "text", "placeholder": "e.g., Knee pain, lower back issues..."},
    {"id": "equipment", "question": "What equipment do you have access to?", "type": "options", "options": ["No equipment (bodyweight)", "Basic Home Gym", "Full Gym Access"]},
    {"id": "diet_type", "question": "What is your diet type?", "type": "options", "options": ["No restriction", "Vegetarian", "Vegan", "Keto", "High-protein"]},
    {"id": "motivation", "question": "What motivates you most?", "type": "options", "options": ["Looking better", "Feeling healthier", "More energy", "Stress relief", "Competition"]}
]


@router.get("/questions")
async def get_questions():
    return {"questions": ASSESSMENT_QUESTIONS}


@router.post("/submit", response_model=AssessmentOut, status_code=201)
async def submit_assessment(data: AssessmentCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Sync user profile fields if provided
    responses = data.responses
    if "age" in responses and responses["age"]:
        current_user.age = int(responses["age"])
    if "gender" in responses and responses["gender"]:
        current_user.gender = responses["gender"]
    if "height_cm" in responses and responses["height_cm"]:
        current_user.height_cm = int(responses["height_cm"])
    if "weight_kg" in responses and responses["weight_kg"]:
        current_user.weight_kg = int(responses["weight_kg"])

    assessment = Assessment(user_id=current_user.id, responses=responses)
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return assessment


@router.get("/status")
async def assessment_status(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assessment).where(Assessment.user_id == current_user.id).order_by(Assessment.completed_at.desc()))
    assessment = result.scalars().first()
    return {"completed": assessment is not None, "assessment_id": assessment.id if assessment else None}


@router.get("/latest", response_model=AssessmentOut)
async def get_latest(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assessment).where(Assessment.user_id == current_user.id).order_by(Assessment.completed_at.desc()))
    assessment = result.scalars().first()
    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment found")
    return assessment
