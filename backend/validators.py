import re


class ValidationError(ValueError):
    pass


EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
LICENSE_PATTERN = re.compile(r"^[A-Z0-9 -]{2,20}$")


def required_text(data, field, label, min_length=1, max_length=120):
    value = str(data.get(field, "")).strip()

    if len(value) < min_length or len(value) > max_length:
        raise ValidationError(f"{label} is invalid")

    return value


def optional_text(data, field, max_length=120):
    value = str(data.get(field, "")).strip()

    if len(value) > max_length:
        raise ValidationError(f"{field} is too long")

    return value


def email(data):
    value = required_text(data, "email", "Email").lower()

    if not EMAIL_PATTERN.match(value):
        raise ValidationError("Email is invalid")

    return value


def password(data):
    return required_text(data, "password", "Password", min_length=8, max_length=80)


def license_plate(data):
    value = required_text(data, "license_plate", "License plate", min_length=2, max_length=20).upper()

    if not LICENSE_PATTERN.match(value):
        raise ValidationError("License plate is invalid")

    return value


def positive_int(data, field, label):
    try:
        value = int(data.get(field))
    except (TypeError, ValueError):
        raise ValidationError(f"{label} is invalid")

    if value < 1:
        raise ValidationError(f"{label} is invalid")

    return value
