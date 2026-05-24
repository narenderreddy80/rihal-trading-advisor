from data.news import get_news, get_sentiment_score


def get_sentiment_signal(symbol: str) -> dict:
    articles = get_news(symbol, limit=10)
    score = get_sentiment_score(symbol)

    positive = sum(1 for a in articles if a["sentiment_label"] == "positive")
    negative = sum(1 for a in articles if a["sentiment_label"] == "negative")
    neutral = sum(1 for a in articles if a["sentiment_label"] == "neutral")

    if score > 0.1:
        signal = "bullish"
    elif score < -0.1:
        signal = "bearish"
    else:
        signal = "neutral"

    return {
        "symbol": symbol,
        "sentiment_score": score,
        "signal": signal,
        "article_count": len(articles),
        "positive": positive,
        "negative": negative,
        "neutral": neutral,
        "headlines": [a["title"] for a in articles[:5]],
    }
