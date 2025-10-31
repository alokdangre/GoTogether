import asyncio
import smtplib
from email.message import EmailMessage
from typing import Optional

from .config import settings


class EmailDeliveryError(Exception):
    """Raised when an email cannot be delivered."""


def _build_message(
    to_email: str,
    subject: str,
    text_body: str,
    html_body: Optional[str] = None,
) -> EmailMessage:
    msg = EmailMessage()
    from_name = settings.smtp_from_name or settings.app_name
    from_email = settings.smtp_from_email
    if not from_email:
        raise EmailDeliveryError("SMTP from email is not configured")

    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = to_email
    msg.set_content(text_body)

    if html_body:
        msg.add_alternative(html_body, subtype="html")

    return msg


def _send_email_sync(message: EmailMessage) -> None:
    if not settings.smtp_host:
        raise EmailDeliveryError("SMTP host is not configured")

    host = settings.smtp_host
    port = settings.smtp_port or (587 if settings.smtp_use_tls else 25)

    if settings.smtp_use_tls:
        server = smtplib.SMTP(host, port, timeout=30)
    else:
        server = smtplib.SMTP(host, port, timeout=30)

    try:
        if settings.smtp_use_tls:
            server.starttls()

        if settings.smtp_username:
            if not settings.smtp_password:
                raise EmailDeliveryError("SMTP password is not configured")
            server.login(settings.smtp_username, settings.smtp_password)

        server.send_message(message)
    finally:
        try:
            server.quit()
        except Exception:
            server.close()


async def send_email(
    to_email: str,
    subject: str,
    text_body: str,
    html_body: Optional[str] = None,
) -> None:
    """Send an email asynchronously using SMTP settings."""
    message = _build_message(to_email, subject, text_body, html_body)
    await asyncio.to_thread(_send_email_sync, message)
