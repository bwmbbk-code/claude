import os
import sys
from dotenv import load_dotenv
from notion_client import Client
from notion_client.errors import APIResponseError, HTTPResponseError

load_dotenv()

api_key = os.environ.get("NOTION_API_KEY")
database_id = os.environ.get("NOTION_DATABASE_ID")

if not api_key:
    print("❌ 오류: .env에 NOTION_API_KEY가 없습니다.")
    sys.exit(1)
if not database_id:
    print("❌ 오류: .env에 NOTION_DATABASE_ID가 없습니다.")
    sys.exit(1)

notion = Client(auth=api_key)

try:
    db = notion.databases.retrieve(database_id=database_id)

    title_parts = db.get("title", [])
    db_title = "".join(p.get("plain_text", "") for p in title_parts) or "(제목 없음)"

    print("=" * 50)
    print("✅ Notion 연결 성공!")
    print("=" * 50)
    print(f"📂 데이터베이스 제목: {db_title}")
    print(f"🆔 ID: {db['id']}")
    print(f"🔗 URL: {db.get('url', '-')}")
    print()
    print("📋 속성(컬럼) 목록:")
    print(f"  {'이름':<30} {'타입'}")
    print(f"  {'-'*30} {'-'*20}")
    for name, prop in db["properties"].items():
        print(f"  {name:<30} {prop['type']}")

    print("=" * 50)

except (HTTPResponseError, APIResponseError) as e:
    status = getattr(e, "status", "?")
    print(f"❌ Notion API 오류 (HTTP {status})")
    if status == 401:
        print("   → API 키가 유효하지 않습니다.")
    elif status == 403:
        print("   → Integration에 이 데이터베이스 접근 권한이 없습니다.")
        print("   → 데이터베이스 페이지 → ⋯ → Connections → Integration 추가 필요.")
    elif status == 404:
        print("   → 데이터베이스 ID가 틀리거나 Integration 권한이 없습니다.")
    sys.exit(1)
except Exception as e:
    print(f"❌ 예상치 못한 오류: {type(e).__name__}: {e}")
    sys.exit(1)
