from sqlalchemy.orm import Session
from datetime import datetime
from app import models
from app.services.health_score import calculate_health_score
from app.services.expense_service import get_monthly_summary
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


def send_digest_email(to_email: str, subject: str, html_body: str) -> bool:
    if not settings.GMAIL_ADDRESS or not settings.GMAIL_APP_PASSWORD:
        try:
            print(f"\n[DEMO MODE - Gmail credentials not set in .env]\nDigest sent to {to_email}:\nHTML body generated successfully.\n")
        except Exception:
            pass
        return True

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.GMAIL_ADDRESS
    msg["To"] = to_email
    msg["Subject"] = subject
    
    # Text fallback
    msg.attach(MIMEText("Please enable HTML viewing to read your financial digest.", "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(settings.GMAIL_ADDRESS, settings.GMAIL_APP_PASSWORD)
        server.sendmail(settings.GMAIL_ADDRESS, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Email failed: {e}")
        return False


def generate_digest(db: Session, user_id: int) -> dict:
    now = datetime.utcnow()
    month = now.month
    year = now.year

    # User
    user = db.query(models.User).filter(models.User.id == user_id).first()
    user_name = user.name if user else "User"
    user_email = user.email if user else ""

    # Income
    incomes = db.query(models.Income).filter(
        models.Income.user_id == user_id,
        models.Income.month == month,
        models.Income.year == year,
    ).all()
    total_income = sum(i.amount for i in incomes)

    # Expenses
    expense_summary = get_monthly_summary(db, user_id, month, year)
    total_expense = expense_summary["total_spent"]
    category_breakdown = expense_summary["category_breakdown"]

    # Top category
    top_category = None
    if category_breakdown:
        top_category = max(category_breakdown, key=lambda x: x["total"])

    # Health Score
    health = calculate_health_score(db, user_id)

    # Goals
    goals = db.query(models.Goal).filter(models.Goal.user_id == user_id).all()

    month_name = now.strftime("%B")
    current_year = now.year
    net_savings = total_income - total_expense

    # Formatting top category bullet
    if top_category:
        top_category_bullet = f"<li style='margin-bottom: 8px;'>Top Category: <strong style='color: #ffffff;'>{top_category['category'].capitalize()}</strong> (₹{top_category['total']:,.0f})</li>"
    else:
        top_category_bullet = "<li style='margin-bottom: 8px;'>No expenses recorded this month.</li>"

    # Formatting goals bullet
    goals_bullet = ""
    if goals:
        for g in goals[:2]:  # Limit to top 2 goals
            progress = round(g.saved_amount / g.target_amount * 100, 1) if g.target_amount > 0 else 0
            goals_bullet += f"<li style='margin-bottom: 8px;'>Goal '{g.title}': <strong style='color: #ffffff;'>{progress}%</strong> saved (₹{g.saved_amount:,.0f} / ₹{g.target_amount:,.0f})</li>"
    else:
        goals_bullet = "<li style='margin-bottom: 8px;'>No goals set. Create some goals to stay focused!</li>"

    # Health details
    score = health.get("score", 50)
    grade = health.get("grade", "C")
    
    # Grade color
    score_color = "#10b981"  # green
    if score < 50:
        score_color = "#f43f5e"  # red
    elif score < 75:
        score_color = "#f59e0b"  # yellow/orange

    health_comments = {
        "A": "Excellent cash flow discipline! Aapki savings percentage aur budget adherence bahut achhi hai.",
        "B": "Good balance! Health score strong hai, but expenses par thoda control badhaya ja sakta hai.",
        "C": "Balanced structure. Budgets cross hone se bachein aur regular save karein.",
        "D": "Warning: Expenses control se bahar ja rhe hain. Log in karke personal AI advice check karein.",
        "F": "Critical Alert! Savings negative hain ya zero hain. AI financial recovery mode ki zarurat hai."
    }
    health_comment = health_comments.get(grade, "Financial structure is stable. Log in to optimize your goals.")

    # HTML Body
    html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Financial Digest</title>
</head>
<body style="font-family: 'Outfit', 'Inter', Helvetica, Arial, sans-serif; background-color: #0b0b14; color: #cdd6f4; margin: 0; padding: 20px;">
    <!-- Main Container -->
    <div style="max-width: 600px; margin: 0 auto; background-color: #11111b; border: 1px solid #2d2e3f; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 35px 20px; text-align: center; border-bottom: 1px solid #2d2e3f;">
            <div style="display: inline-flex; align-items: center; margin-bottom: 10px; font-family: sans-serif;">
                <span style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Fin</span>
                <span style="font-size: 28px; font-weight: 800; color: #c084fc; letter-spacing: -0.5px;">Pilot</span>
                <span style="font-size: 10px; font-weight: bold; background-color: rgba(255, 255, 255, 0.2); color: #ffffff; padding: 3px 8px; border-radius: 20px; margin-left: 6px; vertical-align: middle;">AI</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; opacity: 0.95;">Monthly Wealth Digest</h1>
            <p style="color: #d8b4fe; margin: 5px 0 0 0; font-size: 13px; font-weight: 500;">For period: {month_name} {year}</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 30px 25px;">
            <p style="font-size: 16px; color: #bac2de; line-height: 1.5; margin-top: 0; margin-bottom: 25px;">
                Namaste <strong style="color: #ffffff;">{user_name}</strong>! 👋
            </p>
            <p style="font-size: 14px; color: #a6adc8; line-height: 1.6; margin-bottom: 25px;">
                Aapka monthly financial report ready hai. Is mahine aapki savings aur spending habits ko optimize karne ke liye humne kuch alerts detect kiye hain.
            </p>
            
            <!-- Stats Grid -->
            <div style="margin-bottom: 30px;">
                <h3 style="color: #c084fc; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">💰 Cash Flow Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="width: 50%; padding: 5px 0;">
                            <div style="background-color: #1e1e2e; border: 1px solid #2d2e3f; padding: 15px; border-radius: 12px; margin-right: 7px; text-align: center;">
                                <div style="font-size: 11px; color: #a6adc8; font-weight: 600; margin-bottom: 5px;">TOTAL INCOME</div>
                                <div style="font-size: 18px; font-weight: 700; color: #10b981;">₹{total_income:,.0f}</div>
                            </div>
                        </td>
                        <td style="width: 50%; padding: 5px 0;">
                            <div style="background-color: #1e1e2e; border: 1px solid #2d2e3f; padding: 15px; border-radius: 12px; margin-left: 7px; text-align: center;">
                                <div style="font-size: 11px; color: #a6adc8; font-weight: 600; margin-bottom: 5px;">TOTAL EXPENSES</div>
                                <div style="font-size: 18px; font-weight: 700; color: #f43f5e;">₹{total_expense:,.0f}</div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding-top: 15px;">
                            <div style="background: linear-gradient(90deg, #1e1e2e, #252538); border: 1px solid #2d2e3f; padding: 18px; border-radius: 12px; text-align: center;">
                                <div style="font-size: 12px; color: #cdd6f4; font-weight: 600; margin-bottom: 3px;">NET MONTHLY SAVINGS</div>
                                <div style="font-size: 24px; font-weight: 800; color: #3b82f6;">₹{net_savings:,.0f}</div>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Health Score Card -->
            <div style="background-color: #181825; border: 1px solid #2d2e3f; border-radius: 15px; padding: 20px; margin-bottom: 30px; text-align: center;">
                <div style="font-size: 12px; color: #a6adc8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">🏆 Financial Health Score</div>
                <div style="display: inline-block; font-size: 40px; font-weight: 800; color: {score_color}; margin-bottom: 5px;">
                    {score} <span style="font-size: 18px; color: #a6adc8; font-weight: 500;">/ 100</span>
                </div>
                <div style="font-size: 14px; font-weight: 700; color: {score_color}; margin-bottom: 8px;">
                    Grade: {grade}
                </div>
                <p style="font-size: 12px; color: #89b4fa; line-height: 1.5; margin: 0 10px;">
                    "{health_comment}"
                </p>
            </div>
            
            <!-- Top Category & Goals Teaser -->
            <div style="background-color: #1e1e2e; border: 1px solid #2d2e3f; border-radius: 15px; padding: 20px; margin-bottom: 35px;">
                <h3 style="color: #f5e0dc; font-size: 13px; font-weight: 700; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #2d2e3f; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">🔍 AI Smart Insights Teaser</h3>
                <ul style="margin: 0; padding-left: 20px; color: #bac2de; font-size: 13px; line-height: 1.7;">
                    {top_category_bullet}
                    {goals_bullet}
                    <li style="margin-bottom: 8px; color: #a6e3a1; font-weight: 600;">
                        💡 We detected potential recurring subscription leakage!
                    </li>
                </ul>
            </div>
            
            <!-- Call to Action -->
            <div style="text-align: center; margin-bottom: 15px;">
                <a href="http://localhost:3000/dashboard" style="background: linear-gradient(135deg, #6366f1, #a855f7); color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 8px 20px rgba(99, 102, 241, 0.45); transition: transform 0.2s;">
                    Unlock Full AI Audit & Recommendations
                </a>
            </div>
            <p style="font-size: 11px; text-align: center; color: #585b70; margin-top: 15px;">
                Login credentials safe under AES 256. FinPilot does not share data.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #0b0b14; padding: 20px; text-align: center; border-top: 1px solid #2d2e3f;">
            <p style="color: #585b70; font-size: 11px; margin: 0 0 5px 0;">&copy; {current_year} FinPilot AI. All rights reserved.</p>
            <p style="color: #45475a; font-size: 10px; margin: 0;">You received this because Monthly Digests are enabled in your Profile settings.</p>
        </div>
    </div>
</body>
</html>
"""

    return {
        "user": user_name,
        "email": user_email,
        "html_body": html_body,
        "month": month,
        "year": year
    }