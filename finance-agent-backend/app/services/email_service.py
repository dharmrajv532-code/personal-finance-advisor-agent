import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import urllib.request
import urllib.error
import json

def send_email_via_resend(to_email: str, subject: str, html_body: str) -> bool:
    if not settings.RESEND_API_KEY:
        print(f"\n[DEMO MODE - Resend API Key not set]\nTo: {to_email}\nSubject: {subject}\n")
        return True

    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json",
    }
    
    sender = settings.RESEND_SENDER or "onboarding@resend.dev"
    data = {
        "from": f"FinPilot AI <{sender}>",
        "to": [to_email],
        "subject": subject,
        "html": html_body
    }
    
    try:
        req = urllib.request.Request(
            url, 
            data=json.dumps(data).encode("utf-8"), 
            headers=headers, 
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10.0) as response:
            res_body = response.read().decode("utf-8")
            print(f"Resend success: {res_body}")
            return True
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"Resend HTTP Error {e.code}: {err_body}")
        return False
    except Exception as e:
        print(f"Resend Error: {e}")
        return False


def send_reset_code_email(to_email: str, reset_code: str):
    subject = "Your Password Reset Code - Finance Advisor Agent"
    body_text = f"""Hello,

You requested to reset your password.

Your reset code is: {reset_code}

This code will expire in 10 minutes. If you did not request this, please ignore this email.

- Finance Advisor Agent
"""
    body_html = f"""<p>Hello,</p>
<p>You requested to reset your password.</p>
<p>Your reset code is: <strong>{reset_code}</strong></p>
<p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
<p>- Finance Advisor Agent</p>"""

    # Use Resend if API Key is configured
    if settings.RESEND_API_KEY:
        return send_email_via_resend(to_email, subject, body_html)

    if not settings.GMAIL_ADDRESS or not settings.GMAIL_APP_PASSWORD:
        print(f"\n[DEMO MODE - Gmail credentials not set in .env]\nReset Code for {to_email}: {reset_code}\n")
        return True

    subject = "Your Password Reset Code - Finance Advisor Agent"
    body = f"""Hello,

You requested to reset your password.

Your reset code is: {reset_code}

This code will expire in 10 minutes. If you did not request this, please ignore this email.

- Finance Advisor Agent
"""

    msg = MIMEMultipart()
    msg["From"] = settings.GMAIL_ADDRESS
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=10.0)
        server.starttls()
        server.login(settings.GMAIL_ADDRESS, settings.GMAIL_APP_PASSWORD)
        server.sendmail(settings.GMAIL_ADDRESS, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False


def send_market_recommendation_email(to_email: str, user_name: str, recommendation: str, details: list) -> bool:
    subject = "📈 FinPilot AI: Actionable Buy Suggestion for You!"
    
    details_html = ""
    for d in details:
        details_html += f"""
        <div style="background-color: #1e1e2e; border: 1px solid #313244; padding: 12px; margin-bottom: 8px; border-radius: 8px;">
            <strong style="color: #cdd6f4; text-transform: capitalize;">{d['asset_type']}</strong> - 
            <span style="color: #a6e3a1; font-weight: bold;">{d['signal'].upper()}</span><br/>
            <span style="color: #bac2de; font-size: 12px;">Price: {d['price_display']} | RSI: {d['rsi']}</span>
        </div>
        """
        
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Market Alert</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #11111b; color: #cdd6f4; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #181825; border: 1px solid #313244; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            <div style="background: linear-gradient(135deg, #b4befe, #89b4fa); padding: 24px; text-align: center;">
                <h1 style="color: #11111b; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">FinPilot AI</h1>
                <p style="color: #1e1e2e; margin: 4px 0 0 0; font-size: 14px; font-weight: 600;">Automated Technical Buy Signal</p>
            </div>
            <div style="padding: 24px;">
                <p style="font-size: 16px; line-height: 1.6; color: #cdd6f4; margin-top: 0;">
                    Hello {user_name},
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #bac2de;">
                    Our automated market analytics algorithm has detected strong technical buy signals for your portfolio:
                </p>
                <div style="background-color: #1e1e2e; border-left: 4px solid #a6e3a1; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: #a6e3a1; line-height: 1.5;">
                        💡 AI Suggestion:<br/>
                        <span style="color: #cdd6f4; font-weight: normal; font-size: 14px;">{recommendation}</span>
                    </p>
                </div>
                
                <h3 style="color: #f5e0dc; font-size: 14px; margin-top: 24px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Asset Details</h3>
                {details_html}

                <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
                    <a href="http://localhost:3000/market" style="background: linear-gradient(135deg, #b4befe, #89b4fa); color: #11111b; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(137, 180, 250, 0.3);">
                        View Detailed Insights on FinPilot
                    </a>
                </div>
            </div>
            <div style="background-color: #11111b; padding: 16px; text-align: center; border-top: 1px solid #313244;">
                <p style="color: #6c7086; margin: 0; font-size: 11px;">
                    Disclaimer: Technical indicators do not guarantee future returns. Check risk parameters before investing.
                </p>
            </div>
        </div>
    </body>
    </html>
    """

    # Use Resend if API Key is configured
    if settings.RESEND_API_KEY:
        return send_email_via_resend(to_email, subject, html_body)

    if not settings.GMAIL_ADDRESS or not settings.GMAIL_APP_PASSWORD:
        print(f"\n[DEMO MODE - Gmail credentials not set in .env]\nMarket recommendation sent to {to_email}:\n{recommendation}\n")
        return True

    subject = "📈 FinPilot AI: Actionable Buy Suggestion for You!"
    
    details_html = ""
    for d in details:
        details_html += f"""
        <div style="background-color: #1e1e2e; border: 1px solid #313244; padding: 12px; margin-bottom: 8px; border-radius: 8px;">
            <strong style="color: #cdd6f4; text-transform: capitalize;">{d['asset_type']}</strong> - 
            <span style="color: #a6e3a1; font-weight: bold;">{d['signal'].upper()}</span><br/>
            <span style="color: #bac2de; font-size: 12px;">Price: {d['price_display']} | RSI: {d['rsi']}</span>
        </div>
        """
        
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Market Alert</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #11111b; color: #cdd6f4; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #181825; border: 1px solid #313244; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            <div style="background: linear-gradient(135deg, #b4befe, #89b4fa); padding: 24px; text-align: center;">
                <h1 style="color: #11111b; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">FinPilot AI</h1>
                <p style="color: #1e1e2e; margin: 4px 0 0 0; font-size: 14px; font-weight: 600;">Automated Technical Buy Signal</p>
            </div>
            <div style="padding: 24px;">
                <p style="font-size: 16px; line-height: 1.6; color: #cdd6f4; margin-top: 0;">
                    Hello {user_name},
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #bac2de;">
                    Our automated market analytics algorithm has detected strong technical buy signals for your portfolio:
                </p>
                <div style="background-color: #1e1e2e; border-left: 4px solid #a6e3a1; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: #a6e3a1; line-height: 1.5;">
                        💡 AI Suggestion:<br/>
                        <span style="color: #cdd6f4; font-weight: normal; font-size: 14px;">{recommendation}</span>
                    </p>
                </div>
                
                <h3 style="color: #f5e0dc; font-size: 14px; margin-top: 24px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Asset Details</h3>
                {details_html}

                <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
                    <a href="http://localhost:3000/market" style="background: linear-gradient(135deg, #b4befe, #89b4fa); color: #11111b; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(137, 180, 250, 0.3);">
                        View Detailed Insights on FinPilot
                    </a>
                </div>
            </div>
            <div style="background-color: #11111b; padding: 16px; text-align: center; border-top: 1px solid #313244;">
                <p style="color: #6c7086; margin: 0; font-size: 11px;">
                    Disclaimer: Technical indicators do not guarantee future returns. Check risk parameters before investing.
                </p>
            </div>
        </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.GMAIL_ADDRESS
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(recommendation, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=10.0)
        server.starttls()
        server.login(settings.GMAIL_ADDRESS, settings.GMAIL_APP_PASSWORD)
        server.sendmail(settings.GMAIL_ADDRESS, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Market recommendation email sending failed: {e}")
        return False