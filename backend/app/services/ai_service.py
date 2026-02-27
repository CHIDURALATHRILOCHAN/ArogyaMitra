import json
from groq import AsyncGroq
from app.config import settings

client = AsyncGroq(api_key=settings.groq_api_key) if settings.groq_api_key else None

WORKOUT_SYSTEM_PROMPT = """You are AROMI, an expert AI fitness coach and personal trainer.
Generate a detailed, structured 7-day workout plan based on the user's health assessment.
CRITICAL: You MUST strictly adhere to the user's "injuries", "equipment", and "fitness_level" provided in the assessment. 
If they have an injury (e.g., "Knee issues"), avoid exercises that strain that area.
If they have "No equipment", only suggest bodyweight exercises.

Always return valid JSON matching this exact structure:
{
  "week_summary": "brief overview mentioning how injuries/equipment were handled",
  "days": [
    {
      "day": "Monday",
      "focus": "muscle group or type",
      "duration_minutes": 45,
      "warmup": [{"exercise": "name", "duration": "5 min"}],
      "main_workout": [
        {"exercise": "name", "sets": 3, "reps": "10-12", "rest": "60s", "description": "brief form tip emphasizing safety for injuries if any"}
      ],
      "cooldown": [{"exercise": "name", "duration": "5 min"}],
      "calories_estimated": 350,
      "youtube_search": "exercise video search keyword"
    }
  ]
}"""

MEAL_SYSTEM_PROMPT = """You are AROMI, a certified nutritionist AI.
Generate a detailed 7-day meal plan with macros.
STRICT ADHERENCE: Follow the user's "diet_type" and "fitness_goal".
Always return valid JSON matching this exact structure:
{
  "week_summary": "brief dietary overview",
  "daily_calorie_target": 2000,
  "days": [
    {
      "day": "Monday",
      "meals": {
        "breakfast": {"name": "meal name", "calories": 400, "protein": 25, "carbs": 45, "fat": 12, "ingredients": ["item1","item2"]},
        "lunch": {"name": "...", "calories": 550, "protein": 30, "carbs": 60, "fat": 15, "ingredients": []},
        "dinner": {"name": "...", "calories": 600, "protein": 35, "carbs": 55, "fat": 18, "ingredients": []},
        "snacks": {"name": "...", "calories": 200, "protein": 10, "carbs": 20, "fat": 8, "ingredients": []}
      },
      "daily_totals": {"calories": 1750, "protein": 100, "carbs": 180, "fat": 53}
    }
  ],
  "grocery_list": {
    "proteins": ["chicken breast", "eggs"],
    "vegetables": ["broccoli", "spinach"],
    "fruits": ["banana", "apple"],
    "grains": ["oats", "brown rice"],
    "dairy": ["Greek yogurt", "milk"],
    "others": ["olive oil", "nuts"]
  }
}"""

COACH_SYSTEM_PROMPT = """You are AROMI, a warm, empathetic, and knowledgeable AI health and wellness coach for the ArogyaMitra platform.
You help users with:
- Workout modifications for travel, injuries, or fatigue
- Nutrition advice and meal suggestions
- Motivation and mental wellness tips
- Schedule adjustments and adaptive planning
- General health questions

Keep responses concise, friendly, and actionable. Use emojis occasionally.
Always prioritize user safety - recommend consulting doctors for medical issues."""


async def generate_workout_plan(assessment: dict, user_info: dict) -> dict:
    if not client:
        return _mock_workout_plan()
    
    # Extract key constraints for the prompt
    fitness_goal = assessment.get("fitness_goal", "General Health")
    fitness_lvl = assessment.get("fitness_level", "Beginner")
    location = assessment.get("workout_location", "Home")
    time_pref = assessment.get("workout_time", "Morning")
    injuries = assessment.get("injuries", "None")
    medical_history = assessment.get("medical_history", "None")
    health_conditions = assessment.get("health_conditions", "None")
    medications = assessment.get("medications", "None")

    prompt = f"""
User Profile:
- Age: {user_info.get('age', 'N/A')}, Gender: {user_info.get('gender', 'N/A')}
- Height: {user_info.get('height_cm', 'N/A')}cm, Weight: {user_info.get('weight_kg', 'N/A')}kg
- Fitness Goal: {fitness_goal}
- Fitness Level: {fitness_lvl}
- Location: {location}, Time Preference: {time_pref}
- Constraints/Injuries: {injuries}
- Medical History: {medical_history}
- Health Conditions: {health_conditions}
- Medications: {medications}

Generate a personalized 7-day workout plan. 
Return ONLY the raw JSON object. No conversational text."""

    try:
        response = await client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": WORKOUT_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=4000,
        )
        content = response.choices[0].message.content
        # Robust JSON extraction
        try:
            start = content.find("{")
            end = content.rfind("}") + 1
            if start != -1 and end > start:
                return json.loads(content[start:end])
            return json.loads(content)
        except:
            print(f"JSON Parse failed from Groq: {content[:100]}...")
            return _mock_workout_plan()
    except Exception as e:
        print(f"Groq workout error: {e}")
        return _mock_workout_plan()


