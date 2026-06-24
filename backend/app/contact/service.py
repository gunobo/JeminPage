import smtplib
import secrets
import hashlib
from email.mime.text import MIMEText
from ..config import settings
from .schemas import ContactForm

SENDER = "portfolio@imjemin.co.kr"

def _send_local(msg: MIMEText):
    with smtplib.SMTP("host.docker.internal", 25) as s:
        s.send_message(msg)

def send_otp_email(email: str, otp: str):
    msg = MIMEText(
        f"안녕하세요!\n\n"
        f"임제민 포트폴리오 Contact 인증 코드입니다.\n\n"
        f"  인증 코드: {otp}\n\n"
        f"5분 안에 입력해주세요.",
        "plain", "utf-8"
    )
    msg["Subject"] = f"[imjemin.co.kr] 인증 코드: {otp}"
    msg["From"] = f"임제민 포트폴리오 <{SENDER}>"
    msg["To"] = email
    _send_local(msg)

def send_contact_email(form: ContactForm):
    msg = MIMEText(
        f"보낸 사람: {form.name} <{form.email}>\n\n{form.message}",
        "plain", "utf-8"
    )
    msg["Subject"] = f"[Portfolio] 문의: {form.name}"
    msg["From"] = f"임제민 포트폴리오 <{SENDER}>"
    msg["To"] = settings.CONTACT_EMAIL or SENDER
    _send_local(msg)

def make_verified_token(email: str, otp: str) -> str:
    return hashlib.sha256(f"{email}:{otp}:{settings.SECRET_KEY}".encode()).hexdigest()
