import json
import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

_client = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client


def get_recommendation(
    symbol: str,
    tech: dict,
    sentiment: dict,
    options: list[dict],
    fundamentals: dict,
) -> dict:
    headlines = "\n".join(f"  - {h}" for h in sentiment.get("headlines", [])[:5])
    top_options = options[:3]

    prompt = f"""You are a professional stock market advisor. Analyze the data below and return a structured trade recommendation.

## Stock: {symbol}
**Current Price:** ${tech.get('price', 'N/A')}

### Technical Indicators
- RSI (14): {tech.get('rsi')} → {tech.get('rsi_signal')}
- MACD: {'Bullish crossover' if tech.get('macd_crossover') else 'Bullish' if tech.get('macd_bullish') else 'Bearish'}
- Bollinger Bands: {tech.get('bb_signal')} (position: {tech.get('bb_pct')} of band)
- MA50: {tech.get('ma50')}, MA200: {tech.get('ma200')}
- Golden Cross: {tech.get('golden_cross')}
- Volume Ratio vs avg: {tech.get('volume_ratio')}x
- Composite Score: {tech.get('score')} (scale -1 bearish to +1 bullish)

### News Sentiment
- Overall: {sentiment.get('signal')} (score: {sentiment.get('sentiment_score')})
- Headlines ({sentiment.get('article_count')} articles):
{headlines or '  No recent headlines'}

### Top Options Signals
{json.dumps(top_options, indent=2) if top_options else '  No options data'}

### Fundamentals
- P/E Ratio: {fundamentals.get('pe_ratio', 'N/A')}
- Market Cap: {fundamentals.get('market_cap', 'N/A')}
- 52w High: {fundamentals.get('52w_high', 'N/A')}, Low: {fundamentals.get('52w_low', 'N/A')}
- Sector: {fundamentals.get('sector', 'N/A')}

---
Respond ONLY with valid JSON in this exact format:
{{
  "action": "BUY | SELL | HOLD | BUY CALL | BUY PUT | SELL CALL | SELL PUT",
  "confidence": "HIGH | MEDIUM | LOW",
  "reasoning": "2-3 sentences explaining the recommendation in plain English",
  "entry_price": <suggested entry price as number or null>,
  "target_price": <price target as number or null>,
  "stop_loss": <stop loss price as number or null>,
  "risk": "one sentence describing the key risk",
  "time_horizon": "intraday | swing (1-5 days) | short-term (1-4 weeks) | medium-term (1-3 months)"
}}"""

    try:
        client = _get_client()
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system="You are a quantitative trading advisor. Always respond with valid JSON only — no markdown, no explanation outside JSON.",
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        return {
            "action": "HOLD",
            "confidence": "LOW",
            "reasoning": "Unable to parse AI response. Review indicators manually.",
            "entry_price": None,
            "target_price": None,
            "stop_loss": None,
            "risk": "AI advisor temporarily unavailable",
            "time_horizon": "N/A",
        }
    except Exception as e:
        return {
            "action": "HOLD",
            "confidence": "LOW",
            "reasoning": f"AI advisor error: {str(e)}",
            "entry_price": None,
            "target_price": None,
            "stop_loss": None,
            "risk": "AI advisor error — check API key",
            "time_horizon": "N/A",
        }
