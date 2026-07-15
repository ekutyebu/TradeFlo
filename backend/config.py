from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str = "sqlite:///./tradeflo.db"
    secret_key: str = "change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080
    gemini_api_key: Optional[str] = None
    frontend_url: str = "http://localhost:3000"
    backend_port: int = 8000

    class Config:
        env_file = ".env"


settings = Settings()
