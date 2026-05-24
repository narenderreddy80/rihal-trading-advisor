import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import date
from dotenv import load_dotenv

load_dotenv()


def send_daily_digest(signals: list[dict]) -> bool:
    gmail_user = os.getenv("GMAIL_USER")
    gmail_pass = os.getenv("GMAIL_APP_PASS")
    if not gmail_user or not gmail_pass:
        return False

    today = date.today().strftime("%B %d, %Y")
    subject = f"Rihal Trading Advisor — Daily Digest {today}"

    html = _build_html(signals, today)
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = gmail_user
    msg["To"] = gmail_user
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(gmail_user, gmail_pass)
            server.send_message(msg)
        return True
    except Exception:
        return False


def _build_html(signals: list[dict], today: str) -> str:
    ACTION_COLOR = {
        "BUY": "#16a34a", "SELL": "#dc2626", "HOLD": "#ca8a04",
        "BUY CALL": "#2563eb", "BUY PUT": "#7c3aed",
        "SELL CALL": "#ea580c", "SELL PUT": "#db2777",
    }

    rows = ""
    for s in signals:
        ai = s.get("ai", {})
        tech = s.get("tech", {})
        action = ai.get("action", "HOLD")
        color = ACTION_COLOR.get(action, "#6b7280")
        rows += f"""
        <tr>
          <td style="padding:8px;font-weight:bold">{s.get('symbol')}</td>
          <td style="padding:8px">${tech.get('price', 'N/A')}</td>
          <td style="padding:8px;color:{color};font-weight:bold">{action}</td>
          <td style="padding:8px">{ai.get('confidence','N/A')}</td>
          <td style="padding:8px">{tech.get('rsi','N/A')} ({tech.get('rsi_signal','N/A')})</td>
          <td style="padding:8px">{tech.get('bb_signal','N/A')}</td>
          <td style="padding:8px;font-size:12px;color:#6b7280">{ai.get('reasoning','N/A')}</td>
        </tr>"""

    return f"""
    <html><body style="font-family:Arial,sans-serif;max-width:900px;margin:auto">
      <h2 style="color:#1e3a5f">📊 Rihal Trading Advisor — {today}</h2>
      <p style="color:#6b7280">Pre-market signal digest based on technical indicators, options flow, news sentiment, and AI analysis.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <thead>
          <tr style="background:#f3f4f6;text-align:left">
            <th style="padding:8px">Symbol</th>
            <th style="padding:8px">Price</th>
            <th style="padding:8px">Action</th>
            <th style="padding:8px">Confidence</th>
            <th style="padding:8px">RSI</th>
            <th style="padding:8px">Bollinger</th>
            <th style="padding:8px">AI Reasoning</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      <p style="margin-top:24px;font-size:11px;color:#9ca3af">
        ⚠️ This is not financial advice. Always do your own research before trading.
        These signals are generated automatically and may contain errors.
      </p>
    </body></html>"""
