"""
ArogyaMitraAgent — Central AI Agent for ArogyaMitra Platform

This agent orchestrates all AI-powered features:
  - Workout plan generation
  - Nutrition planning
  - Motivational coaching (AROMI)
  - Dynamic plan modifications based on life changes
  - Progress analysis and adaptive recommendations
"""
import asyncio
import json
import re
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import httpx
from groq import AsyncGroq
from app.config import settings


class ArogyaMitraAgent:
    """
    🏋 ArogyaMitra AI Agent — Your Personal Fitness Companion

    Orchestrates all AI-powered features using Groq's LLaMA 3.3-70B model.
    Falls back to curated mock data when the API is unavailable.
    """

    def __init__(self):
        self.groq_client: Optional[AsyncGroq] = None
        self.model = settings.groq_model
        self.initialize_ai_clients()

    def initialize_ai_clients(self):
        """Initialize AI service clients"""
        try:
            if settings.groq_api_key:
                self.groq_client = AsyncGroq(api_key=settings.groq_api_key)
                print("✅ Groq AI client initialized")
            else:
                print("⚠️  No Groq API key found — running in demo mode")
        except Exception as e:
            print(f"❌ Failed to initialize Groq client: {e}")

    # ──────────────────────────────────────────────────────────────
    # SYSTEM PROMPTS
    # ──────────────────────────────────────────────────────────────

    WORKOUT_SYSTEM_PROMPT = """You are AROMI, an expert AI fitness coach and personal trainer for ArogyaMitra.
Generate a detailed, structured 7-day workout plan based on the user's health assessment.

CRITICAL RULES:
1. Strictly adhere to the user's injuries — avoid exercises that strain the affected area.
2. If they have "No equipment", ONLY suggest bodyweight exercises.
3. Respect the user's fitness level (Beginner/Intermediate/Advanced).
4. Include warm-up and cooldown for every active day.

Return ONLY valid JSON matching this exact structure:
{
  "week_summary": "brief overview",
  "days": [
    {
      "day": "Monday",
      "focus": "Chest and Triceps",
      "duration_minutes": 45,
      "warmup": [{"exercise": "name", "duration": "5 min"}],
      "main_workout": [
        {"exercise": "name", "sets": 3, "reps": "10-12", "rest": "60s", "description": "form tip"}
      ],
      "cooldown": [{"exercise": "name", "duration": "5 min"}],
      "calories_estimated": 350,
      "youtube_search": "exercise video search keyword"
    }
  ]
}"""

    MEAL_SYSTEM_PROMPT = """You are AROMI, a certified nutritionist AI for ArogyaMitra.
Generate a detailed 7-day Indian meal plan with macros.

STRICT RULES:
1. Follow the user's diet_type (vegetarian/vegan/keto etc.) absolutely.
2. Emphasize traditional Indian ingredients and cooking methods.
3. Adjust calorie targets based on fitness goal.

Return ONLY valid JSON:
{
  "week_summary": "brief dietary overview",
  "daily_calorie_target": 2000,
  "days": [
    {
      "day": "Monday",
      "meals": {
        "breakfast": {"name": "...", "calories": 400, "protein": 25, "carbs": 45, "fat": 12, "ingredients": []},
        "lunch": {"name": "...", "calories": 550, "protein": 30, "carbs": 60, "fat": 15, "ingredients": []},
        "dinner": {"name": "...", "calories": 600, "protein": 35, "carbs": 55, "fat": 18, "ingredients": []},
        "snacks": {"name": "...", "calories": 200, "protein": 10, "carbs": 20, "fat": 8, "ingredients": []}
      },
      "daily_totals": {"calories": 1750, "protein": 100, "carbs": 180, "fat": 53}
    }
  ],
  "grocery_list": {
    "proteins": [], "vegetables": [], "fruits": [], "grains": [], "dairy": [], "others": []
  }
}"""

    COACH_SYSTEM_PROMPT = """You are AROMI, a warm, empathetic, and knowledgeable AI health and wellness coach for ArogyaMitra.

You help users with:
- Workout modifications for travel, injuries, fatigue, or schedule changes
- Nutrition advice and Indian meal suggestions
- Motivation and mental wellness tips
- Adaptive planning based on life circumstances
- General health questions and progress analysis

Keep responses concise, friendly, and actionable. Use emojis occasionally.
Always prioritize user safety — recommend consulting doctors for medical issues.
When the user mentions travel, injury, or fatigue, proactively suggest modifications."""

    DYNAMIC_ADJUSTMENT_PROMPT = """You are AROMI, an adaptive AI fitness coach.
The user's life circumstances have changed and they need their plan adjusted.

Analyze the situation and return a modified plan as valid JSON.
Be practical, empathetic, and focus on maintaining consistency despite the challenge.
The modified plan should:
1. Address the specific reason for the change
2. Maintain progress toward the user's fitness goal
3. Be realistic given the new constraints
4. Include brief motivation to keep the user engaged"""

    # ──────────────────────────────────────────────────────────────
    # WORKOUT PLAN GENERATION
    # ──────────────────────────────────────────────────────────────

    async def generate_workout_plan(self, assessment: Dict, user_info: Dict) -> Dict:
        """Generate a personalized 7-day workout plan via Groq LLaMA 3"""
        if not self.groq_client:
            return self._mock_workout_plan()

        prompt = f"""
User Profile:
- Age: {user_info.get('age', 'N/A')}, Gender: {user_info.get('gender', 'N/A')}
- Height: {user_info.get('height_cm', 'N/A')}cm, Weight: {user_info.get('weight_kg', 'N/A')}kg
- Fitness Goal: {assessment.get('fitness_goal', 'General Health')}
- Fitness Level: {assessment.get('fitness_level', 'Beginner')}
- Location: {assessment.get('workout_location', 'Home')}
- Preferred Time: {assessment.get('workout_time', 'Morning')}
- Equipment: {assessment.get('equipment', 'No equipment')}
- Injuries/Limitations: {assessment.get('injuries', 'None')}
- Medical History: {assessment.get('medical_history', 'None')}
- Health Conditions: {assessment.get('health_conditions', 'None')}

Generate a personalized 7-day workout plan. Return ONLY the raw JSON object."""

        return await self._call_groq_json(self.WORKOUT_SYSTEM_PROMPT, prompt, self._mock_workout_plan())

    # ──────────────────────────────────────────────────────────────
    # MEAL PLAN GENERATION
    # ──────────────────────────────────────────────────────────────

    async def generate_meal_plan(self, assessment: Dict, user_info: Dict) -> Dict:
        """Generate a personalized 7-day meal plan via Groq LLaMA 3"""
        if not self.groq_client:
            return self._mock_meal_plan()

        prompt = f"""
User Profile:
- Age: {user_info.get('age', 'N/A')}, Gender: {user_info.get('gender', 'N/A')}
- Weight: {user_info.get('weight_kg', 'N/A')}kg, Height: {user_info.get('height_cm', 'N/A')}cm
- Diet Type: {assessment.get('diet_type', 'No restriction')}
- Fitness Goal: {assessment.get('fitness_goal', 'General Health')}
- Health Conditions: {assessment.get('health_conditions', 'None')}
- Medical History: {assessment.get('medical_history', 'None')}

Generate a 7-day Indian meal plan. Return ONLY the raw JSON object."""

        return await self._call_groq_json(self.MEAL_SYSTEM_PROMPT, prompt, self._mock_meal_plan())

    # ──────────────────────────────────────────────────────────────
    # AROMI COACH CHAT
    # ──────────────────────────────────────────────────────────────

    async def chat_with_aromi(self, messages: List[Dict], user_context: Dict,
                               user_status: str = "normal") -> str:
        """Conversational AI coach chat with full context awareness"""
        if not self.groq_client:
            return ("Hello! I'm AROMI, your AI wellness coach. I'm currently in demo mode. "
                    "Once your Groq API key is configured, I can provide personalized guidance! 💪")

        system = self.COACH_SYSTEM_PROMPT
        if user_context:
            system += f"\n\nUser Context:\n{json.dumps(user_context, indent=2)}"
        if user_status != "normal":
            system += f"\n\nUser Current Status: {user_status} — adapt your advice accordingly."

        try:
            response = await self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": system}] + messages,
                temperature=0.8,
                max_tokens=800,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Groq chat error: {e}")
            return "I'm having trouble connecting right now. Please try again in a moment! 🙏"

    # ──────────────────────────────────────────────────────────────
    # DYNAMIC PLAN ADJUSTMENT
    # ──────────────────────────────────────────────────────────────

    async def adjust_plan_dynamically(self, reason: str, duration_days: int,
                                       current_plan: Dict, user_data: Dict) -> Dict:
        """
        Adjust an existing workout/nutrition plan based on life changes.

        Handles scenarios like:
        - "travel" → hotel-room bodyweight workout
        - "injury" → exercises that don't stress the injured area
        - "time_constraint" → shorter, high-intensity sessions
        - "health_issue" → gentle, recovery-focused plan
        """
        if not self.groq_client:
            return self._mock_adjusted_plan(reason, duration_days)

        prompt = f"""
Situation: {reason}
Duration of change: {duration_days} days
User Profile: {json.dumps(user_data, indent=2)}
Current Plan Summary: {json.dumps(current_plan, indent=2)}

Create a modified {duration_days}-day plan that adapts to this situation.
Return ONLY valid JSON with the same structure as the current plan."""

        try:
            response = await self.groq_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.DYNAMIC_ADJUSTMENT_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=3000,
            )
            content = response.choices[0].message.content
            return self._extract_json(content) or self._mock_adjusted_plan(reason, duration_days)
        except Exception as e:
            print(f"Groq dynamic adjustment error: {e}")
            return self._mock_adjusted_plan(reason, duration_days)

    # ──────────────────────────────────────────────────────────────
    # PROGRESS ANALYSIS
    # ──────────────────────────────────────────────────────────────

    async def analyze_progress(self, progress_history: List[Dict], user_data: Dict) -> str:
        """Analyze user's progress logs and generate actionable insights"""
        if not self.groq_client:
            return "Keep up the great work! Consistency is the key to achieving your fitness goals. 💪"

        prompt = f"""
Analyze this user's recent fitness progress and provide specific, actionable insights.

User Goal: {user_data.get('fitness_goal', 'General Fitness')}
Recent Progress (last 7 days): {json.dumps(progress_history, indent=2)}

Provide:
1. What they're doing well
2. Areas for improvement
3. Specific recommendations for next week
Keep it concise, motivating, and personalized."""

        try:
            response = await self.groq_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.COACH_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=600,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Progress analysis error: {e}")
            return "Great effort this week! Keep pushing toward your goals. 🌟"

    # ──────────────────────────────────────────────────────────────
    # HELPERS
    # ──────────────────────────────────────────────────────────────

    async def _call_groq_json(self, system: str, prompt: str, fallback: Dict) -> Dict:
        """Call Groq and extract a JSON response, falling back on any error"""
        try:
            response = await self.groq_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=4000,
            )
            content = response.choices[0].message.content
            result = self._extract_json(content)
            return result if result else fallback
        except Exception as e:
            print(f"Groq JSON call error: {e}")
            return fallback

    def _extract_json(self, text: str) -> Optional[Dict]:
        """Robustly extract a JSON object from a string"""
        try:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start != -1 and end > start:
                return json.loads(text[start:end])
            return json.loads(text)
        except Exception:
            return None

    # ──────────────────────────────────────────────────────────────
    # MOCK FALLBACKS
    # ──────────────────────────────────────────────────────────────

    def _mock_workout_plan(self) -> Dict:
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        focuses = ["Upper Body Strength", "Cardio & Core", "Lower Body Strength",
                   "Active Recovery", "Full Body HIIT", "Flexibility & Yoga", "Rest Day"]
        plan = {"week_summary": "Demo 7-day balanced workout plan. Add Groq API key for personalized plans!", "days": []}
        for i, (day, focus) in enumerate(zip(days, focuses)):
            if focus == "Rest Day":
                plan["days"].append({"day": day, "focus": focus, "duration_minutes": 0,
                                     "warmup": [], "main_workout": [], "cooldown": [],
                                     "calories_estimated": 0, "youtube_search": "rest day stretching"})
            else:
                plan["days"].append({
                    "day": day, "focus": focus,
                    "duration_minutes": [45, 30, 50, 30, 40, 60, 0][i],
                    "warmup": [{"exercise": "Jumping Jacks", "duration": "5 min"}],
                    "main_workout": [
                        {"exercise": "Push-ups", "sets": 3, "reps": "12-15", "rest": "60s", "description": "Keep core tight"},
                        {"exercise": "Squats", "sets": 3, "reps": "15", "rest": "60s", "description": "Feet shoulder-width apart"},
                        {"exercise": "Plank", "sets": 3, "reps": "30-45s", "rest": "30s", "description": "Maintain straight line"},
                    ],
                    "cooldown": [{"exercise": "Static Stretch", "duration": "5 min"}],
                    "calories_estimated": [300, 250, 350, 200, 400, 280, 0][i],
                    "youtube_search": f"{focus} workout beginner"
                })
        return plan

    def _mock_meal_plan(self) -> Dict:
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        plan = {
            "week_summary": "Demo balanced Indian meal plan. Add Groq API key for personalized nutrition!",
            "daily_calorie_target": 2000,
            "days": [],
            "grocery_list": {
                "proteins": ["Chicken breast", "Eggs", "Greek yogurt", "Lentils", "Paneer"],
                "vegetables": ["Broccoli", "Spinach", "Bell peppers", "Tomatoes", "Onions"],
                "fruits": ["Banana", "Apple", "Berries", "Orange"],
                "grains": ["Oats", "Brown rice", "Whole wheat roti", "Quinoa"],
                "dairy": ["Low-fat milk", "Cottage cheese", "Curd"],
                "others": ["Olive oil", "Nuts", "Honey", "Green tea", "Turmeric"]
            }
        }
        for day in days:
            plan["days"].append({
                "day": day,
                "meals": {
                    "breakfast": {"name": "Oatmeal with fruits & nuts", "calories": 380, "protein": 14, "carbs": 58, "fat": 12, "ingredients": ["Oats", "Banana", "Almonds", "Honey", "Milk"]},
                    "lunch": {"name": "Dal tadka with brown rice & sabzi", "calories": 540, "protein": 22, "carbs": 78, "fat": 12, "ingredients": ["Lentils", "Brown rice", "Onion", "Tomato", "Spices"]},
                    "dinner": {"name": "Grilled paneer with roti", "calories": 520, "protein": 32, "carbs": 48, "fat": 18, "ingredients": ["Paneer", "Whole wheat roti", "Curd", "Cucumber"]},
                    "snacks": {"name": "Roasted chana & fruit", "calories": 180, "protein": 8, "carbs": 28, "fat": 4, "ingredients": ["Roasted chana", "Apple", "Green tea"]}
                },
                "daily_totals": {"calories": 1620, "protein": 76, "carbs": 212, "fat": 46}
            })
        return plan

    def _mock_adjusted_plan(self, reason: str, duration_days: int) -> Dict:
        adjustments = {
            "travel": {"note": f"Travel-friendly {duration_days}-day bodyweight plan — no equipment needed", "exercises": ["Hotel Room Push-ups", "Bodyweight Squats", "Plank", "Mountain Climbers"]},
            "injury": {"note": f"Injury-recovery {duration_days}-day plan — low impact exercises only", "exercises": ["Swimming", "Chair Yoga", "Light Walking", "Upper Body Band Exercises"]},
            "time_constraint": {"note": f"Quick {duration_days}-day HIIT plan — 20 minutes max daily", "exercises": ["Burpees", "Jumping Jacks", "High Knees", "Push-ups Circuit"]},
            "health_issue": {"note": f"Gentle {duration_days}-day recovery plan", "exercises": ["Light Walking", "Yoga", "Breathing Exercises", "Gentle Stretching"]},
        }
        adj = adjustments.get(reason, adjustments["time_constraint"])
        return {"adjusted_plan": adj, "reason": reason, "duration_days": duration_days,
                "message": f"Plan adjusted for {reason}. Stay consistent! 💪"}


# Singleton instance
ai_agent = ArogyaMitraAgent()
