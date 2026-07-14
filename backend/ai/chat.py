"""
TradeFlo AI Coach — Conversational Engine
Rule-based response system + Gemini API for nuanced counseling.
"""
from typing import List, Optional, Dict
import re
from datetime import datetime


# ─── Intent Classification ─────────────────────────────────────────────────────

INTENT_PATTERNS = {
    "win_rate": [r"win rate", r"winning", r"how many wins", r"win %"],
    "drawdown": [r"drawdown", r"loss limit", r"max loss", r"down"],
    "risk": [r"risk", r"position size", r"lot size", r"how much to risk"],
    "review": [r"review", r"analyse", r"analyze", r"how did i do", r"performance", r"report"],
    "strategy": [r"strategy", r"setup", r"entry", r"what should i trade", r"edge"],
    "psychology": [r"emotion", r"fear", r"greed", r"discipline", r"revenge", r"tilt", r"frustrated"],
    "motivation": [r"motivat", r"discourag", r"giving up", r"quit", r"hard", r"struggling"],
    "kelly": [r"kelly", r"position sizing", r"optimal size"],
    "greeting": [r"^hi$", r"^hello$", r"^hey", r"good morning", r"good evening"],
}


def classify_intent(message: str) -> str:
    """Return the primary intent category of a user message."""
    lower = message.lower().strip()
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, lower):
                return intent
    return "general"


# ─── Rule-Based Responses ──────────────────────────────────────────────────────

def rule_based_response(intent: str, context: Optional[Dict] = None) -> Optional[str]:
    """
    Return a canned rule-based response for high-confidence intents.
    Returns None to fall through to Gemini if no good rule matches.
    """
    ctx = context or {}
    stats = ctx.get("stats", {})
    alerts = ctx.get("alerts", [])
    account = ctx.get("account", {})

    if intent == "greeting":
        name = account.get("name", "Trader")
        wr = stats.get("win_rate", 0)
        pnl = stats.get("total_pnl", 0)
        return (
            f"Hey {name}! 👋 Ready to trade with discipline?\n\n"
            f"Quick snapshot: **{wr*100:.1f}% win rate** | "
            f"**{'+' if pnl >= 0 else ''}{pnl:.2f} total P&L**\n\n"
            f"What can I help you with today? You can ask me about your performance, "
            f"risk management, or just talk through a tough trading day."
        )

    if intent == "win_rate" and stats:
        wr = stats.get("win_rate", 0)
        ev = stats.get("expected_value", 0)
        pf = stats.get("profit_factor", 0)
        msg = f"Your current win rate is **{wr*100:.1f}%**.\n\n"
        if wr >= 0.60:
            msg += "That's solid! With a positive EV and good discipline, you're building an edge. "
        elif wr >= 0.45:
            msg += "That's respectable — remember, even 45% wins can be highly profitable with good R:R. "
        else:
            msg += "Below 50% — this isn't necessarily bad, but you need a strong R:R to compensate. "
        msg += f"\n\n📊 Profit Factor: **{pf:.2f}** | Expected Value per trade: **{ev:.2f}**"
        return msg

    if intent == "risk":
        max_dd = account.get("max_drawdown_pct", 5)
        rpt = account.get("risk_per_trade_pct", 1)
        balance = account.get("current_balance", 0)
        risk_amount = balance * (rpt / 100)
        return (
            f"Based on your account settings:\n\n"
            f"- **Risk per trade:** {rpt}% = **{risk_amount:.2f} {account.get('currency', 'USD')}**\n"
            f"- **Max drawdown limit:** {max_dd}%\n"
            f"- **Daily loss limit:** {account.get('max_daily_loss_pct', 2)}%\n\n"
            f"Use the position calculator on the Journal page to get exact lot sizes based on your stop-loss distance.\n\n"
            f"💡 *Tip: Never risk more than 1-2% per trade. Consistency beats aggression.*"
        )

    if intent == "psychology":
        return (
            "Trading psychology is where most traders lose their edge. Here's what I know about you:\n\n"
            "**The 3 most common traps:**\n"
            "1. **Revenge trading** — Entering immediately after a loss with bigger size. Your journal data shows patterns here.\n"
            "2. **FOMO entries** — Taking trades outside your setup criteria because 'the move is happening now'.\n"
            "3. **Moving stops** — Letting losses run beyond your planned SL.\n\n"
            "🧘 After any loss, wait 15 minutes before the next entry. Review your rules. Ask: *'Is this my setup?'*\n\n"
            "Want me to pull up your specific psychological patterns from your trade history?"
        )

    if intent == "motivation":
        return (
            "Struggling days are part of every trader's journey — even the best funds have losing months.\n\n"
            "What separates professionals from amateurs isn't the absence of losses — it's how they **respond** to them.\n\n"
            "Here's what to do right now:\n"
            "1. **Close the charts** for the rest of today if you're in a loss streak\n"
            "2. **Review your last 10 trades** in the journal — look for the pattern\n"
            "3. **Write down one thing** you'll improve tomorrow\n\n"
            "Your edge only works over a large sample. One bad day doesn't erase your system. 💪"
        )

    if intent == "review" and stats:
        wr = stats.get("win_rate", 0)
        pf = stats.get("profit_factor", 0)
        ev = stats.get("expected_value", 0)
        dd = stats.get("max_drawdown_pct", 0)
        total = stats.get("total_pnl", 0)
        n = stats.get("total_trades", 0)
        return (
            f"## Your Performance Review\n\n"
            f"| Metric | Value |\n"
            f"|--------|-------|\n"
            f"| Total Trades | {n} |\n"
            f"| Win Rate | {wr*100:.1f}% |\n"
            f"| Profit Factor | {pf:.2f} |\n"
            f"| Expected Value | {ev:.2f} per trade |\n"
            f"| Max Drawdown | {dd:.1f}% |\n"
            f"| Total P&L | {'+' if total >= 0 else ''}{total:.2f} |\n\n"
            f"{'✅ Positive EV — you have a statistical edge.' if ev > 0 else '❌ Negative EV — your current approach needs refinement.'}\n"
            f"{'✅ Profit factor above 1.5 — healthy.' if pf >= 1.5 else '⚠️ Profit factor below 1.5 — focus on cutting losses shorter.'}"
        )

    return None  # Fall through to Gemini


