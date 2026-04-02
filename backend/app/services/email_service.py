from app.core.config import get_settings


class EmailService:
    def __init__(self):
        self.settings = get_settings()

    def send_otp(self, to_email: str, otp: str, purpose: str) -> None:
        subject = 'Your verification code'
        if purpose == 'forgot_password':
            subject = 'Your password reset code'

        html = (
            f'<p>Your OTP code is: <b>{otp}</b></p>'
            '<p>This code expires in 10 minutes.</p>'
            '<p>If you did not request this, please ignore this email.</p>'
        )

        provider = self.settings.email_provider.lower()
        if provider == 'resend':
            self._send_with_resend(to_email, subject, html)
        elif provider == 'sendgrid':
            self._send_with_sendgrid(to_email, subject, html)
        else:
            raise ValueError('Unsupported EMAIL_PROVIDER. Use resend or sendgrid.')

    def _send_with_resend(self, to_email: str, subject: str, html: str) -> None:
        if not self.settings.resend_api_key:
            raise ValueError('RESEND_API_KEY is required for resend provider')
        import resend

        resend.api_key = self.settings.resend_api_key
        resend.Emails.send({
            'from': self.settings.email_from,
            'to': [to_email],
            'subject': subject,
            'html': html,
        })

    def _send_with_sendgrid(self, to_email: str, subject: str, html: str) -> None:
        if not self.settings.sendgrid_api_key:
            raise ValueError('SENDGRID_API_KEY is required for sendgrid provider')
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        message = Mail(
            from_email=self.settings.email_from,
            to_emails=to_email,
            subject=subject,
            html_content=html,
        )
        sg = SendGridAPIClient(self.settings.sendgrid_api_key)
        sg.send(message)
