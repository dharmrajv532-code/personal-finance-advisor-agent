from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ---------- User ----------
class UserCreate(BaseModel):
    name: str
    age: int
    income: float
    occupation: str


class UserResponse(BaseModel):
    id: int
    name: str
    age: int
    income: float
    occupation: str
    life_stage: Optional[str] = None
    risk_profile: Optional[str] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    income: Optional[float] = None
    occupation: Optional[str] = None
    risk_profile: Optional[str] = None
    life_stage: Optional[str] = None


# ---------- Expense ----------
class ExpenseCreate(BaseModel):
    amount: float
    category: str
    description: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: int
    amount: float
    category: str
    description: Optional[str] = None
    date: datetime

    class Config:
        from_attributes = True


# ---------- Goal ----------
class GoalCreate(BaseModel):
    user_id: int
    title: str
    target_amount: float
    deadline: Optional[datetime] = None


class GoalResponse(BaseModel):
    id: int
    title: str
    target_amount: float
    saved_amount: float
    deadline: Optional[datetime] = None

    class Config:
        from_attributes = True

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[float] = None
    saved_amount: Optional[float] = None
    deadline: Optional[datetime] = None        


# ---------- Auth ----------
class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    age: int
    income: float
    occupation: str

#---------user------------
class UserLogin(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    reset_code: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ---------- Expense Summary ----------
class CategorySummary(BaseModel):
    category: str
    total: float


class ExpenseSummaryResponse(BaseModel):
    total_spent: float
    category_breakdown: list[CategorySummary]


# ---------- Income ----------

class IncomeCreate(BaseModel):
    amount: float
    source: Optional[str] = "salary"  # salary, freelance, business, other
    month: int
    year: int
    note: Optional[str] = None

class IncomeResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    source: str
    month: int
    year: int
    note: Optional[str]

    class Config:
        from_attributes = True

class IncomeUpdate(BaseModel):
    amount: Optional[float] = None
    source: Optional[str] = None
    note: Optional[str] = None    

#----------- Budget ----------

class BudgetCreate(BaseModel):
    category: str
    monthly_limit: float
    month: int
    year: int


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category: str
    monthly_limit: float
    month: int
    year: int

    class Config:
        from_attributes = True


class BudgetStatusResponse(BaseModel):
    category: str
    monthly_limit: float
    spent: float
    remaining: float
    is_exceeded: bool    

#---------- Budget Update ----------   

class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    monthly_limit: Optional[float] = None
    month: Optional[int] = None
    year: Optional[int] = None 