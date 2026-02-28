from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.chat import ChatMessage
from app.routers.auth import get_current_user
from app.services.ai_agent import ai_agent
from app.schemas.schemas import ArogyaCoachMessage, DynamicPlanAdjustmentRequest

router = APIRouter(prefix="/coach", tags=["AI Coach — AROMI"])


@router.post("/chat")
async def aromi_coach_chat(
    request: ArogyaCoachMessage,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Chat with AROMI — the ArogyaMitra AI wellness coach.

    Accepts optional context fields:
    - user_status: normal | traveling | recovering | fatigued
    - workout_plan: user's current workout plan (for context)
    - nutrition_plan: user's current nutrition plan (for context)
    """
    # Load up to 10 previous messages for conversation context
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(10)
    )
    history = result.scalars().all()
    history_messages = [
        {"role": msg.role, "content": msg.content}
        for msg in reversed(history)
    ]

    # Build user context for AROMI
    user_context = {
        "name": current_user.full_name or current_user.username,
        "fitness_goal": current_user.fitness_goal,
        "fitness_level": current_user.fitness_level,
        "workout_preference": current_user.workout_preference,
        "diet_preference": current_user.diet_preference,
        "injuries": current_user.injuries,
        "health_conditions": current_user.health_conditions,
        "streak_days": current_user.streak_days,
    }
    if request.workout_plan:
        user_context["current_workout_plan"] = request.workout_plan
    if request.nutrition_plan:
        user_context["current_nutrition_plan"] = request.nutrition_plan

    # Add user's message to history and get AI response
    history_messages.append({"role": "user", "content": request.message})
    ai_reply = await ai_agent.chat_with_aromi(
        messages=history_messages,
        user_context=user_context,
        user_status=request.user_status or "normal"
    )

    # Persist both user message and AI reply
    user_msg = ChatMessage(user_id=current_user.id, role="user", content=request.message)
    ai_msg = ChatMessage(user_id=current_user.id, role="assistant", content=ai_reply)
    db.add(user_msg)
    db.add(ai_msg)
    await db.commit()

    return {"reply": ai_reply, "user_status": request.user_status}


@router.post("/adjust-plan")
async def adjust_plan_dynamically(
    request: DynamicPlanAdjustmentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Dynamically adjust an existing workout/nutrition plan due to life changes.

    Supported reasons:
    - "travel"            → hotel-room bodyweight workout
    - "injury"            → avoid injured area, low-impact alternatives
    - "time_constraint"  → quick HIIT sessions (20 min max)
    - "health_issue"      → gentle, recovery-focused plan
    """
    user_data = {
        "name": current_user.full_name or current_user.username,
        "fitness_goal": current_user.fitness_goal,
        "fitness_level": current_user.fitness_level,
        "injuries": current_user.injuries,
        "health_conditions": current_user.health_conditions,
        **request.user_data
    }

    adjusted = await ai_agent.adjust_plan_dynamically(
        reason=request.reason,
        duration_days=request.duration_days,
        current_plan=request.current_plan,
        user_data=user_data
    )

    # 💾 Persist newly adjusted days to the user's active workout plan in the DB
    adj_plan = adjusted.get("adjusted_plan", adjusted)
    if isinstance(adj_plan, dict):
        new_days = adj_plan.get("days")
        if new_days and isinstance(new_days, list):
            from app.models.workout_plan import WorkoutPlan
            from sqlalchemy.orm.attributes import flag_modified
            
            # Fetch active workout plan
            result = await db.execute(
                select(WorkoutPlan)
                .where(WorkoutPlan.user_id == current_user.id, WorkoutPlan.is_active == 1)
                .order_by(WorkoutPlan.created_at.desc())
            )
            plan = result.scalars().first()
            
            if plan and plan.plan_data and "days" in plan.plan_data:
                old_days = plan.plan_data["days"]
                curr_weekday = datetime.utcnow().weekday() # Mon=0, Sun=6
                
                # Overwrite up to duration_days into the future with AI's new days
                for i, new_day_data in enumerate(new_days):
                    if i >= request.duration_days:
                        break
                    target_idx = (curr_weekday + i) % 7
                    if target_idx < len(old_days):
                        # Keep the original day name (e.g. 'Wednesday')
                        original_name = old_days[target_idx].get("day", f"Day {target_idx+1}")
                        new_day_data["day"] = original_name
                        old_days[target_idx] = new_day_data
                
                plan.plan_data["days"] = old_days
                if "week_summary" in adj_plan:
                    plan.plan_data["week_summary"] = adj_plan["week_summary"]
                    
                flag_modified(plan, "plan_data")
                await db.commit()

    return {"adjusted_plan": adjusted, "reason": request.reason, "duration_days": request.duration_days}


@router.get("/analyze-progress")
async def analyze_my_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get AI-powered analysis of the user's recent progress with actionable insights.
    """
    from app.models.progress import Progress
    from sqlalchemy import desc

    result = await db.execute(
        select(Progress)
        .where(Progress.user_id == current_user.id)
        .order_by(desc(Progress.log_date))
        .limit(7)
    )
    logs = result.scalars().all()
    progress_data = [
        {
            "date": log.log_date,
            "workouts_done": log.workouts_done,
            "calories_burned": log.calories_burned,
            "healthy_meals": log.healthy_meals,
            "weight_kg": log.weight_kg,
        }
        for log in logs
    ]

    user_data = {
        "fitness_goal": current_user.fitness_goal,
        "fitness_level": current_user.fitness_level,
        "streak_days": current_user.streak_days,
    }

    analysis = await ai_agent.analyze_progress(progress_data, user_data)
    return {"analysis": analysis, "data_points": len(progress_data)}


@router.get("/history")
async def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Return the last 50 chat messages for this user"""
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(50)
    )
    messages = result.scalars().all()
    return {
        "messages": [
            {"role": m.role, "content": m.content, "created_at": str(m.created_at)}
            for m in messages
        ]
    }
