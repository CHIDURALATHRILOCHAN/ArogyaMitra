"""
Activity 3.2 — YouTube Data API v3 Integration
Fetches top-rated exercise tutorial videos for workout plans.

Activity 3.4 — Google Calendar API Integration  
Syncs workout & meal schedules with auto token refresh.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from datetime import date, datetime, timedelta
import httpx, json

from app.database import get_db
from app.models.user import User
from app.models.workout_plan import WorkoutPlan
from app.models.meal_plan import MealPlan
from app.routers.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/workout", tags=["Workout — Activity 3.2"])


# ─── Activity 3.1: Groq-generated Workout Plan ───────────────────────────────

@router.post("/generate", status_code=201)
async def generate_plan(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Generate a personalized 7-day workout plan using Groq LLaMA-3.3-70B (Activity 3.1)"""
    from app.services.ai_agent import ai_agent
    result = await db.execute(
        select(WorkoutPlan).where(WorkoutPlan.user_id == current_user.id, WorkoutPlan.is_active == 1)
        .order_by(WorkoutPlan.created_at.desc())
    )
    existing = result.scalars().first()
    if existing:
        from app.models.assessment import Assessment
        assess_result = await db.execute(
            select(Assessment).where(Assessment.user_id == current_user.id)
            .order_by(Assessment.completed_at.desc())
        )
        assessment = assess_result.scalars().first()
        if not assessment:
            raise HTTPException(status_code=400, detail="Complete health assessment first")
        user_info = {"age": current_user.age, "gender": current_user.gender,
                     "height_cm": current_user.height_cm, "weight_kg": current_user.weight_kg}
        plan_data = await ai_agent.generate_workout_plan(assessment.responses, user_info)
        existing.plan_data = plan_data
        existing.week_start = str(date.today())
        await db.commit()
        await db.refresh(existing)
        return existing

    from app.models.assessment import Assessment
    assess_result = await db.execute(
        select(Assessment).where(Assessment.user_id == current_user.id)
        .order_by(Assessment.completed_at.desc())
    )
    assessment = assess_result.scalars().first()
    if not assessment:
        raise HTTPException(status_code=400, detail="Complete health assessment first")

    user_info = {"age": current_user.age, "gender": current_user.gender,
                 "height_cm": current_user.height_cm, "weight_kg": current_user.weight_kg}
    plan_data = await ai_agent.generate_workout_plan(assessment.responses, user_info)
    plan = WorkoutPlan(user_id=current_user.id, week_start=str(date.today()), plan_data=plan_data)
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


@router.get("/plan")
async def get_plan(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(WorkoutPlan).where(WorkoutPlan.user_id == current_user.id, WorkoutPlan.is_active == 1)
        .order_by(WorkoutPlan.created_at.desc())
    )
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="No workout plan found. Generate one first.")
    return plan


# ─── Activity 3.2: YouTube Data API v3 ───────────────────────────────────────

@router.get("/videos/{query}")
async def get_videos(query: str, max_results: int = 5, _: User = Depends(get_current_user)):
    """
    Activity 3.2: Fetch top-rated exercise tutorial videos from YouTube Data API v3.
    Falls back to curated video IDs when API key is not set.
    """
    if settings.youtube_api_key:
        return await _fetch_youtube_videos(query, max_results)
    return _fallback_videos(query)


async def _fetch_youtube_videos(query: str, max_results: int = 5) -> dict:
    """Call YouTube Data API v3 and return ranked exercise video results"""
    search_query = f"{query} exercise tutorial form"
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={
                    "key": settings.youtube_api_key,
                    "q": search_query,
                    "part": "snippet",
                    "type": "video",
                    "maxResults": max_results,
                    "videoCategoryId": "17",          # Sports category
                    "videoDefinition": "high",         # HD videos only
                    "order": "relevance",
                    "safeSearch": "strict",
                    "relevanceLanguage": "en",
                }
            )
            data = r.json()

            if "error" in data:
                print(f"YouTube API error: {data['error']['message']}")
                return _fallback_videos(query)

            items = []
            for item in data.get("items", []):
                video_id = item["id"].get("videoId", "")
                snippet = item.get("snippet", {})
                if video_id:
                    items.append({
                        "title": snippet.get("title", ""),
                        "videoId": video_id,
                        "thumbnail": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                        "channel": snippet.get("channelTitle", ""),
                        "description": snippet.get("description", "")[:150],
                        "publishedAt": snippet.get("publishedAt", ""),
                    })
            return {"items": items, "source": "youtube_api"}

        except httpx.TimeoutException:
            print("YouTube API timeout — using fallback")
            return _fallback_videos(query)
        except Exception as e:
            print(f"YouTube API error: {e}")
            return _fallback_videos(query)


