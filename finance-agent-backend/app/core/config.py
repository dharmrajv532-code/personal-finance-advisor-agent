from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GROQ_API_KEY_1: str = ""
    GROQ_API_KEY_2: str = ""
    GROQ_API_KEY_3: str = ""
    GROQ_API_KEY_4: str = ""
    DATABASE_URL: str = "sqlite:///./data/finance.db"
    GMAIL_ADDRESS: str = ""
    GMAIL_APP_PASSWORD: str = ""

    class Config:
        env_file = ".env"


settings = Settings()

