import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import settings
from .schemas import ContactForm

SENDER = "portfolio@imjemin.co.kr"

def _send_local(msg: MIMEMultipart):
    with smtplib.SMTP("host.docker.internal", 25) as s:
        s.send_message(msg)

def send_otp_email(email: str, otp: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[imjemin.co.kr] 인증 코드: {otp}"
    msg["From"] = f"임제민 포트폴리오 <{SENDER}>"
    msg["To"] = email

    digits = "".join(
        f'<span style="display:inline-block;width:48px;height:60px;line-height:60px;text-align:center;'
        f'font-size:28px;font-weight:900;letter-spacing:0;'
        f'border:1px solid #333;margin:0 4px;color:#fff;background:#111;">{d}</span>'
        for d in otp
    )

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:60px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;">
        <!-- Header -->
        <tr>
          <td style="padding:40px 48px 32px;border-bottom:1px solid #1e1e1e;">
            <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#444;">imjemin.co.kr</p>
            <h1 style="margin:12px 0 0;font-size:28px;font-weight:900;letter-spacing:-0.03em;color:#fff;">이메일 인증</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 48px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#444;">Verification Code</p>
            <div style="margin:16px 0 32px;letter-spacing:4px;">{digits}</div>
            <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
              이 코드는 <strong style="color:#888;">5분</strong> 동안 유효합니다.<br>
              직접 요청하지 않았다면 이 메일을 무시하세요.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 48px;border-top:1px solid #1e1e1e;">
            <p style="margin:0;font-size:11px;color:#333;letter-spacing:0.1em;">
              © 2026 임제민 · <a href="https://imjemin.co.kr" style="color:#555;text-decoration:none;">imjemin.co.kr</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    msg.attach(MIMEText(html, "html", "utf-8"))
    _send_local(msg)

def send_contact_email(form: ContactForm):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[Portfolio] 문의: {form.name}"
    msg["From"] = f"임제민 포트폴리오 <{SENDER}>"
    msg["To"] = settings.CONTACT_EMAIL or SENDER

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:60px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;">
        <tr>
          <td style="padding:40px 48px 32px;border-bottom:1px solid #1e1e1e;">
            <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#444;">New Message</p>
            <h1 style="margin:12px 0 0;font-size:24px;font-weight:900;letter-spacing:-0.03em;color:#fff;">{form.name}</h1>
            <p style="margin:6px 0 0;font-size:13px;color:#555;">{form.email}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 48px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#444;">Message</p>
            <p style="margin:0;font-size:15px;color:#aaa;line-height:1.8;white-space:pre-wrap;">{form.message}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 48px;border-top:1px solid #1e1e1e;">
            <p style="margin:0;font-size:11px;color:#333;letter-spacing:0.1em;">
              © 2026 임제민 · <a href="https://imjemin.co.kr" style="color:#555;text-decoration:none;">imjemin.co.kr</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    msg.attach(MIMEText(html, "html", "utf-8"))
    _send_local(msg)
