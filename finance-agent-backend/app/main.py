from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from slowapi import _rate_limit_exceeded_handler
# pyrefly: ignore [missing-import]
from slowapi.errors import RateLimitExceeded
from app.core.rate_limiter import limiter
from app.database import Base, engine
from app import models
from app.routers import auth, expenses, market, income, goals, budget, ai_router, analytics, calculator, notifications, user
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="Personal Finance Advisor Agent",
    swagger_ui_parameters={"persistAuthorization": True}
)


# Split CORS origins by comma and strip whitespaces
cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(goals.router)
app.include_router(expenses.router)
app.include_router(market.router)
app.include_router(income.router)
app.include_router(budget.router)
app.include_router(ai_router.router)
app.include_router(analytics.router)
app.include_router(calculator.router)
app.include_router(notifications.router)

@app.get("/")
def root():
    return {"message": "Finance Advisor Agent API is running"}