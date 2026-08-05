import smtplib
import ssl
from email.message import EmailMessage

from config import Config


class EmailDeliveryError(RuntimeError):
    pass


def smtp_is_configured():
    return bool(Config.SMTP_USERNAME and Config.SMTP_APP_PASSWORD and Config.SMTP_FROM)


def send_email(email_to, subject, body):
    if not smtp_is_configured():
        raise EmailDeliveryError(
            "SMTP is not configured. Set SMTP_USERNAME, SMTP_APP_PASSWORD and SMTP_FROM."
        )

    message = EmailMessage()
    message["From"] = Config.SMTP_FROM
    message["To"] = email_to
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=Config.SMTP_TIMEOUT_SECONDS) as smtp:
            smtp.ehlo()
            if Config.SMTP_USE_TLS:
                smtp.starttls(context=ssl.create_default_context())
                smtp.ehlo()
            smtp.login(Config.SMTP_USERNAME, Config.SMTP_APP_PASSWORD)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as error:
        raise EmailDeliveryError("Email could not be delivered") from error
