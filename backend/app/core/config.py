from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings


BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    # App
    app_name: str = "GoTogether API"
    debug: bool = True
    version: str = "1.0.0"
    
    # Database
    database_url: str = "postgresql://gotogether:password@localhost:5432/gotogether"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # OTP (Mock for development)
    otp_mock_enabled: bool = True
    otp_mock_code: str = "123456"
    
    # Payment
    razorpay_key_id: Optional[str] = None
    razorpay_key_secret: Optional[str] = None
    stripe_publishable_key: Optional[str] = None
    stripe_secret_key: Optional[str] = None
    
    # Maps
    google_maps_api_key: Optional[str] = None
    mapbox_access_token: Optional[str] = None
    
    # CORS
    allowed_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Email / SMTP
    smtp_host: Optional[str] = "smtp.gmail.com"
    smtp_port: Optional[int] = 587
    smtp_username: Optional[str] = "alokdangre@gmail.com"
    smtp_password: Optional[str] = "rlcn nhvz knih bxas"
    smtp_use_tls: bool = True
    smtp_from_email: Optional[str] = "alokdangre@gmail.com"
    smtp_from_name: Optional[str] = "GoTogether"

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"


settings = Settings()
