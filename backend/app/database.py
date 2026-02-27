from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    from app.models import user, assessment, workout_plan, meal_plan, chat, progress  # noqa
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Database initialized successfully.")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        # Manual fallback for local development if Postgres is missing
        if "postgresql" in settings.database_url:
            print("💡 Falling back to local SQLite for development...")
            sqlite_engine = create_async_engine("sqlite+aiosqlite:///./arogya.db")
            global AsyncSessionLocal
            AsyncSessionLocal = async_sessionmaker(sqlite_engine, class_=AsyncSession, expire_on_commit=False)
            async with sqlite_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("✅ Local SQLite database initialized (arogya.db).")
