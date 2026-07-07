from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.market_service import get_market_analysis, generate_recommendation
from app.services.email_service import send_market_recommendation_email
from app import models
from app.core.jwt_handler import decode_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import time

oauth2_scheme = HTTPBearer()
router = APIRouter(prefix="/market", tags=["Market"])

VALID_ASSETS = ["stock", "gold", "silver", "platinum"]

# To avoid spamming, store email status cooldown
_email_sent_cooldown = {}
COOLDOWN_SECONDS = 900  # 15 minutes


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id


@router.get("/{asset_types}")
def market_analysis(
    asset_types: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    # Case-insensitive + multiple assets support
    requested = [a.strip().lower() for a in asset_types.split(",")]

    invalid = [a for a in requested if a not in VALID_ASSETS]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid asset(s): {invalid}. Valid options: {VALID_ASSETS}"
        )

    results = {}
    buy_assets = []
    
    from concurrent.futures import ThreadPoolExecutor
    
    with ThreadPoolExecutor(max_workers=len(requested)) as executor:
        future_to_asset = {
            executor.submit(get_market_analysis, asset): asset for asset in requested
        }
        for future in future_to_asset:
            asset = future_to_asset[future]
            try:
                result = future.result()
                if "error" in result:
                    raise HTTPException(status_code=400, detail=result["error"])
                results[asset] = result
            except Exception as e:
                print(f"Error fetching asset {asset}: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to fetch {asset}")
                
    for asset, result in results.items():
        # Check for BUY opportunity
        sig = result.get("signal", "").lower()
        if "buy" in sig or "oversold" in sig:
            # Format price display correctly
            price_display = ""
            if asset == "stock":
                price_display = f"{result.get('latest_price', 0):,.2f} pts"
            elif asset == "gold":
                price_display = f"₹{result.get('latest_price_inr_per_10gram', 0):,.2f} / 10g"
            else:
                price_display = f"₹{result.get('latest_price_inr_per_gram', 0):,.2f} / gram"
                
            buy_assets.append({
                "asset_type": asset,
                "signal": result.get("signal"),
                "price_display": price_display,
                "rsi": result.get("rsi")
            })

    response = {"assets": results}

    # Recommendation only when multiple assets requested
    recommendation = ""
    if len(requested) > 1:
        recommendation = generate_recommendation(results)
        response["recommendation"] = recommendation

    # If buy signals exist, notify user via email automatically with a cooldown of 15 minutes
    if buy_assets and recommendation:
        now = time.time()
        user_cooldown_key = f"{user_id}_buy_alert"
        if user_cooldown_key not in _email_sent_cooldown or _email_sent_cooldown[user_cooldown_key] < now:
            user = db.query(models.User).filter(models.User.id == user_id).first()
            if user and user.email:
                send_market_recommendation_email(
                    to_email=user.email,
                    user_name=user.name,
                    recommendation=recommendation,
                    details=buy_assets
                )
                # Set 15-minute cooldown
                _email_sent_cooldown[user_cooldown_key] = now + COOLDOWN_SECONDS

    return response