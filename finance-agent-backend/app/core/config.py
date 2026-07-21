from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GROQ_API_KEY_1: str = ""
    GROQ_API_KEY_2: str = ""
    GROQ_API_KEY_3: str = ""
    GROQ_API_KEY_4: str = ""
    DATABASE_URL: str = "sqlite:///./data/finance.db"
    GMAIL_ADDRESS: str = ""
    GMAIL_APP_PASSWORD: str = ""
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002,http://localhost:8000,http://127.0.0.1:8000"
    RESEND_API_KEY: str = ""
    RESEND_SENDER: str = "onboarding@resend.dev"

    class Config:
        env_file = ".env"


settings = Settings()

