from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.progress import Progress
from app.models.user import User
from app.schemas.schemas import ProgressLog, ProgressOut
from app.routers.auth import get_current_user
from typing import List
from datetime import date, timedelta

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.post("/log", response_model=ProgressOut, status_code=201)
async def log_progress(data: ProgressLog, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Upsert for today
    result = await db.execute(select(Progress).where(Progress.user_id == current_user.id, Progress.log_date == data.log_date))
    existing = result.scalar_one_or_none()
    if existing:
        existing.workouts_done += data.workouts_done
        existing.calories_burned += data.calories_burned
        existing.healthy_meals += data.healthy_meals
        existing.water_glasses += data.water_glasses
        if data.mood != 5:
            existing.mood = data.mood
        if data.weight_kg is not None:
            existing.weight_kg = data.weight_kg
        if data.notes:
            existing.notes = f"{existing.notes}\n{data.notes}" if existing.notes else data.notes
        
        current_user.total_workouts = (current_user.total_workouts or 0) + data.workouts_done
        await db.commit()
        await db.refresh(existing)
        return existing

    log = Progress(user_id=current_user.id, **data.model_dump())
    db.add(log)
    # Update user totals
    current_user.total_workouts = (current_user.total_workouts or 0) + data.workouts_done
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/dashboard")
async def dashboard(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Last 30 days
    thirty_ago = str(date.today() - timedelta(days=30))
    result = await db.execute(select(Progress).where(Progress.user_id == current_user.id, Progress.log_date >= thirty_ago).order_by(Progress.log_date.asc()))
    logs = result.scalars().all()

    total_workouts = sum(l.workouts_done for l in logs)
    total_calories = sum(l.calories_burned for l in logs)
    total_meals = sum(l.healthy_meals for l in logs)

    # Weekly
    seven_ago = str(date.today() - timedelta(days=7))
    week_result = await db.execute(select(Progress).where(Progress.user_id == current_user.id, Progress.log_date >= seven_ago))
    week_logs = week_result.scalars().all()

    return {
        "streak": current_user.streak_days,
        "total_workouts": current_user.total_workouts,
        "this_month": {"workouts": total_workouts, "calories_burned": total_calories, "healthy_meals": total_meals},
        "this_week": {
            "workouts": sum(l.workouts_done for l in week_logs),
            "calories": sum(l.calories_burned for l in week_logs),
            "meals": sum(l.healthy_meals for l in week_logs),
        },
        "chart_data": [{"date": l.log_date, "workouts": l.workouts_done, "calories": l.calories_burned, "meals": l.healthy_meals, "water": l.water_glasses, "mood": l.mood, "weight": l.weight_kg} for l in logs],
        "charity_impact": {"amount_donated": current_user.total_donations, "people_impacted": current_user.total_donations // 100, "workouts_done": current_user.total_workouts, "healthy_meals": total_meals}
    }


@router.get("/history", response_model=List[ProgressOut])
async def history(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Progress).where(Progress.user_id == current_user.id).order_by(Progress.log_date.desc()).limit(30))
    return result.scalars().all()
