import unittest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime

from app.main import app
from app.database import Base, get_db
from app.core.rate_limiter import limiter

# Setup in-memory test database with StaticPool so all connections share the same memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Disable rate limiter for testing
        limiter.enabled = False
        app.dependency_overrides[get_db] = override_get_db
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=engine)
        app.dependency_overrides.clear()
        limiter.enabled = True

    def test_01_root_endpoint(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())
        self.assertIn("Finance Advisor Agent API is running", response.json()["message"])

    def test_02_sip_calculator_endpoint(self):
        response = self.client.get(
            "/calculator/sip",
            params={
                "target_amount": 500000,
                "tenure_years": 10,
                "expected_return_rate": 12.0
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["target_amount"], 500000)
        self.assertEqual(data["tenure_years"], 10)
        self.assertEqual(data["expected_return_rate"], 12.0)
        self.assertIn("monthly_sip_required", data)
        self.assertIn("total_invested", data)
        self.assertIn("total_returns", data)

    def test_03_auth_flow(self):
        # 1. Register
        user_payload = {
            "name": "Jane Tester",
            "email": "jane@example.com",
            "password": "SecurePassword123!"
        }
        reg_res = self.client.post("/auth/register", json=user_payload)
        self.assertEqual(reg_res.status_code, 200)
        reg_data = reg_res.json()
        self.assertEqual(reg_data["email"], "jane@example.com")
        self.assertEqual(reg_data["name"], "Jane Tester")
        self.assertIn("id", reg_data)

        # 2. Duplicate register fails
        dup_res = self.client.post("/auth/register", json=user_payload)
        self.assertEqual(dup_res.status_code, 400)

        # 3. Login with wrong password fails
        bad_login = self.client.post(
            "/auth/login",
            json={"email": "jane@example.com", "password": "WrongPassword"}
        )
        self.assertEqual(bad_login.status_code, 401)

        # 4. Login with correct password succeeds
        good_login = self.client.post(
            "/auth/login",
            json={"email": "jane@example.com", "password": "SecurePassword123!"}
        )
        self.assertEqual(good_login.status_code, 200)
        login_data = good_login.json()
        self.assertIn("access_token", login_data)

        # Save token for next tests
        TestAPI.token = login_data["access_token"]
        TestAPI.user_id = reg_data["id"]
        TestAPI.headers = {"Authorization": f"Bearer {TestAPI.token}"}

    def test_04_user_profile(self):
        # Retrieve user profile
        user_res = self.client.get(f"/user/{self.user_id}")
        self.assertEqual(user_res.status_code, 200)
        self.assertEqual(user_res.json()["name"], "Jane Tester")

        # Update user profile with age, occupation, income to trigger life stage
        update_payload = {
            "age": 27,
            "occupation": "Product Designer",
            "income": 75000.0
        }
        put_res = self.client.put(f"/user/{self.user_id}", json=update_payload)
        self.assertEqual(put_res.status_code, 200)
        updated_data = put_res.json()
        self.assertEqual(updated_data["age"], 27)
        self.assertEqual(updated_data["life_stage"], "early_employee")
        self.assertEqual(updated_data["risk_profile"], "medium_high")

    def test_05_income_crud(self):
        now = datetime.utcnow()
        # Add income
        income_payload = {
            "amount": 75000.0,
            "source": "Salary",
            "month": now.month,
            "year": now.year,
            "note": "Monthly base salary"
        }
        res = self.client.post("/income/add", json=income_payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        inc_data = res.json()
        self.assertEqual(inc_data["amount"], 75000.0)

        # List income
        list_res = self.client.get("/income/list", headers=self.headers)
        self.assertEqual(list_res.status_code, 200)
        self.assertGreaterEqual(len(list_res.json()), 1)

    def test_06_expense_crud(self):
        # Add expense
        exp_payload = {
            "amount": 15000.0,
            "category": "Rent",
            "description": "Monthly apartment rent"
        }
        res = self.client.post("/expenses/", json=exp_payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        exp_data = res.json()
        self.assertEqual(exp_data["amount"], 15000.0)
        self.assertEqual(exp_data["category"], "Rent")

        # List expenses
        list_res = self.client.get("/expenses/", headers=self.headers)
        self.assertEqual(list_res.status_code, 200)
        self.assertGreaterEqual(len(list_res.json()), 1)

        # Summary
        sum_res = self.client.get("/expenses/summary", headers=self.headers)
        self.assertEqual(sum_res.status_code, 200)
        self.assertIn("total_spent", sum_res.json())

    def test_07_budget_crud(self):
        now = datetime.utcnow()
        # Add budget
        budget_payload = {
            "category": "Food",
            "monthly_limit": 12000.0,
            "month": now.month,
            "year": now.year
        }
        res = self.client.post("/budget/", json=budget_payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        b_data = res.json()
        self.assertEqual(b_data["category"].lower(), "food")
        self.assertEqual(b_data["monthly_limit"], 12000.0)

        # List budgets
        list_res = self.client.get("/budget/", headers=self.headers)
        self.assertEqual(list_res.status_code, 200)
        self.assertGreaterEqual(len(list_res.json()), 1)

    def test_08_goals_crud(self):
        # Add goal
        goal_payload = {
            "title": "MacBook Pro",
            "target_amount": 200000.0,
            "deadline": "2027-12-31T00:00:00"
        }
        res = self.client.post("/goals/", json=goal_payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        g_data = res.json()
        goal_id = g_data["id"]
        self.assertEqual(g_data["title"], "MacBook Pro")
        self.assertEqual(g_data["saved_amount"], 0.0)

        # Add savings
        save_res = self.client.post(
            f"/goals/{goal_id}/add-savings?amount=25000.0",
            headers=self.headers
        )
        self.assertEqual(save_res.status_code, 200)
        self.assertEqual(save_res.json()["saved_amount"], 25000.0)

    def test_09_analytics_dashboard(self):
        # Check dashboard aggregation
        dash_res = self.client.get("/analytics/dashboard", headers=self.headers)
        self.assertEqual(dash_res.status_code, 200)
        dash_data = dash_res.json()
        self.assertIn("income", dash_data)
        self.assertIn("expenses", dash_data)
        self.assertIn("health_score", dash_data)
        self.assertIn("goals", dash_data)

    def test_10_market_validation(self):
        # Invalid asset returns 400
        invalid_res = self.client.get("/market/crypto_bitcoin", headers=self.headers)
        self.assertEqual(invalid_res.status_code, 400)
        self.assertIn("Invalid asset", invalid_res.json()["detail"])


if __name__ == "__main__":
    unittest.main()
