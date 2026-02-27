from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://arogya:arogya123@localhost:5432/arogyamitra"
    sync_database_url: str = "postgresql://arogya:arogya123@localhost:5432/arogyamitra"

    # JWT
    secret_key: str = "change-me-super-secret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days

    # AI
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # External APIs
    youtube_api_key: str = ""
    spoonacular_api_key: str = ""

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/calendar/callback"

    # App
    frontend_url: str = "http://localhost:5173"
    environment: str = "development"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
