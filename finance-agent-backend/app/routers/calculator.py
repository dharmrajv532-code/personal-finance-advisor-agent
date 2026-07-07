from fastapi import APIRouter, Query

router = APIRouter(prefix="/calculator", tags=["Calculator"])


@router.get("/sip")
def sip_calculator(
    target_amount: float = Query(..., description="Kitna paisa chahiye? (e.g. 500000)"),
    tenure_years: int = Query(..., description="Kitne SAAL mein chahiye? (e.g. 10)"),
    expected_return_rate: float = Query(..., description="Expected annual return % (e.g. 12.0)")
):
    n = tenure_years * 12
    r = expected_return_rate / 100 / 12

    if r == 0:
        monthly_sip = target_amount / n
    else:
        monthly_sip = (target_amount * r) / ((1 + r) ** n - 1)

    return {
        "target_amount": target_amount,
        "tenure_years": tenure_years,
        "expected_return_rate": expected_return_rate,
        "monthly_sip_required": round(monthly_sip, 2),
        "total_invested": round(monthly_sip * n, 2),
        "total_returns": round(target_amount - (monthly_sip * n), 2)
    }