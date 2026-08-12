import unittest

from validators import (
    ValidationError,
    email,
    license_plate,
    password,
    positive_int,
    verification_token,
)


class ValidatorTests(unittest.TestCase):
    def test_email_is_normalized(self):
        self.assertEqual(email({"email": " Test@Example.com "}), "test@example.com")

    def test_invalid_email_is_rejected(self):
        with self.assertRaises(ValidationError):
            email({"email": "ikke-en-email"})

    def test_email_with_consecutive_dots_is_rejected(self):
        with self.assertRaises(ValidationError):
            email({"email": "test..bruger@example.com"})

    def test_verification_token_accepts_url_safe_value(self):
        token = "A_secure-token_123456789012345678901234"
        self.assertEqual(verification_token({"token": token}), token)

        with self.assertRaises(ValidationError):
            verification_token({"token": "token med mellemrum som er ugyldig"})

    def test_short_password_is_rejected(self):
        with self.assertRaises(ValidationError):
            password({"password": "kort"})

    def test_license_plate_is_normalized(self):
        self.assertEqual(license_plate({"license_plate": " ab 12345 "}), "AB 12345")

    def test_positive_integer_must_be_greater_than_zero(self):
        with self.assertRaises(ValidationError):
            positive_int({"location_id": 0}, "location_id", "Location")


if __name__ == "__main__":
    unittest.main()
