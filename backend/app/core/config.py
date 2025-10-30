from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    app_name: str = "GoTogether API"
    debug: bool = False
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
    
    class Config:
        env_file = ".env"


settings = Settings()
