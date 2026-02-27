from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
from app.database import get_db
from app.models.meal_plan import MealPlan
from app.models.assessment import Assessment
from app.models.user import User
from app.schemas.schemas import MealPlanOut
from app.routers.auth import get_current_user
from app.services.ai_agent import ai_agent
from app.config import settings
import httpx

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])


@router.post("/generate", response_model=MealPlanOut, status_code=201)
async def generate_plan(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assessment).where(Assessment.user_id == current_user.id).order_by(Assessment.completed_at.desc()))
    assessment = result.scalars().first()
    if not assessment:
        raise HTTPException(status_code=400, detail="Complete health assessment first")

    user_info = {"age": current_user.age, "gender": current_user.gender, "height_cm": current_user.height_cm, "weight_kg": current_user.weight_kg}
    plan_data = await ai_agent.generate_meal_plan(assessment.responses, user_info)

    grocery = plan_data.pop("grocery_list", {})

    # Deactivate old plans
    existing = await db.execute(select(MealPlan).where(MealPlan.user_id == current_user.id))
    for old in existing.scalars():
        old.is_active = 0

    plan = MealPlan(user_id=current_user.id, week_start=str(date.today()), plan_data=plan_data, grocery_list=grocery)
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


@router.get("/plan", response_model=MealPlanOut)
async def get_plan(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MealPlan).where(MealPlan.user_id == current_user.id, MealPlan.is_active == 1).order_by(MealPlan.created_at.desc()))
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="No meal plan found. Generate one first.")
    return plan


@router.get("/grocery-list")
async def get_grocery(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MealPlan).where(MealPlan.user_id == current_user.id, MealPlan.is_active == 1).order_by(MealPlan.created_at.desc()))
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="No meal plan found")
    return {"grocery_list": plan.grocery_list or {}}


@router.get("/recipe/{meal_name}")
async def get_recipe(meal_name: str, _: User = Depends(get_current_user)):
    """Fetch real recipe details from Spoonacular for a given meal name."""
    if not settings.spoonacular_api_key:
        return {"error": "Spoonacular API key not configured", "recipe": None}
    async with httpx.AsyncClient() as client:
        try:
            # Clean up the query (e.g., "1 bowl of Dal with 2 Roti" -> "Dal")
            import re
            cleaned_query = re.sub(r'^(1|2|3|4|5|[0-9]+)\s*(bowl|cup|plate|glass|serving|gram|g|oz|ml|piece|pieces|slice|slices)s?\s*(of)?\s*', '', meal_name, flags=re.IGNORECASE)
            cleaned_query = cleaned_query.split(' with ')[0].split(' and ')[0].strip()

            print(f"Spoonacular searching for: '{cleaned_query}' (original: '{meal_name}')")

            # Search for the recipe without over-constraining the results
            search_r = await client.get(
                "https://api.spoonacular.com/recipes/complexSearch",
                params={"query": cleaned_query, "number": 1, "apiKey": settings.spoonacular_api_key}
            )
            search_data = search_r.json()
            results = search_data.get("results", [])
            if not results:
                return {"recipe": None, "message": "No recipe found for this meal"}

            recipe_id = results[0]["id"]

            # Get full details
            detail_r = await client.get(
                f"https://api.spoonacular.com/recipes/{recipe_id}/information",
                params={"apiKey": settings.spoonacular_api_key, "includeNutrition": True}
            )
            detail = detail_r.json()

            return {
                "recipe": {
                    "title": detail.get("title"),
                    "image": detail.get("image"),
                    "servings": detail.get("servings"),
                    "readyInMinutes": detail.get("readyInMinutes"),
                    "sourceUrl": detail.get("sourceUrl"),
                    "ingredients": [
                        {"name": i["name"], "amount": i["amount"], "unit": i["unit"]}
                        for i in detail.get("extendedIngredients", [])
                    ],
                    "instructions": [
                        {"step": s["number"], "text": s["step"]}
                        for s in (detail.get("analyzedInstructions") or [{}])[0].get("steps", [])
                    ],
                    "nutrients": {
                        n["name"]: f"{n['amount']}{n['unit']}"
                        for n in (detail.get("nutrition") or {}).get("nutrients", [])[:8]
                    }
                }
            }
        except Exception as e:
            print(f"Spoonacular error: {e}")
            return {"recipe": None, "error": str(e)}
