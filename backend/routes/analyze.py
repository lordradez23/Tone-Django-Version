from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from google import genai
import os, json, re

analyze_bp = Blueprint("analyze", __name__)

FALLBACK_KEYWORDS = {
    "toxic": ["hate", "stupid", "idiot", "dumb", "ugly", "loser", "kill", "die", "shut up", "worthless"],
    "warning": ["annoying", "weird", "boring", "lame", "whatever", "don't care"],
}

def fallback_analysis(text: str) -> dict:
    lower = text.lower()
    if any(k in lower for k in FALLBACK_KEYWORDS["toxic"]):
        label, conf = "toxic", 0.8
    elif any(k in lower for k in FALLBACK_KEYWORDS["warning"]):
        label, conf = "warning", 0.6
    else:
        label, conf = "safe", 0.3
    return {
        "toxicity": {"label": label, "confidence": conf},
        "sentiment": {"label": "neutral", "confidence": 0.5},
        "feedback": "✓ Your message looks great!" if label == "safe" else "💡 Consider rephrasing for a kinder tone",
        "shouldWarn": label != "safe",
        "alternatives": [],
    }

@analyze_bp.post("/analyze")
@jwt_required()
def analyze():
    text = (request.json or {}).get("message", "").strip()
    if not text:
        return jsonify({
            "toxicity": {"label": "safe", "confidence": 0.2},
            "sentiment": {"label": "neutral", "confidence": 0.5},
            "feedback": "✓ Start typing to see live analysis",
            "shouldWarn": False,
            "alternatives": [],
        })

    api_key = os.getenv("AI_API_KEY")
    if not api_key:
        return jsonify(fallback_analysis(text))

    try:
        client = genai.Client(api_key=api_key)
        prompt = f"""You are a message tone analyzer. Analyze the message and respond with valid JSON only.

Response format:
{{"toxicity": {{"label": "safe"|"warning"|"toxic", "confidence": 0.0-1.0}}, "sentiment": {{"label": "positive"|"neutral"|"negative", "confidence": 0.0-1.0}}, "feedback": "Brief supportive feedback", "shouldWarn": true|false, "alternatives": [{{"text": "...", "reason": "..."}}]}}

Guidelines:
- "safe" = friendly or neutral tone
- "warning" = slightly dismissive or passive-aggressive  
- "toxic" = aggressive, insulting, or hurtful
- Only provide alternatives if "warning" or "toxic"

Message: "{text}"
"""
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        raw = response.text.strip()
        raw = re.sub(r"^```(?:json)?", "", raw).rstrip("`").strip()
        result = json.loads(raw)

        if result.get("alternatives") and len(result["alternatives"]) > 0:
            result["rephrase"] = {
                "suggestion": result["alternatives"][0]["text"],
                "reason": result["alternatives"][0]["reason"],
            }
        return jsonify(result)
    except Exception as e:
        print(f"AI analysis error: {e}")
        return jsonify(fallback_analysis(text))
