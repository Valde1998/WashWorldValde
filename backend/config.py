import os


class Config:
    PORT = int(os.getenv("PORT", "5001"))
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
    DB_NAME = os.getenv("DB_NAME", "cleanwash")
    DB_CONNECT_RETRIES = int(os.getenv("DB_CONNECT_RETRIES", "60"))
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-in-production")
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ]
    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME", "").strip()
    SMTP_APP_PASSWORD = os.getenv("SMTP_APP_PASSWORD", "").replace(" ", "")
    SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USERNAME).strip()
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    SMTP_TIMEOUT_SECONDS = int(os.getenv("SMTP_TIMEOUT_SECONDS", "15"))
    BREVO_API_KEY = os.getenv("BREVO_API_KEY", "").strip()
    BREVO_API_URL = os.getenv("BREVO_API_URL", "https://api.brevo.com/v3/smtp/email").strip()
    EMAIL_FROM = os.getenv("EMAIL_FROM", SMTP_FROM).strip()
    EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "WashWorld").strip()
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    EMAIL_VERIFICATION_TTL_MINUTES = int(os.getenv("EMAIL_VERIFICATION_TTL_MINUTES", "15"))
    EMAIL_VERIFICATION_RESEND_SECONDS = int(os.getenv("EMAIL_VERIFICATION_RESEND_SECONDS", "60"))
