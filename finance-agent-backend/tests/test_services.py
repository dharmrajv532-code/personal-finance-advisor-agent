import unittest
from app.services.life_stage import detect_life_stage
from app.routers.calculator import sip_calculator
from app.services.health_score import calculate_health_score
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app import models
from datetime import datetime


class TestServices(unittest.TestCase):
    def test_detect_life_stage_student(self):
        result = detect_life_stage(age=20, occupation="Student", income=5000)
        self.assertEqual(result["life_stage"], "student")
        self.assertEqual(result["risk_profile"], "low")
        self.assertEqual(result["income_tier"], "non_earning_student")

    def test_detect_life_stage_young_professional(self):
        result = detect_life_stage(age=25, occupation="Software Engineer", income=60000)
        self.assertEqual(result["life_stage"], "early_employee")
        self.assertEqual(result["risk_profile"], "medium_high")
        self.assertEqual(result["income_tier"], "regular_income")

    def test_detect_life_stage_mid_career(self):
        result = detect_life_stage(age=38, occupation="Manager", income=150000)
        self.assertEqual(result["life_stage"], "family_stage")
        self.assertEqual(result["risk_profile"], "medium")
        self.assertEqual(result["income_tier"], "regular_income")

    def test_detect_life_stage_retirement(self):
        result = detect_life_stage(age=62, occupation="Consultant", income=40000)
        self.assertEqual(result["life_stage"], "retired")
        self.assertEqual(result["risk_profile"], "very_low")
        self.assertEqual(result["income_tier"], "fixed_income")

    def test_sip_calculator_math(self):
        # Target: 1,00,000, 5 years (60 months), 12% p.a.
        res = sip_calculator(target_amount=100000.0, tenure_years=5, expected_return_rate=12.0)
        self.assertEqual(res["target_amount"], 100000.0)
        self.assertEqual(res["tenure_years"], 5)
        self.assertEqual(res["expected_return_rate"], 12.0)
        self.assertGreater(res["monthly_sip_required"], 0)
        self.assertGreater(res["total_invested"], 0)
        self.assertGreater(res["total_returns"], 0)
        # Verify invested + returns equals target amount approximately
        self.assertAlmostEqual(res["total_invested"] + res["total_returns"], 100000.0, places=1)

    def test_health_score_calculation(self):
        # Set up an in-memory SQLite database
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=engine)
        Session = sessionmaker(bind=engine)
        db = Session()

        try:
            # Create user
            user = models.User(
                name="Health Score Tester",
                email="health@test.com",
                hashed_password="hash",
                age=28,
                income=50000,
                occupation="Developer"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            now = datetime.utcnow()
            # Add Income
            income = models.Income(
                user_id=user.id,
                amount=50000,
                source="Salary",
                month=now.month,
                year=now.year
            )
            db.add(income)

            # Add Expense (20000 - 40% of income)
            expense = models.Expense(
                user_id=user.id,
                amount=20000,
                category="Food",
                description="Groceries",
                date=now
            )
            db.add(expense)

            # Add Budget (25000)
            budget = models.Budget(
                user_id=user.id,
                category="Food",
                monthly_limit=25000,
                month=now.month,
                year=now.year
            )
            db.add(budget)

            # Add Goal
            goal = models.Goal(
                user_id=user.id,
                title="Emergency Fund",
                target_amount=100000,
                saved_amount=30000
            )
            db.add(goal)
            db.commit()

            health = calculate_health_score(db, user.id)
            self.assertIn("score", health)
            self.assertIn("grade", health)
            self.assertIn("breakdown", health)
            self.assertEqual(health["max_score"], 100)
            self.assertGreaterEqual(health["score"], 0)
            self.assertLessEqual(health["score"], 100)
        finally:
            db.close()

    def test_market_signals(self):
        from app.services.market_service import generate_signal
        self.assertEqual(generate_signal(rsi=75, sma20=100, sma50=90), "sell - overbought")
        self.assertEqual(generate_signal(rsi=25, sma20=80, sma50=90), "strong buy - oversold")
        self.assertEqual(generate_signal(rsi=50, sma20=100, sma50=90), "buy opportunity")

    def test_market_recommendations(self):
        from app.services.market_service import generate_recommendation
        mock_data = {
            "gold": {"rsi": 25, "signal": "strong buy - oversold"},
            "silver": {"rsi": 75, "signal": "sell - overbought"}
        }
        rec = generate_recommendation(mock_data)
        self.assertIn("Gold", rec)
        self.assertIn("Silver", rec)


if __name__ == "__main__":
    unittest.main()

