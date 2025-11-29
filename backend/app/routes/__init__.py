from .auth import router as auth_router
from .ride_requests import router as ride_requests_router
from .admin_rides import router as admin_rides_router
from .notifications import router as notifications_router
from .user_rides import router as user_rides_router
from .payment import router as payment_router
from .ratings import router as ratings_router
from .admin import router as admin_router
from .analytics import router as analytics_router
from .chat import router as chat_router
from .trips import router as trips_router
from .support import router as support_router

__all__ = [
    "auth_router",
    "ride_requests_router",
    "admin_rides_router",
    "notifications_router",
    "user_rides_router",
    "payment_router",
    "ratings_router",
    "admin_router",
    "analytics_router",
    "chat_router",
    "trips_router",
    "support_router",
]
