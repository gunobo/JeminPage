import smtplib
from email.mime.text import MIMEText
from ..config import settings
from .schemas import ContactForm

def send_email(form: ContactForm):
    if not settings.SMTP_USER:
        return
    msg = MIMEText(f"From: {form.name} <{form.email}>\n\n{form.message}")
    msg["Subject"] = f"[Portfolio] 문의: {form.name}"
    msg["From"] = settings.SMTP_USER
    msg["To"] = settings.CONTACT_EMAIL
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as s:
        s.starttls()
        s.login(settings.SMTP_USER, settings.SMTP_PASS)
        s.send_message(msg)
