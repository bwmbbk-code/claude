---
description: 아침 브리핑 — 미읽음 메일 Top, 오늘 일정, 뉴스 3건, 환율·관심 종목·코인 시세를 한 장으로 요약
---

# 아침 브리핑

오늘 업무를 시작하기 전에 확인할 정보를 5개 섹션으로 정리해 주세요.

## 사전 조건

1. `config.local.md`를 읽어 사용자 프로필·관심 종목·관심 코인·관심 통화쌍을 확보합니다. 파일이 없으면 "먼저 `config.example.md`를 `config.local.md`로 복사해 채워 주세요"라고 알리고 중단합니다.

## 수행 단계 (가능한 한 병렬로 tool_use)

1. **메일**: Gmail `search_threads`에 `is:unread newer_than:1d` 쿼리로 최근 24시간 미읽음 스레드 상위 10개를 가져와, 중요 발신자 화이트리스트와 대조해 Top 5를 선정합니다.
2. **일정**: Calendar `list_events`로 오늘(사용자 타임존 기준) 이벤트 목록을 가져옵니다.
3. **뉴스**: ItNewsSearch `News_Article`로 최신 뉴스 3건을 조회합니다.
4. **환율**: Eodi `get_exchange_rates`로 `config.local.md`의 관심 통화쌍 환율을 조회합니다.
5. **시세**: Crypto.com `get_ticker`로 관심 코인들을, UsStockInfo `get_stock_info`로 관심 종목 상위 3개 현재가를 조회합니다.

## 출력 포맷

```markdown
# 아침 브리핑 (YYYY-MM-DD)

## 📧 중요 메일 Top 5
| 발신자 | 제목 | 시각 |
|---|---|---|
...

## 📅 오늘 일정
- HH:MM–HH:MM 이벤트명 (장소)
...
> 빈 집중 시간 추천: HH:MM–HH:MM (N분)

## 📰 뉴스 3건
1. [제목](링크) — 한 줄 요약
...

## 💱 환율
- USD/KRW: 1,xxx (전일 대비 ±x.xx%)
...

## 📈 시장
- BTC_USDT: $xx,xxx (±x.x%)
- AAPL: $xxx (±x.x%)
...
```

도구 호출 실패 시 해당 섹션만 "❌ 조회 실패: (이유)"로 표시하고 나머지는 그대로 출력합니다.
