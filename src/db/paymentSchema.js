/**
 * paymentSchema.js
 * TimeCapsule PWA — IndexedDB 결제 레코드 스키마 정의 및 마이그레이션
 *
 * DB 이름  : timecapsule_db
 * Store    : payments
 * 현재 버전: 2  (v1 → v2 마이그레이션 포함)
 */

const DB_NAME = "timecapsule_db";
const DB_VERSION = 2;

/** @type {IDBDatabase | null} */
let _db = null;

/**
 * payments 오브젝트 스토어 스키마 (v2)
 *
 * @typedef {Object} PaymentRecord
 * @property {string}  id           - UUID (keyPath)
 * @property {string}  userId       - 사용자 ID (FK → users 테이블)
 * @property {number}  amount       - 결제 금액 (소수점 2자리, 예: 9900.00)
 * @property {string}  currency     - ISO 4217 통화 코드 (예: "KRW", "USD")
 * @property {string}  status       - "pending" | "completed" | "failed" | "refunded"
 * @property {string}  provider     - 결제 수단 (예: "toss", "stripe", "kakao")
 * @property {string}  providerTxId - 외부 결제 공급사 트랜잭션 ID
 * @property {string}  orderId      - 주문 ID (FK → orders 테이블)
 * @property {string}  description  - 결제 설명 (캡슐 제목 등)
 * @property {string}  createdAt    - ISO 8601 타임스탬프
 * @property {string}  updatedAt    - ISO 8601 타임스탬프
 * @property {boolean} synced       - Supabase 동기화 완료 여부 (오프라인 큐용)
 * @property {string|null} syncedAt - 마지막 동기화 타임스탬프
 */

/**
 * IndexedDB를 열고, 스키마 마이그레이션을 수행한 뒤 DB 인스턴스를 반환합니다.
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;

      // ── v1 최초 생성 ─────────────────────────────────────────────────────
      if (oldVersion < 1) {
        const store = db.createObjectStore("payments", { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }

      // ── v1 → v2 마이그레이션 ──────────────────────────────────────────────
      // 변경사항:
      //   - synced (boolean) 필드 추가 (기존 레코드 default: false)
      //   - syncedAt (string|null) 필드 추가 (기존 레코드 default: null)
      //   - providerTxId 인덱스 추가
      //   - currency 인덱스 추가
      if (oldVersion < 2) {
        const store = event.currentTarget.transaction.objectStore("payments");

        // 새 인덱스 추가 (중복 없음)
        if (!store.indexNames.contains("providerTxId")) {
          store.createIndex("providerTxId", "providerTxId", { unique: true });
        }
        if (!store.indexNames.contains("currency")) {
          store.createIndex("currency", "currency", { unique: false });
        }
        if (!store.indexNames.contains("synced")) {
          store.createIndex("synced", "synced", { unique: false });
        }

        // 기존 레코드에 새 필드 기본값 채우기
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = (e) => {
          const cursor = e.target.result;
          if (!cursor) return;

          const record = cursor.value;
          let updated = false;

          if (record.synced === undefined) {
            record.synced = false;
            updated = true;
          }
          if (record.syncedAt === undefined) {
            record.syncedAt = null;
            updated = true;
          }

          if (updated) cursor.update(record);
          cursor.continue();
        };
      }
    };

    request.onsuccess = (event) => {
      _db = event.target.result;
      resolve(_db);
    };

    request.onerror = (event) => {
      reject(new Error(`IndexedDB open failed: ${event.target.error}`));
    };
  });
}

/**
 * DB 연결을 명시적으로 닫습니다 (테스트 / 마이그레이션 후 정리용).
 */
export function closeDB() {
  if (_db) {
    _db.close();
    _db = null;
  }
}

// ── CRUD 헬퍼 ────────────────────────────────────────────────────────────────

/**
 * 결제 레코드를 저장(신규 추가 또는 덮어쓰기)합니다.
 * @param {PaymentRecord} record
 * @returns {Promise<string>} 저장된 레코드의 id
 */
export async function putPayment(record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("payments", "readwrite");
    const req = tx.objectStore("payments").put(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * id로 결제 레코드를 조회합니다.
 * @param {string} id
 * @returns {Promise<PaymentRecord | undefined>}
 */
export async function getPayment(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("payments", "readonly");
    const req = tx.objectStore("payments").get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * 동기화되지 않은 모든 결제 레코드를 반환합니다.
 * @returns {Promise<PaymentRecord[]>}
 */
export async function getUnsyncedPayments() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("payments", "readonly");
    const index = tx.objectStore("payments").index("synced");
    const req = index.getAll(IDBKeyRange.only(false));
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * 결제 레코드를 동기화 완료 상태로 업데이트합니다.
 * @param {string} id
 * @param {string} syncedAt - ISO 8601 타임스탬프
 * @returns {Promise<void>}
 */
export async function markPaymentSynced(id, syncedAt) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("payments", "readwrite");
    const store = tx.objectStore("payments");
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const record = getReq.result;
      if (!record) return reject(new Error(`Payment not found: ${id}`));

      record.synced = true;
      record.syncedAt = syncedAt;
      record.updatedAt = syncedAt;

      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}
