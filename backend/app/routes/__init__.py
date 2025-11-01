from .auth import router as auth_router
from .driver_auth import router as driver_auth_router
from .drivers import router as drivers_router
from .trips import router as trips_router
from .payment import router as payment_router
from .ratings import router as ratings_router

__all__ = [
    "auth_router",
    "driver_auth_router",
    "drivers_router",
    "trips_router",
    "payment_router",
    "ratings_router",
]
