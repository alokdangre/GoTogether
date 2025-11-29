from app.core.database import engine, Base
from app.models.system_notification import SystemNotification

print("Creating system_notifications table...")
SystemNotification.__table__.create(engine)
print("Done!")
