import json
import smtplib
import ssl
from email.message import EmailMessage
from urllib import error, request

from config import Config


class EmailDeliveryError(RuntimeError):
    pass


def smtp_is_configured():
    return bool(Config.SMTP_USERNAME and Config.SMTP_APP_PASSWORD and Config.SMTP_FROM)


def brevo_is_configured():
    return bool(Config.BREVO_API_KEY and Config.EMAIL_FROM)


def send_email_with_brevo(email_to, subject, body):
    payload = json.dumps(
        {
            "sender": {"name": Config.EMAIL_FROM_NAME, "email": Config.EMAIL_FROM},
            "to": [{"email": email_to}],
            "subject": subject,
            "textContent": body,
        }
    ).encode("utf-8")
    email_request = request.Request(
        Config.BREVO_API_URL,
        data=payload,
        headers={
            "accept": "application/json",
            "api-key": Config.BREVO_API_KEY,
            "content-type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(email_request, timeout=Config.SMTP_TIMEOUT_SECONDS) as response:
            if response.status not in {200, 201, 202}:
                raise EmailDeliveryError("Email could not be delivered")
    except (OSError, error.HTTPError, error.URLError) as delivery_error:
        raise EmailDeliveryError("Email could not be delivered") from delivery_error


def send_email_with_smtp(email_to, subject, body):
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


def send_email(email_to, subject, body):
    if brevo_is_configured():
        return send_email_with_brevo(email_to, subject, body)

    return send_email_with_smtp(email_to, subject, body)