# ─── Gemini Integration ────────────────────────────────────────────────────────

async def gemini_response(
    message: str,
    conversation_history: List[dict],
    context: Optional[dict] = None,
    api_key: Optional[str] = None,
) -> str:
    """
    Call Gemini API for nuanced conversational responses.
    Falls back to a helpful default if no API key is set.
    """
    if not api_key:
        return (
            "I'm your TradeFlo AI Coach! To unlock full conversational AI, "
            "add your GEMINI_API_KEY to the backend .env file.\n\n"
            "For now, try asking me specific questions like:\n"
            "- 'What's my win rate?'\n"
            "- 'How should I manage my risk?'\n"
            "- 'Review my performance'\n"
            "- 'I'm feeling frustrated after my losses today'"
        )

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)

        ctx = context or {}
        stats = ctx.get("stats", {})
        account = ctx.get("account", {})
        insights = ctx.get("insights", [])

        system_prompt = f"""You are FloAI, the AI trading coach inside TradeFlo — a premium trading operating system.
You are speaking with a trader named {account.get('name', 'Trader')}.

Your personality:
- Direct, confident, and data-driven — like a professional trading mentor
- Empathetic but firm on risk management rules
- Never give specific financial advice, but provide educational guidance
- Use their actual data to personalise responses

Current trader stats:
- Win Rate: {stats.get('win_rate', 0)*100:.1f}%
- Profit Factor: {stats.get('profit_factor', 0):.2f}
- Total Trades: {stats.get('total_trades', 0)}
- Expected Value: {stats.get('expected_value', 0):.2f} per trade
- Max Drawdown: {stats.get('max_drawdown_pct', 0):.1f}%
- Total P&L: {stats.get('total_pnl', 0):.2f}

Key insights from their journal:
{chr(10).join([f"- {i['insight']}" for i in insights[:3]]) if insights else "- Not enough data yet"}

Rules: Keep responses concise (under 200 words). Use markdown formatting. Be their coach, not their friend."""

        model = genai.GenerativeModel("gemini-2.0-flash")

        history = []
        for msg in conversation_history[-6:]:  # Last 3 exchanges
            role = "user" if msg["role"] == "user" else "model"
            history.append({"role": role, "parts": [msg["content"]]})

        chat = model.start_chat(history=history)
        response = chat.send_message(f"{system_prompt}\n\nUser: {message}")
        return response.text

    except Exception as e:
        return f"I encountered an issue connecting to the AI service. Error: {str(e)}\n\nPlease check your GEMINI_API_KEY in the backend .env file."


async def get_chat_response(
    message: str,
    conversation_history: List[dict],
    context: Optional[dict] = None,
    api_key: Optional[str] = None,
) -> str:
    """
    Main chat entry point.
    1. Classify intent
    2. Try rule-based response
    3. Fall through to Gemini if no rule matches
    """
    intent = classify_intent(message)
    rule_resp = rule_based_response(intent, context)
    if rule_resp:
        return rule_resp
    return await gemini_response(message, conversation_history, context, api_key)
