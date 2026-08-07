import re


class ValidationError(ValueError):
    pass


EMAIL_PATTERN = re.compile(r"^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}$", re.IGNORECASE)
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

    local_part, _, domain = value.partition("@")
    domain_labels = domain.split(".")

    if (
        not EMAIL_PATTERN.fullmatch(value)
        or ".." in value
        or len(local_part) > 64
        or any(label.startswith("-") or label.endswith("-") for label in domain_labels)
    ):
        raise ValidationError("Email is invalid")

    return value


def verification_token(data):
    value = required_text(data, "token", "Verification token", min_length=32, max_length=128)

    if not re.fullmatch(r"[A-Za-z0-9_-]+", value):
        raise ValidationError("Verification token is invalid")

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
