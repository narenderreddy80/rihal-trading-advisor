import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from auth.robinhood import login, logout
from data.portfolio import get_portfolio, get_watchlist, get_account_info
from data.market import get_ohlcv, get_fundamentals, get_latest_price
from data.news import get_news
from strategies.technical import compute_signals
from strategies.options import get_options_signals
from strategies.sentiment import get_sentiment_signal
from ai.claude_advisor import get_recommendation
from alerts.telegram import send_signal, send_message
from alerts.digest import send_daily_digest
import scheduler as sched

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory cache for latest signals
_signal_cache: list[dict] = []


def _run_signal_scan():
    global _signal_cache
    logger.info("Running signal scan...")
    try:
        symbols = get_watchlist()
        portfolio_symbols = [p["symbol"] for p in get_portfolio()]
        all_symbols = list(set(symbols + portfolio_symbols))

        results = []
        for symbol in all_symbols:
            try:
                sig = _analyze_symbol(symbol)
                results.append(sig)
                # Only push Telegram alert for HIGH confidence non-HOLD signals
                ai = sig.get("ai", {})
                if ai.get("confidence") == "HIGH" and ai.get("action") != "HOLD":
                    send_signal(sig)
            except Exception as e:
                logger.warning(f"Error analyzing {symbol}: {e}")

        _signal_cache = results
        logger.info(f"Scan complete: {len(results)} symbols analyzed")
    except Exception as e:
        logger.error(f"Signal scan failed: {e}")


def _run_digest():
    global _signal_cache
    if _signal_cache:
        send_daily_digest(_signal_cache)
        send_message("📬 Daily digest sent to your email.")


def _analyze_symbol(symbol: str) -> dict:
    ohlcv = get_ohlcv(symbol, interval="5minute", span="day")
    tech = compute_signals(symbol, ohlcv)
    sentiment = get_sentiment_signal(symbol)
    options = get_options_signals(symbol)
    fundamentals = get_fundamentals(symbol)
    ai = get_recommendation(symbol, tech, sentiment, options, fundamentals)

    return {
        "symbol": symbol,
        "tech": tech,
        "sentiment": sentiment,
        "options": options,
        "fundamentals": fundamentals,
        "ai": ai,
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    login()
    sched.start(_run_signal_scan, _run_digest)
    yield
    sched.stop()
    logout()


app = FastAPI(title="Rihal Trading Advisor", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/account")
def account():
    try:
        return get_account_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/portfolio")
def portfolio():
    try:
        return get_portfolio()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/watchlist")
def watchlist():
    try:
        return get_watchlist()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/signals")
def signals():
    return _signal_cache


@app.get("/api/signals/{symbol}")
def signal_for_symbol(symbol: str, background_tasks: BackgroundTasks):
    symbol = symbol.upper()
    # Check cache first
    cached = next((s for s in _signal_cache if s["symbol"] == symbol), None)
    if cached:
        return cached
    # Fresh analysis
    try:
        result = _analyze_symbol(symbol)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/scan")
def trigger_scan(background_tasks: BackgroundTasks):
    background_tasks.add_task(_run_signal_scan)
    return {"status": "scan triggered"}


@app.get("/api/news/{symbol}")
def news(symbol: str):
    return get_news(symbol.upper(), limit=15)


@app.get("/api/chart/{symbol}")
def chart(symbol: str, interval: str = "5minute", span: str = "day"):
    return get_ohlcv(symbol.upper(), interval=interval, span=span)
