"""
Activity 3.4 — Google Calendar API Integration
Syncs personalized workout & meal schedules with automatic OAuth token refresh.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date, timedelta
import httpx, json

from app.database import get_db
from app.models.user import User
from app.models.workout_plan import WorkoutPlan
from app.models.meal_plan import MealPlan
from app.routers.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/calendar", tags=["Calendar — Activity 3.4"])

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"
SCOPES = " ".join([
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email",
])


# ─── OAuth Flow ───────────────────────────────────────────────────────────────

@router.get("/auth-url")
async def get_auth_url(current_user: User = Depends(get_current_user)):
    """Generate Google OAuth2 consent URL for Calendar access"""
    if not settings.google_client_id:
        return {"url": None, "message": "Google credentials not configured. Add GOOGLE_CLIENT_ID to .env"}
    url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.google_client_id}"
        f"&redirect_uri={settings.google_redirect_uri}"
        f"&response_type=code"
        f"&scope={SCOPES}"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&state={current_user.id}"   # Carry user ID through OAuth flow
    )
    return {"url": url}


@router.get("/callback")
async def oauth_callback(code: str, state: str = None, db: AsyncSession = Depends(get_db)):
    """
    Handle OAuth2 callback: exchange code for tokens, fetch user email, store credentials.
    This endpoint is called by Google after user grants permission.
    """
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    async with httpx.AsyncClient() as client:
        # Exchange auth code for tokens
        token_r = await client.post(GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "grant_type": "authorization_code",
        })
        token_data = token_r.json()

    if "access_token" not in token_data:
        raise HTTPException(status_code=400, detail=f"Failed to get access token: {token_data.get('error', 'unknown')}")

    # Fetch user's Google email
    google_email = None
    try:
        async with httpx.AsyncClient() as client:
            email_r = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {token_data['access_token']}"}
            )
            google_email = email_r.json().get("email")
    except Exception:
        pass

    # Find user by state (user ID) and save tokens
    if state:
        result = await db.execute(select(User).where(User.id == int(state)))
        user = result.scalar_one_or_none()
        if user:
            user.google_calendar_token = json.dumps(token_data)
            user.google_calendar_email = google_email
            await db.commit()

    # Redirect back to frontend with success flag
    return RedirectResponse(url=f"{settings.frontend_url}?calendar_connected=true")


async def _get_valid_access_token(user: User, db: AsyncSession) -> str:
    """
    Return a valid access token, refreshing via refresh_token if expired.
    Activity 3.4: Token refresh ensures long-term calendar sync without re-authentication.
    """
    if not user.google_calendar_token:
        raise HTTPException(status_code=400, detail="Google Calendar not connected")

    token_data = json.loads(user.google_calendar_token)
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")

    # Try a lightweight verification
    async with httpx.AsyncClient() as client:
        test_r = await client.get(
            f"{GOOGLE_CALENDAR_API}/calendars/primary",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=5.0
        )
        if test_r.status_code == 401 and refresh_token:
            # Token expired — refresh it
            refresh_r = await client.post(GOOGLE_TOKEN_URL, data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            })
            new_tokens = refresh_r.json()
            if "access_token" in new_tokens:
                token_data["access_token"] = new_tokens["access_token"]
                user.google_calendar_token = json.dumps(token_data)
                await db.commit()
                access_token = new_tokens["access_token"]
            else:
                raise HTTPException(status_code=401, detail="Calendar session expired. Please reconnect.")

    return access_token


# ─── Calendar Sync ────────────────────────────────────────────────────────────

@router.post("/sync")
async def sync_calendar(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Activity 3.4: Sync the full week of workout & meal schedule to Google Calendar.
    Automatically refreshes expired tokens. Creates color-coded events with descriptions.
    """
    access_token = await _get_valid_access_token(current_user, db)
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

    results = await asyncio_gather(
        db.execute(select(WorkoutPlan).where(WorkoutPlan.user_id == current_user.id, WorkoutPlan.is_active == 1)),
        db.execute(select(MealPlan).where(MealPlan.user_id == current_user.id, MealPlan.is_active == 1)),
    )
    workout_plan = results[0].scalar_one_or_none()
    meal_plan = results[1].scalar_one_or_none()

    if not workout_plan and not meal_plan:
        raise HTTPException(status_code=404, detail="No active workout or meal plans to sync. Generate them first.")

    created, skipped = 0, 0
    async with httpx.AsyncClient(timeout=30.0) as client:

        # ── Workout Events (Green, color_id=2) ──
        if workout_plan:
            base = date.fromisoformat(workout_plan.week_start)
            for i, day in enumerate(workout_plan.plan_data.get("days", [])):
                if day.get("duration_minutes", 0) == 0:
                    continue
                exercises = ", ".join(e["exercise"] for e in day.get("main_workout", [])[:3])
                ev_date = base + timedelta(days=i)
                end_hour = 7 + day["duration_minutes"] // 60
                end_min = day["duration_minutes"] % 60
                event = {
                    "summary": f"🏋️ ArogyaMitra: {day['focus']}",
                    "description": (
                        f"📋 ArogyaMitra Workout Plan\n\n"
                        f"Focus: {day['focus']}\n"
                        f"Duration: {day['duration_minutes']} minutes\n"
                        f"Calories: ~{day.get('calories_estimated', 0)} kcal\n\n"
                        f"Exercises: {exercises}\n\n"
                        f"💪 Generated by ArogyaMitra AI"
                    ),
                    "start": {"dateTime": f"{ev_date}T07:00:00", "timeZone": "Asia/Kolkata"},
                    "end":   {"dateTime": f"{ev_date}T{end_hour:02d}:{end_min:02d}:00", "timeZone": "Asia/Kolkata"},
                    "colorId": "2",         # Green
                    "reminders": {"useDefault": False, "overrides": [{"method": "popup", "minutes": 30}]},
                }
                r = await client.post(f"{GOOGLE_CALENDAR_API}/calendars/primary/events", headers=headers, json=event)
                if r.status_code in (200, 201):
                    created += 1
                else:
                    skipped += 1

        # ── Meal Events (Banana/Yellow, color_id=5) ──
        if meal_plan:
            base = date.fromisoformat(meal_plan.week_start)
            meal_schedule = {
                "breakfast": ("08:00:00", "08:30:00"),
                "lunch":     ("13:00:00", "13:45:00"),
                "dinner":    ("19:30:00", "20:15:00"),
            }
            for i, day in enumerate(meal_plan.plan_data.get("days", [])):
                ev_date = base + timedelta(days=i)
                for meal_type, (start_t, end_t) in meal_schedule.items():
                    meal = day.get("meals", {}).get(meal_type)
                    if not meal:
                        continue
                    ingr = ", ".join(meal.get("ingredients", [])[:4])
                    event = {
                        "summary": f"🥗 {meal_type.title()}: {meal.get('name', 'Meal')}",
                        "description": (
                            f"🍽️ ArogyaMitra Nutrition Plan\n\n"
                            f"Meal: {meal.get('name', 'Meal')}\n"
                            f"Calories: {meal.get('calories', 0)} kcal\n"
                            f"Protein: {meal.get('protein', 0)}g | "
                            f"Carbs: {meal.get('carbs', 0)}g | "
                            f"Fat: {meal.get('fat', 0)}g\n\n"
                            f"Key Ingredients: {ingr}\n\n"
                            f"🌿 Powered by ArogyaMitra & Spoonacular"
                        ),
                        "start": {"dateTime": f"{ev_date}T{start_t}", "timeZone": "Asia/Kolkata"},
                        "end":   {"dateTime": f"{ev_date}T{end_t}",   "timeZone": "Asia/Kolkata"},
                        "colorId": "5",     # Banana/Yellow
                        "reminders": {"useDefault": False, "overrides": [{"method": "popup", "minutes": 15}]},
                    }
                    r = await client.post(f"{GOOGLE_CALENDAR_API}/calendars/primary/events", headers=headers, json=event)
                    if r.status_code in (200, 201):
                        created += 1
                    else:
                        skipped += 1

    return {
        "message": f"✅ Synced {created} events to Google Calendar! ({skipped} skipped)",
        "events_created": created,
        "events_skipped": skipped
    }


@router.get("/status")
async def calendar_status(current_user: User = Depends(get_current_user)):
    """Check Google Calendar connection status"""
    connected = bool(current_user.google_calendar_token)
    return {
        "connected": connected,
        "email": current_user.google_calendar_email,
        "message": "Google Calendar is connected" if connected else "Not connected"
    }


@router.delete("/disconnect")
async def disconnect_calendar(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Revoke Google Calendar access and clear stored tokens"""
    token_data = json.loads(current_user.google_calendar_token or "{}")
    access_token = token_data.get("access_token")
    if access_token:
        async with httpx.AsyncClient() as client:
            await client.post(f"https://oauth2.googleapis.com/revoke?token={access_token}")
    current_user.google_calendar_token = None
    current_user.google_calendar_email = None
    await db.commit()
    return {"message": "Google Calendar disconnected successfully"}


async def asyncio_gather(*coros):
    import asyncio
    return await asyncio.gather(*coros)
