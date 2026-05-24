import feedparser
from textblob import TextBlob


_RSS_TEMPLATE = "https://feeds.finance.yahoo.com/rss/2.0/headline?s={symbol}&region=US&lang=en-US"


def get_news(symbol: str, limit: int = 10) -> list[dict]:
    try:
        feed = feedparser.parse(_RSS_TEMPLATE.format(symbol=symbol))
        articles = []
        for entry in feed.entries[:limit]:
            title = entry.get("title", "")
            blob = TextBlob(title)
            sentiment = blob.sentiment.polarity  # -1 to +1
            articles.append({
                "title": title,
                "link": entry.get("link", ""),
                "published": entry.get("published", ""),
                "sentiment": round(sentiment, 3),
                "sentiment_label": (
                    "positive" if sentiment > 0.05
                    else "negative" if sentiment < -0.05
                    else "neutral"
                ),
            })
        return articles
    except Exception:
        return []


def get_sentiment_score(symbol: str) -> float:
    articles = get_news(symbol, limit=10)
    if not articles:
        return 0.0
    return round(sum(a["sentiment"] for a in articles) / len(articles), 3)
