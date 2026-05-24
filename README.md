# Rihal Trading Advisor

An AI-powered stock trading advisor that reads your Robinhood portfolio and watchlist, analyzes market data using technical indicators, options flow, and news sentiment, then uses Claude AI to generate actionable buy/sell/options recommendations.

## Features

- **Robinhood Integration** — reads your live portfolio, positions, and watchlist
- **Technical Analysis** — RSI, MACD, Bollinger Bands, Moving Averages, volume analysis
- **Options Signals** — put/call suggestions based on IV rank, delta, and liquidity
- **News Sentiment** — real-time headline analysis using NLP
- **Claude AI Advisor** — plain-English trade reasoning with entry/target/stop prices
- **Web Dashboard** — live-updating React UI with charts, signal cards, and portfolio view
- **Telegram Alerts** — instant push notifications for high-confidence signals
- **Daily Email Digest** — pre-market summary sent to your inbox every morning
- **Suggestions Only** — no auto-execution; you confirm every trade manually

## Stack

| Layer | Tech |
|---|---|
| Backend | Python, FastAPI, APScheduler |
| Data | robin-stocks, yfinance, feedparser |
| AI | Claude (claude-sonnet-4-6) via Anthropic SDK |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts |
| Alerts | Telegram Bot API, Gmail SMTP |
| Deploy | Docker + docker-compose |

## Quick Start

### 1. Clone and configure

```bash
git clone https://github.com/narenderreddy80/rihal-trading-advisor.git
cd rihal-trading-advisor
cp .env.example .env
# Edit .env with your credentials
```

### 2. Run with Docker

```bash
docker-compose up --build
```

Dashboard: http://localhost:5173  
API docs: http://localhost:8000/docs

### 3. Run locally (development)

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Configuration

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `RH_EMAIL` | Robinhood account email |
| `RH_PASSWORD` | Robinhood password |
| `RH_MFA_SECRET` | Base32 TOTP secret (optional, for auto-MFA) |
| `ANTHROPIC_API_KEY` | Get from [console.anthropic.com](https://console.anthropic.com) |
| `TELEGRAM_TOKEN` | Create a bot via @BotFather |
| `TELEGRAM_CHAT_ID` | Your Telegram chat ID |
| `GMAIL_USER` | Gmail address for digest emails |
| `GMAIL_APP_PASS` | 16-char Gmail App Password |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/account` | Robinhood account summary |
| GET | `/api/portfolio` | Open positions with P&L |
| GET | `/api/watchlist` | Watchlist symbols |
| GET | `/api/signals` | All cached signals |
| GET | `/api/signals/{symbol}` | Fresh signal for one symbol |
| POST | `/api/scan` | Trigger full watchlist scan |
| GET | `/api/chart/{symbol}` | OHLCV price data |
| GET | `/api/news/{symbol}` | Recent headlines + sentiment |

## Disclaimer

> This application is for educational and informational purposes only. It is **not financial advice**. Trading stocks and options involves significant risk. Always do your own research before making any investment decisions.

## License

MIT
