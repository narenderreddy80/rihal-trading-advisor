import robin_stocks.robinhood as r
from auth.robinhood import login
from datetime import date, timedelta


def get_options_signals(symbol: str) -> list[dict]:
    login()
    signals = []
    try:
        # Look at expirations 7-45 days out
        today = date.today()
        expirations = r.get_chains(symbol)
        if not expirations:
            return []

        exp_dates = expirations.get("expiration_dates", [])
        target_dates = [
            d for d in exp_dates
            if timedelta(7) <= (date.fromisoformat(d) - today) <= timedelta(45)
        ][:3]

        for exp_date in target_dates:
            for opt_type in ("call", "put"):
                chain = r.find_options_by_expiration(
                    symbol, expirationDate=exp_date, optionType=opt_type
                ) or []
                for opt in chain:
                    try:
                        iv = float(opt.get("implied_volatility") or 0)
                        delta = float(opt.get("delta") or 0)
                        theta = float(opt.get("theta") or 0)
                        ask = float(opt.get("ask_price") or 0)
                        bid = float(opt.get("bid_price") or 0)
                        strike = float(opt.get("strike_price") or 0)
                        volume = int(opt.get("volume") or 0)
                        open_interest = int(opt.get("open_interest") or 0)

                        # Filter: meaningful delta + reasonable IV + liquid
                        if abs(delta) < 0.2 or iv <= 0 or ask <= 0:
                            continue

                        action = _determine_action(opt_type, delta, iv, theta)
                        if action == "SKIP":
                            continue

                        signals.append({
                            "type": opt_type,
                            "action": action,
                            "strike": strike,
                            "expiry": exp_date,
                            "iv": round(iv * 100, 1),
                            "delta": round(delta, 3),
                            "theta": round(theta, 4),
                            "ask": ask,
                            "bid": bid,
                            "spread_pct": round((ask - bid) / ask * 100, 1) if ask else 0,
                            "volume": volume,
                            "open_interest": open_interest,
                        })
                    except Exception:
                        continue

    except Exception:
        return []

    # Sort: highest absolute delta first
    signals.sort(key=lambda x: abs(x["delta"]), reverse=True)
    return signals[:10]


def _determine_action(opt_type: str, delta: float, iv: float, theta: float) -> str:
    # High IV = prefer selling; low IV = prefer buying
    high_iv = iv > 0.4

    if opt_type == "call":
        if delta > 0.4 and not high_iv:
            return "BUY CALL"
        if delta > 0.3 and high_iv:
            return "SELL CALL"
    elif opt_type == "put":
        if delta < -0.4 and not high_iv:
            return "BUY PUT"
        if delta < -0.3 and high_iv:
            return "SELL PUT"
    return "SKIP"
