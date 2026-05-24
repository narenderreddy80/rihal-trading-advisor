import pandas as pd
import numpy as np


def compute_signals(symbol: str, ohlcv: list[dict]) -> dict:
    if len(ohlcv) < 30:
        return {"symbol": symbol, "error": "insufficient data"}

    df = pd.DataFrame(ohlcv)
    closes = df["close"].astype(float)
    volumes = df["volume"].astype(float)

    # --- RSI (14) ---
    delta = closes.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rs = gain / loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    rsi_val = round(float(rsi.iloc[-1]), 2)

    # --- MACD (12/26/9) ---
    ema12 = closes.ewm(span=12, adjust=False).mean()
    ema26 = closes.ewm(span=26, adjust=False).mean()
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    histogram = macd_line - signal_line
    macd_bullish = bool(macd_line.iloc[-1] > signal_line.iloc[-1])
    macd_crossover = bool(
        macd_line.iloc[-1] > signal_line.iloc[-1]
        and macd_line.iloc[-2] <= signal_line.iloc[-2]
    )

    # --- Bollinger Bands (20, 2σ) ---
    sma20 = closes.rolling(20).mean()
    std20 = closes.rolling(20).std()
    upper_band = sma20 + 2 * std20
    lower_band = sma20 - 2 * std20
    current = float(closes.iloc[-1])
    bb_signal = (
        "oversold" if current < float(lower_band.iloc[-1])
        else "overbought" if current > float(upper_band.iloc[-1])
        else "neutral"
    )
    bb_pct = round(
        (current - float(lower_band.iloc[-1]))
        / (float(upper_band.iloc[-1]) - float(lower_band.iloc[-1]) + 1e-9),
        3,
    )

    # --- Moving Averages ---
    ma50 = float(closes.rolling(50).mean().iloc[-1]) if len(closes) >= 50 else None
    ma200 = float(closes.rolling(200).mean().iloc[-1]) if len(closes) >= 200 else None
    golden_cross = bool(ma50 and ma200 and ma50 > ma200)

    # --- Volume spike ---
    avg_vol = float(volumes.rolling(20).mean().iloc[-1]) if len(volumes) >= 20 else 1
    vol_ratio = round(float(volumes.iloc[-1]) / (avg_vol or 1), 2)

    # --- Composite signal score (-1 to +1) ---
    score = 0.0
    score += 0.3 if rsi_val < 30 else (-0.3 if rsi_val > 70 else 0)
    score += 0.25 if macd_bullish else -0.25
    score += 0.2 if bb_signal == "oversold" else (-0.2 if bb_signal == "overbought" else 0)
    score += 0.15 if golden_cross else 0
    score += 0.1 if vol_ratio > 1.5 else 0
    score = round(max(-1.0, min(1.0, score)), 3)

    return {
        "symbol": symbol,
        "price": current,
        "rsi": rsi_val,
        "rsi_signal": "oversold" if rsi_val < 30 else "overbought" if rsi_val > 70 else "neutral",
        "macd_bullish": macd_bullish,
        "macd_crossover": macd_crossover,
        "macd_value": round(float(macd_line.iloc[-1]), 4),
        "macd_signal": round(float(signal_line.iloc[-1]), 4),
        "bb_signal": bb_signal,
        "bb_pct": bb_pct,
        "bb_upper": round(float(upper_band.iloc[-1]), 2),
        "bb_lower": round(float(lower_band.iloc[-1]), 2),
        "ma50": round(ma50, 2) if ma50 else None,
        "ma200": round(ma200, 2) if ma200 else None,
        "golden_cross": golden_cross,
        "volume_ratio": vol_ratio,
        "score": score,
    }
