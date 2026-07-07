import os
from groq import Groq
from dotenv import load_dotenv
load_dotenv()


GROQ_API_KEYS = [
    os.getenv("GROQ_API_KEY_1", ""),
    os.getenv("GROQ_API_KEY_2", ""),
    os.getenv("GROQ_API_KEY_3", ""),
    os.getenv("GROQ_API_KEY_4", ""),
]

# Remove empty keys
GROQ_API_KEYS = [k for k in GROQ_API_KEYS if k]

_current_index = 0


def get_groq_response(messages: list, model: str = "llama-3.3-70b-versatile") -> str:
    global _current_index

    if not GROQ_API_KEYS:
        user_message = messages[-1]["content"] if messages else ""
        return f"[Demo Mode - Groq API Key not set in .env]\n\nBased on your query '**{user_message}**', here is my analysis:\n- **Savings & Budgeting**: Maintain a savings rate above 20% by adhering to your category limits.\n- **Investment Projections**: Equity SIPs historically return 12-15% p.a. over long tenures (10+ years).\n- **Commodities**: Track active Gold/Silver signals on the Market page.\n\nPlease configure your `GROQ_API_KEY_1` in the backend `.env` file to enable live Groq/Llama-3.3 intelligence."

    for attempt in range(len(GROQ_API_KEYS)):
        key = GROQ_API_KEYS[_current_index % len(GROQ_API_KEYS)]
        try:
            client = Groq(api_key=key)
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=1024,
            )
            return response.choices[0].message.content

        except Exception as e:
            error_msg = str(e).lower()
            if "rate_limit" in error_msg or "429" in error_msg:
                # Rate limited — try next key
                _current_index += 1
                continue
            else:
                raise e

    raise Exception("All Groq API keys exhausted or rate limited. Try again later.")