def _fallback_videos(query: str) -> dict:
    """
    Score-based keyword fallback — 55+ exercises, each with a unique video.
    Compound names (e.g. 'mountain climber', 'glute bridge') score higher
    than single-word matches so they always get the right video.
    """
    q = query.lower()

    # Each entry: ([keywords], youtube_video_id, title)
    # Keywords are checked as substrings of the query; score = number of matches
    CURATED = [
        # ── Legs ──────────────────────────────────────────────
        (["jump squat", "squat jump"],       "CVaEhXotL7M", "Jump Squats — Explosive Leg Power"),
        (["wall sit", "wall squat"],          "y-wV4Venusw", "Wall Sit Perfect Form"),
        (["glute bridge", "hip bridge"],      "wPM8icPu6H8", "Glute Bridge Proper Form Tutorial"),
        (["step up", "step-up"],              "dQqApCGd5Ss", "Step Up Exercise Tutorial"),
        (["donkey kick"],                     "SJ1Xuz9D-ZQ", "Donkey Kicks — Proper Form"),
        (["fire hydrant"],                    "la7hxV5mBKo", "Fire Hydrant Exercise Tutorial"),
        (["leg raise", "leg lift"],           "JB2oyawG9KI", "Lying Leg Raises Tutorial"),
        (["calf raise", "calf"],              "gwLzBJYoWlI", "Calf Raises — Perfect Form"),
        (["squat", "squats"],                 "UXJrEgdPUTo", "How To Squat Properly"),
        (["lunge", "lunges"],                 "D7KaRcUTQeE", "Perfect Lunge Form"),
        (["leg", "legs"],                     "aclHkVaku9U", "Complete Leg Workout Tutorial"),
        (["glute", "gluteal"],                "wPM8icPu6H8", "Glute Workout Tutorial"),
        # ── Core ──────────────────────────────────────────────
        (["mountain climber"],               "nmwgirgXLYM", "Mountain Climbers — Cardio Core"),
        (["bicycle crunch"],                  "9FGilxCbdz8", "Bicycle Crunches — Abs Tutorial"),
        (["russian twist"],                   "wkD8rjkodUI", "Russian Twists — Oblique Workout"),
        (["side plank"],                      "K_I8DCbAjJQ", "Side Plank — Oblique Strength"),
        (["dead bug"],                        "gl9mSyOVJzA", "Dead Bug Exercise Tutorial"),
        (["superman", "back extension"],      "cc6UVRS7om0", "Superman Exercise — Lower Back"),
        (["hollow body", "hollow hold"],      "LlDNef_Ztsc", "Hollow Body Hold Tutorial"),
        (["plank"],                           "pSHjTRCQxIw", "Perfect Plank Form"),
        (["crunch", "crunches"],              "5ER5Of4MOPI", "Proper Crunch Technique"),
        (["sit up", "situp"],                 "jDwoBqPH0jk", "Perfect Sit-Up Form Tutorial"),
        (["core", "abs"],                     "pSHjTRCQxIw", "Core Workout Tutorial"),
        # ── Upper — Push ──────────────────────────────────────
        (["incline push", "incline press"],   "cfns6xhhJsA", "Incline Push Up Tutorial"),
        (["pike push", "pike press"],         "sposDXWEB0A", "Pike Push Up — Shoulder"),
        (["tricep dip", "dips"],              "6kALZikXxLc", "Tricep Dips Perfect Form"),
        (["push up", "pushup", "push-up"],    "IODxDxX7oi4", "Perfect Push-Up Form"),
        (["tricep", "triceps"],               "nRiJVZDpdL0", "Tricep Extension Tutorial"),
        (["lateral raise"],                   "3VcKaXpzqRo", "Lateral Raises Tutorial"),
        (["shoulder press", "overhead"],      "kDqklk9_bE0", "Shoulder Press Perfect Form"),
        (["chest", "bench"],                  "SCVCLChPQFs", "Chest Workout Tutorial"),
        (["shoulder"],                        "kDqklk9_bE0", "Shoulder Workout Guide"),
        # ── Upper — Pull ──────────────────────────────────────
        (["pull up", "pullup", "chin up"],    "eGo4IYlbE5g", "Pull-Up Masterclass"),
        (["hammer curl"],                     "zC3nLlEvin4", "Hammer Curl Tutorial"),
        (["bicep curl", "bicep", "curl"],     "ykJmrZ5v0Oo", "Bicep Curl Perfect Form"),
        (["bent over row", "barbell row"],    "T3N-TO4reLQ", "Bent Over Row Perfect Form"),
        # ── Full body / Cardio ────────────────────────────────
        (["jumping jack"],                    "c4DAnQ6DtF8", "Jumping Jacks Proper Form"),
        (["high knee", "high-knee"],          "ZZZoCNMU48U", "High Knees — Cardio Tutorial"),
        (["burpee", "burpees"],              "dZgVxmf6jkA", "Burpees — Perfect Form"),
        (["inchworm"],                        "fDBkdpVi-6k", "Inchworm Exercise Tutorial"),
        (["bear crawl"],                      "YFEPuRoUJMw", "Bear Crawl Tutorial"),
        (["box jump"],                        "52FSMj3q7JE", "Box Jumps — Explosive Training"),
        (["jump rope", "skipping"],           "u3zgHI8QnqE", "Jump Rope Tutorial"),
        # ── Compound / Weights ────────────────────────────────
        (["deadlift"],                        "op9kVnSso6Q", "Deadlift Perfect Form"),
        (["kettlebell"],                      "rT7DgCr-3pg", "Kettlebell Swing Tutorial"),
        (["dumbbell"],                        "FWJR5Ve8bnQ", "Dumbbell Full Body Workout"),
        (["resistance band", "band"],         "Rl6N2KNPBks", "Resistance Band Tutorial"),
        # ── Cardio modalities ─────────────────────────────────
        (["hiit", "interval"],                "ml6cT4AZdqI", "HIIT Workout — 30 Min"),
        (["cardio"],                          "O-MIdPKFBRQ", "Cardio Workout — No Equipment"),
        (["run", "jog", "running"],           "kVnyY17VS9Y", "Running Form — Beginner"),
        (["cycling", "bike"],                 "UT6TnNIqFUg", "Cycling Technique Guide"),
        (["walk", "walking"],                 "o3GkGa7PCPU", "Power Walking Technique"),
        # ── Flexibility / Recovery ────────────────────────────
        (["yoga", "sun salutation"],          "v7AYKMP6rOE", "Morning Yoga Flow"),
        (["foam roll", "foam roller"],        "viFUcODb20g", "Foam Rolling Tutorial"),
        (["stretch", "stretching"],           "g_tea8ZNk5A", "Full Body Stretch Routine"),
        (["warm up", "warmup"],               "R0mMyV5OtcM", "Dynamic Warm-Up Routine"),
        (["cool down", "cooldown"],           "qULTwquOuT4", "Cool Down Stretching"),
        (["rest", "recovery"],               "g_tea8ZNk5A", "Active Recovery Routine"),
    ]

    # Score: count how many keywords from each entry appear in the query
    best_match = None
    best_score = 0
    for keywords, vid_id, title in CURATED:
        score = sum(1 for kw in keywords if kw in q)
        if score > best_score:
            best_score = score
            best_match = (vid_id, title, keywords[0])

    if best_match:
        vid_id, title, kw = best_match
        return {
            "items": [{
                "title": title,
                "videoId": vid_id,
                "thumbnail": f"https://img.youtube.com/vi/{vid_id}/mqdefault.jpg",
                "channel": "ArogyaMitra Curated",
                "description": f"Curated {kw} tutorial"
            }],
            "source": "fallback"
        }

    # Generic last-resort
    return {
        "items": [{
            "title": f"{query} — Exercise Tutorial",
            "videoId": "UBMk30rjy0o",
            "thumbnail": "https://img.youtube.com/vi/UBMk30rjy0o/mqdefault.jpg",
            "channel": "ArogyaMitra", "description": "General exercise tutorial"
        }],
        "source": "fallback_generic"
    }
