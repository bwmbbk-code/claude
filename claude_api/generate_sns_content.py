import os
import json
import re
from pathlib import Path
from dotenv import load_dotenv
import anthropic

load_dotenv()

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

PROMPT_PATH = Path(__file__).parent.parent / "04_prompts" / "sns_content_prompt.md"
REVIEWS_PATH = Path(__file__).parent / "sample_reviews.json"
OUTPUT_PATH = Path(__file__).parent / "sns_outputs.json"

system_prompt = PROMPT_PATH.read_text(encoding="utf-8")
reviews = json.loads(REVIEWS_PATH.read_text(encoding="utf-8"))

STAR_ICONS = {1: "⭐", 2: "⭐⭐", 3: "⭐⭐⭐", 4: "⭐⭐⭐⭐", 5: "⭐⭐⭐⭐⭐"}

def to_initials(full_name: str) -> str:
    parts = full_name.strip().split()
    return ".".join(p[0].upper() for p in parts) + "."

def build_user_message(review: dict) -> str:
    initials = to_initials(review["reviewer_name"])
    return (
        f"Reviewer initials: {initials}\n"
        f"Star rating: {review['star_rating']}/5\n"
        f"Review text: {review['review_text']}\n\n"
        "Generate SNS content for all four platforms as specified. Return pure JSON only."
    )

def extract_json(raw: str) -> dict:
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON found in response:\n{raw}")
    return json.loads(match.group())

eligible = [r for r in reviews if r["star_rating"] >= 4]
all_outputs = []

print("=" * 62)
print("  Olympia Smoke Shop — SNS Content Generator")
print(f"  {len(eligible)} reviews eligible (4★ and above)")
print("=" * 62)

for i, review in enumerate(eligible, 1):
    initials = to_initials(review["reviewer_name"])
    stars = STAR_ICONS[review["star_rating"]]
    rating_label = f"{review['star_rating']}성"

    print(f"\n=== 리뷰 {i} ({rating_label} - {review['reviewer_name']}) ===")
    print(f"원본 리뷰: \"{review['review_text']}\"")

    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=800,
        system=system_prompt,
        messages=[{"role": "user", "content": build_user_message(review)}],
    )

    raw = message.content[0].text.strip()
    sns = extract_json(raw)

    hashtags_str = " ".join(sns["instagram_hashtags"])

    print(f"\n[Instagram]")
    print(f"캡션: {sns['instagram_caption']}")
    print(f"해시태그: {hashtags_str}")

    print(f"\n[Twitter/X]")
    print(sns["twitter_post"])
    print(f"({len(sns['twitter_post'])}자)")

    print(f"\n[Facebook]")
    print(sns["facebook_post"])

    print(f"\n[이미지 카드 문구]")
    print(f"\"{sns['image_card_text']}\"")

    print("─" * 62)

    all_outputs.append({
        "review_id": review["review_id"],
        "star_rating": review["star_rating"],
        "reviewer_initials": initials,
        "sns_content": sns,
    })

OUTPUT_PATH.write_text(json.dumps(all_outputs, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"\n✅ sns_outputs.json 저장 완료 ({len(all_outputs)}건)")
print("=" * 62)
