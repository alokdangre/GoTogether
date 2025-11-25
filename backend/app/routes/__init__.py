from .auth import router as auth_router
from .drivers import router as drivers_router
from .trips import router as trips_router
from .payment import router as payment_router
from .ratings import router as ratings_router
from .admin import router as admin_router
from .analytics import router as analytics_router

__all__ = [
    "auth_router",
    "drivers_router",
    "trips_router",
    "payment_router",
    "ratings_router",
    "admin_router",
    "analytics_router",
]
