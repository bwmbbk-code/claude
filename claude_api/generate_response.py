import os
import json
from pathlib import Path
from dotenv import load_dotenv
import anthropic

load_dotenv()

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

PROMPT_PATH = Path(__file__).parent.parent / "04_prompts" / "review_response_prompt.md"
REVIEWS_PATH = Path(__file__).parent / "sample_reviews.json"

system_prompt = PROMPT_PATH.read_text(encoding="utf-8")
reviews = json.loads(REVIEWS_PATH.read_text(encoding="utf-8"))

STAR_ICONS = {1: "⭐", 2: "⭐⭐", 3: "⭐⭐⭐", 4: "⭐⭐⭐⭐", 5: "⭐⭐⭐⭐⭐"}

def build_user_message(review: dict) -> str:
    rating = review["star_rating"]
    if rating >= 5:
        tone_hint = "Write a 5-star response: specific gratitude and re-visit invitation."
    elif rating >= 3:
        tone_hint = "Write a 3-4 star response: thank them, acknowledge the gap, show improvement commitment."
    else:
        tone_hint = "Write a 1-2 star response: lead with empathy, take ownership, provide contact info placeholder, invite resolution."

    return (
        f"Reviewer: {review['reviewer_name']}\n"
        f"Star rating: {rating}/5\n"
        f"Review: {review['review_text']}\n\n"
        f"Task: {tone_hint}"
    )

print("=" * 60)
print("  Olympia Smoke Shop — Review Response Generator")
print("=" * 60)

for review in reviews:
    stars = STAR_ICONS.get(review["star_rating"], "")
    print(f"\n{'─' * 60}")
    print(f"[{review['review_id']}] {stars}  {review['reviewer_name']}  ({review['review_date']})")
    print(f"REVIEW: {review['review_text']}")
    print()

    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=300,
        system=system_prompt,
        messages=[{"role": "user", "content": build_user_message(review)}],
    )

    reply = message.content[0].text.strip()
    print(f"RESPONSE DRAFT:\n{reply}")

print(f"\n{'=' * 60}")
print(f"  Done — {len(reviews)} responses generated.")
print("=" * 60)
