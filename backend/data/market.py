import robin_stocks.robinhood as r
import yfinance as yf
from auth.robinhood import login


def get_ohlcv(symbol: str, interval: str = "5minute", span: str = "day") -> list[dict]:
    login()
    try:
        data = r.get_stock_historicals(symbol, interval=interval, span=span) or []
        return [
            {
                "timestamp": d.get("begins_at"),
                "open": float(d.get("open_price") or 0),
                "high": float(d.get("high_price") or 0),
                "low": float(d.get("low_price") or 0),
                "close": float(d.get("close_price") or 0),
                "volume": float(d.get("volume") or 0),
            }
            for d in data
        ]
    except Exception:
        return []


def get_latest_price(symbol: str) -> float:
    login()
    try:
        return float(r.get_latest_price(symbol)[0] or 0)
    except Exception:
        return 0.0


def get_fundamentals(symbol: str) -> dict:
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        return {
            "pe_ratio": info.get("trailingPE"),
            "market_cap": info.get("marketCap"),
            "52w_high": info.get("fiftyTwoWeekHigh"),
            "52w_low": info.get("fiftyTwoWeekLow"),
            "avg_volume": info.get("averageVolume"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
        }
    except Exception:
        return {}
