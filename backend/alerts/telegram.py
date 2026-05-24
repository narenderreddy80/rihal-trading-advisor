import os
import requests
from dotenv import load_dotenv

load_dotenv()

ACTION_EMOJI = {
    "BUY": "🟢",
    "SELL": "🔴",
    "HOLD": "🟡",
    "BUY CALL": "📈",
    "BUY PUT": "📉",
    "SELL CALL": "🔻",
    "SELL PUT": "🔺",
}


def send_signal(signal: dict) -> bool:
    token = os.getenv("TELEGRAM_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        return False

    ai = signal.get("ai", {})
    tech = signal.get("tech", {})
    action = ai.get("action", "HOLD")
    emoji = ACTION_EMOJI.get(action, "⚪")
    confidence = ai.get("confidence", "LOW")
    conf_star = {"HIGH": "⭐⭐⭐", "MEDIUM": "⭐⭐", "LOW": "⭐"}.get(confidence, "⭐")

    lines = [
        f"{emoji} *{action}: {signal['symbol']}*",
        f"Price: *${tech.get('price', 'N/A')}*  |  Confidence: {conf_star}",
        f"",
        f"📊 *Indicators*",
        f"RSI: `{tech.get('rsi')}` ({tech.get('rsi_signal')})  |  BB: `{tech.get('bb_signal')}`",
        f"MACD: {'🔼 Bullish' if tech.get('macd_bullish') else '🔽 Bearish'}  |  Vol: `{tech.get('volume_ratio')}x`",
        f"",
        f"🤖 *AI Reasoning*",
        f"_{ai.get('reasoning', 'N/A')}_",
        f"",
    ]
    if ai.get("entry_price"):
        lines.append(f"Entry: `${ai['entry_price']}` | Target: `${ai.get('target_price', 'N/A')}` | Stop: `${ai.get('stop_loss', 'N/A')}`")
    lines.append(f"⚠️ Risk: _{ai.get('risk', 'N/A')}_")
    lines.append(f"⏱ Horizon: {ai.get('time_horizon', 'N/A')}")

    text = "\n".join(lines)
    try:
        resp = requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text, "parse_mode": "Markdown"},
            timeout=10,
        )
        return resp.status_code == 200
    except Exception:
        return False


def send_message(text: str) -> bool:
    token = os.getenv("TELEGRAM_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        return False
    try:
        resp = requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text, "parse_mode": "Markdown"},
            timeout=10,
        )
        return resp.status_code == 200
    except Exception:
        return False
