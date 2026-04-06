import hashlib
import random
from datetime import datetime, timedelta, timezone


def getCardStatus(application_id: str) -> dict:
    seed = int(hashlib.md5(application_id.encode()).hexdigest(), 16)
    rng = random.Random(seed)

    status = rng.choice(["pending", "under_review", "approved", "rejected"])
    applied_date = datetime.now(timezone.utc) - timedelta(days=rng.randint(1, 60))
    estimated_days = rng.randint(3, 10)

    return {
        "type": "card_status",
        "application_id": application_id,
        "status": status,
        "applied_date": applied_date.strftime("%Y-%m-%d"),
        "estimated_days": estimated_days,
    }


def getTransactionStatus(transaction_id: str) -> dict:
    seed = int(hashlib.md5(transaction_id.encode()).hexdigest(), 16)
    rng = random.Random(seed)

    status = rng.choice(["success", "failed", "processing", "refunded"])
    amount = round(rng.uniform(100, 5000), 2)
    merchants = [
        "SM Supermarket",
        "Grab",
        "Shopee",
        "Jollibee",
        "Lazada",
        "Mercury Drug",
        "Robinsons Supermarket",
        "Uniqlo PH",
        "National Bookstore",
        "McDonald's PH",
    ]
    merchant = rng.choice(merchants)
    date = datetime.now(timezone.utc) - timedelta(days=rng.randint(0, 30))

    result: dict = {
        "type": "transaction_status",
        "transaction_id": transaction_id,
        "status": status,
        "amount": amount,
        "currency": "PHP",
        "merchant": merchant,
        "date": date.strftime("%Y-%m-%d"),
    }

    if status == "failed":
        result["failure_reason"] = rng.choice(
            [
                "insufficient_funds",
                "card_expired",
                "network_error",
                "daily_limit_exceeded",
            ]
        )

    return result
