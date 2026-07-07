def detect_life_stage(age: int, occupation: str, income: float = 0) -> dict:
    occupation_lower = occupation.lower()

    is_student = "student" in occupation_lower or "intern" in occupation_lower or age < 23

    if is_student:
        stage = "student"
        if income >= 10000:
            risk_profile = "low_medium"
            income_tier = "earning_student"
        else:
            risk_profile = "low"
            income_tier = "non_earning_student"
    elif age < 35:
        stage = "early_employee"
        risk_profile = "medium_high"
        income_tier = "regular_income"
    elif age < 50:
        stage = "family_stage"
        risk_profile = "medium"
        income_tier = "regular_income"
    elif age < 60:
        stage = "pre_retirement"
        risk_profile = "low_medium"
        income_tier = "regular_income"
    else:
        stage = "retired"
        risk_profile = "very_low"
        income_tier = "fixed_income"

    return {
        "life_stage": stage,
        "risk_profile": risk_profile,
        "income_tier": income_tier,
    }