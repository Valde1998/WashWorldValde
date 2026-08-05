import unittest
from unittest.mock import MagicMock, patch

from config import Config
from email_service import EmailDeliveryError, send_email


class EmailServiceTests(unittest.TestCase):
    def setUp(self):
        self.original_values = {
            "SMTP_USERNAME": Config.SMTP_USERNAME,
            "SMTP_APP_PASSWORD": Config.SMTP_APP_PASSWORD,
            "SMTP_FROM": Config.SMTP_FROM,
        }

    def tearDown(self):
        for key, value in self.original_values.items():
            setattr(Config, key, value)

    def test_missing_credentials_are_rejected(self):
        Config.SMTP_USERNAME = ""
        Config.SMTP_APP_PASSWORD = ""
        Config.SMTP_FROM = ""

        with self.assertRaises(EmailDeliveryError):
            send_email("kunde@example.com", "Emne", "Indhold")

    @patch("email_service.smtplib.SMTP")
    def test_email_uses_tls_and_login(self, smtp_class):
        Config.SMTP_USERNAME = "sender@example.com"
        Config.SMTP_APP_PASSWORD = "app-password"
        Config.SMTP_FROM = "sender@example.com"
        smtp = MagicMock()
        smtp_class.return_value.__enter__.return_value = smtp

        send_email("kunde@example.com", "Bekræft email", "Din kode er 123456")

        smtp.starttls.assert_called_once()
        smtp.login.assert_called_once_with("sender@example.com", "app-password")
        smtp.send_message.assert_called_once()


if __name__ == "__main__":
    unittest.main()
