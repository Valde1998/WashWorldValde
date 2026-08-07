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
            "BREVO_API_KEY": Config.BREVO_API_KEY,
            "EMAIL_FROM": Config.EMAIL_FROM,
            "EMAIL_FROM_NAME": Config.EMAIL_FROM_NAME,
        }

    def tearDown(self):
        for key, value in self.original_values.items():
            setattr(Config, key, value)

    def test_missing_credentials_are_rejected(self):
        Config.SMTP_USERNAME = ""
        Config.SMTP_APP_PASSWORD = ""
        Config.SMTP_FROM = ""
        Config.BREVO_API_KEY = ""
        Config.EMAIL_FROM = ""

        with self.assertRaises(EmailDeliveryError):
            send_email("kunde@example.com", "Emne", "Indhold")

    @patch("email_service.smtplib.SMTP")
    def test_email_uses_tls_and_login(self, smtp_class):
        Config.BREVO_API_KEY = ""
        Config.SMTP_USERNAME = "sender@example.com"
        Config.SMTP_APP_PASSWORD = "app-password"
        Config.SMTP_FROM = "sender@example.com"
        smtp = MagicMock()
        smtp_class.return_value.__enter__.return_value = smtp

        send_email("kunde@example.com", "Bekræft email", "Din kode er 123456")

        smtp.starttls.assert_called_once()
        smtp.login.assert_called_once_with("sender@example.com", "app-password")
        smtp.send_message.assert_called_once()

    @patch("email_service.request.urlopen")
    def test_brevo_api_is_preferred_when_configured(self, urlopen):
        Config.BREVO_API_KEY = "brevo-secret"
        Config.EMAIL_FROM = "sender@example.com"
        Config.EMAIL_FROM_NAME = "WashWorld"
        response = MagicMock()
        response.status = 201
        urlopen.return_value.__enter__.return_value = response

        send_email("kunde@example.com", "BekrÃ¦ft email", "Klik pÃ¥ linket")

        email_request = urlopen.call_args.args[0]
        self.assertEqual(email_request.full_url, Config.BREVO_API_URL)
        self.assertEqual(email_request.headers["Api-key"], "brevo-secret")
        smtp_payload = email_request.data.decode("utf-8")
        self.assertIn("kunde@example.com", smtp_payload)


if __name__ == "__main__":
    unittest.main()
