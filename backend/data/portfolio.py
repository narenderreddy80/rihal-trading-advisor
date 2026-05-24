import robin_stocks.robinhood as r
from auth.robinhood import login


def get_portfolio() -> list[dict]:
    login()
    positions = r.get_open_stock_positions() or []
    results = []
    for p in positions:
        try:
            symbol = r.get_symbol_by_url(p["instrument"])
            current_price = float(r.get_latest_price(symbol)[0] or 0)
            avg_cost = float(p.get("average_buy_price") or 0)
            quantity = float(p.get("quantity") or 0)
            pnl = (current_price - avg_cost) * quantity
            pnl_pct = ((current_price - avg_cost) / avg_cost * 100) if avg_cost else 0
            results.append({
                "symbol": symbol,
                "quantity": quantity,
                "avg_cost": avg_cost,
                "current_price": current_price,
                "market_value": current_price * quantity,
                "pnl": round(pnl, 2),
                "pnl_pct": round(pnl_pct, 2),
            })
        except Exception:
            continue
    return results


def get_watchlist(name: str = "Default") -> list[str]:
    login()
    try:
        items = r.get_watchlist_by_name(name) or []
        symbols = []
        for item in items:
            sym = item.get("symbol") or r.get_symbol_by_url(item.get("instrument", ""))
            if sym:
                symbols.append(sym)
        return symbols
    except Exception:
        return []


def get_account_info() -> dict:
    login()
    profile = r.load_portfolio_profile() or {}
    account = r.load_account_profile() or {}
    return {
        "equity": float(profile.get("equity") or 0),
        "cash": float(account.get("cash") or 0),
        "buying_power": float(account.get("buying_power") or 0),
        "total_return": float(profile.get("total_return_today") or 0),
    }
