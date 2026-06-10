# HSA 영수증 관리 앱

HSA(Health Savings Account) 적격 의료비 영수증을 기록하고 상환(reimbursement) 상태를 추적하는 **순수 브라우저 앱**입니다. 서버·빌드 도구 없이 `index.html`을 브라우저로 열기만 하면 됩니다.

## 실행

```bash
# 방법 1: 파일을 직접 열기
open apps/hsa-receipts/index.html        # macOS
xdg-open apps/hsa-receipts/index.html    # Linux

# 방법 2: 간단한 로컬 서버 (PDF 미리보기 등에 더 안정적)
python3 -m http.server 8080 --directory apps/hsa-receipts
# → http://localhost:8080
```

## 기능

| 기능 | 설명 |
|---|---|
| 영수증 기록 | 날짜·금액(USD)·병원/약국·카테고리·대상자·메모 입력 |
| 첨부 보관 | 영수증 사진(이미지) 또는 PDF를 함께 저장, 클릭해서 보기 |
| 적격 여부 표시 | IRS qualified medical expense 여부를 영수증별로 표시 |
| 상환 상태 추적 | 미청구 → 청구됨 → 상환완료 3단계 상태 관리 |
| 요약 대시보드 | 적격 지출 누계, **미상환 금액(지금 청구 가능한 금액)**, 올해 지출, 건수 |
| 필터·정렬·검색 | 연도/카테고리/상태 필터 + 텍스트 검색 + 컬럼 정렬 |
| CSV 내보내기 | 현재 필터 기준으로 Excel 호환(UTF-8 BOM) CSV 다운로드 |
| 백업/복원 | 첨부 이미지 포함 전체 데이터를 JSON 한 파일로 백업·복원 |

## 데이터 저장 위치

모든 데이터(영수증 + 첨부 파일)는 **브라우저 IndexedDB**에만 저장됩니다. 외부 서버로 전송되지 않습니다.

⚠️ 브라우저 데이터를 삭제하면 기록도 사라지므로, **「백업」 버튼으로 주기적으로 JSON 파일을 내려받아 보관하세요.** HSA 영수증은 IRS 감사 대비로 계좌를 유지하는 동안 장기 보관하는 것이 안전합니다 (HSA는 지출 후 수년이 지나도 소급 상환 청구가 가능하므로, 미상환 영수증을 모아두는 "shoebox 전략"에도 유용합니다).

## 구조

```
apps/hsa-receipts/
├── index.html   # 마크업 (요약 카드, 필터 툴바, 테이블, 모달)
├── styles.css   # 스타일
└── app.js       # IndexedDB 저장소 + 렌더링 + CSV/백업 로직
```
