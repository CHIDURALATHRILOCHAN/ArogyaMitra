from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.schemas.schemas import UserCreate, UserLogin, TokenOut, UserOut
from app.services.auth_service import hash_password, verify_password, create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    result = await db.execute(select(User).where(User.id == payload.get("sub")))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.post("/register", response_model=TokenOut, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check email/username uniqueness
    result = await db.execute(select(User).where((User.email == data.email) | (User.username == data.username)))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already registered")

    user = User(
        email=data.email,
        username=data.username,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        age=data.age,
        gender=data.gender,
        height_cm=data.height_cm,
        weight_kg=data.weight_kg,
        fitness_level=data.fitness_level or "beginner",
        fitness_goal=data.fitness_goal or "maintenance",
        workout_preference=data.workout_preference or "home",
        diet_preference=data.diet_preference or "no_restriction",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    role_val = user.role if isinstance(user.role, str) else str(user.role)
    token = create_access_token({"sub": str(user.id), "role": role_val})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=TokenOut)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    # Support login via username OR email
    if data.username:
        result = await db.execute(select(User).where(User.username == data.username))
    elif data.email:
        result = await db.execute(select(User).where(User.email == data.email))
    else:
        raise HTTPException(status_code=400, detail="Provide username or email")
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    role_val = user.role if isinstance(user.role, str) else str(user.role)
    token = create_access_token({"sub": str(user.id), "role": role_val})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