async def generate_meal_plan(assessment: dict, user_info: dict) -> dict:
    if not client:
        return _mock_meal_plan()
    
    diet_type = assessment.get("diet_type", "No restriction")
    goal = assessment.get("fitness_goal", "general health")
    medical_history = assessment.get("medical_history", "None")
    health_conditions = assessment.get("health_conditions", "None")
    medications = assessment.get("medications", "None")
    
    prompt = f"""
User Profile:
- Age: {user_info.get('age', 'N/A')}, Gender: {user_info.get('gender', 'N/A')}
- Weight: {user_info.get('weight_kg', 'N/A')}kg, Height: {user_info.get('height_cm', 'N/A')}cm
- Diet Type: {diet_type}
- Fitness Goal: {goal}
- Medical History: {medical_history}
- Health Conditions: {health_conditions}
- Medications: {medications}

Generate a 7-day meal plan. Return ONLY the raw JSON object."""

    try:
        response = await client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": MEAL_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=4000,
        )
        content = response.choices[0].message.content
        try:
            start = content.find("{")
            end = content.rfind("}") + 1
            if start != -1 and end > start:
                return json.loads(content[start:end])
            return json.loads(content)
        except:
            print(f"JSON Parse failed from Groq: {content[:100]}...")
            return _mock_meal_plan()
    except Exception as e:
        print(f"Groq meal error: {e}")
        return _mock_meal_plan()


async def chat_with_aromi(messages: list, user_context: dict) -> str:
    if not client:
        return "Hello! I'm AROMI, your AI wellness coach. I'm currently in demo mode since the Groq API key hasn't been configured yet. Once configured, I can help you with personalized fitness advice, workout modifications, and nutrition guidance! 💪"
    system_with_context = COACH_SYSTEM_PROMPT
    if user_context:
        system_with_context += f"\n\nUser Context:\n{json.dumps(user_context, indent=2)}"
    try:
        response = await client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "system", "content": system_with_context}] + messages,
            temperature=0.8,
            max_tokens=800,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq chat error: {e}")
        return "I'm having trouble connecting right now. Please try again in a moment! 🙏"


def _mock_workout_plan() -> dict:
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    focuses = ["Upper Body Strength", "Cardio & Core", "Lower Body Strength", "Active Recovery", "Full Body HIIT", "Flexibility & Yoga", "Rest Day"]
    plan = {"week_summary": "Demo 7-day balanced workout plan. Add your Groq API key for personalized plans!", "days": []}
    for i, (day, focus) in enumerate(zip(days, focuses)):
        if focus == "Rest Day":
            plan["days"].append({"day": day, "focus": focus, "duration_minutes": 0, "warmup": [], "main_workout": [], "cooldown": [], "calories_estimated": 0, "youtube_search": "stretching rest day"})
        else:
            plan["days"].append({
                "day": day, "focus": focus, "duration_minutes": [45, 30, 50, 30, 40, 60, 0][i],
                "warmup": [{"exercise": "Light jogging / jumping jacks", "duration": "5 min"}],
                "main_workout": [
                    {"exercise": "Push-ups", "sets": 3, "reps": "12-15", "rest": "60s", "description": "Keep core tight"},
                    {"exercise": "Squats", "sets": 3, "reps": "15", "rest": "60s", "description": "Feet shoulder-width apart"},
                    {"exercise": "Plank", "sets": 3, "reps": "30-45s", "rest": "30s", "description": "Maintain straight line"},
                ],
                "cooldown": [{"exercise": "Static stretch", "duration": "5 min"}],
                "calories_estimated": [300, 250, 350, 200, 400, 280, 0][i],
                "youtube_search": f"{focus} workout beginner"
            })
    return plan


def _mock_meal_plan() -> dict:
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    plan = {"week_summary": "Demo balanced meal plan. Add your Groq API key for personalized nutrition!", "daily_calorie_target": 2000, "days": [], "grocery_list": {"proteins": ["Chicken breast", "Eggs", "Greek yogurt", "Lentils"], "vegetables": ["Broccoli", "Spinach", "Bell peppers", "Tomatoes"], "fruits": ["Banana", "Apple", "Berries", "Orange"], "grains": ["Oats", "Brown rice", "Whole wheat bread", "Quinoa"], "dairy": ["Low-fat milk", "Cottage cheese"], "others": ["Olive oil", "Nuts", "Honey", "Green tea"]}}
    for day in days:
        plan["days"].append({
            "day": day,
            "meals": {
                "breakfast": {"name": "Oatmeal with fruits & nuts", "calories": 380, "protein": 14, "carbs": 58, "fat": 12, "ingredients": ["Oats", "Banana", "Almonds", "Honey", "Milk"]},
                "lunch": {"name": "Grilled chicken salad with quinoa", "calories": 520, "protein": 38, "carbs": 45, "fat": 14, "ingredients": ["Chicken breast", "Quinoa", "Spinach", "Tomatoes", "Olive oil"]},
                "dinner": {"name": "Dal tadka with brown rice", "calories": 580, "protein": 22, "carbs": 88, "fat": 10, "ingredients": ["Lentils", "Brown rice", "Onion", "Tomato", "Spices"]},
                "snacks": {"name": "Greek yogurt with berries", "calories": 180, "protein": 12, "carbs": 20, "fat": 4, "ingredients": ["Greek yogurt", "Mixed berries"]}
            },
            "daily_totals": {"calories": 1660, "protein": 86, "carbs": 211, "fat": 40}
        })
    return plan
