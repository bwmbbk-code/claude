/**
 * paymentSync.js
 * TimeCapsule PWA — Supabase 결제 동기화 로직 (online ↔ offline)
 *
 * 전략:
 *   - Online  → Supabase upsert 후 IndexedDB synced = true 마킹
 *   - Offline → IndexedDB에 synced = false 로 큐잉, 온라인 복귀 시 flush
 *   - 충돌    → last-write-wins (updatedAt 기준)
 *
 * 환경 변수 (import.meta.env):
 *   VITE_SUPABASE_URL      - Supabase 프로젝트 URL
 *   VITE_SUPABASE_ANON_KEY - Supabase anon/public key
 */

import { createClient } from "@supabase/supabase-js";
import {
  getUnsyncedPayments,
  markPaymentSynced,
  putPayment,
  openDB,
} from "../db/paymentSchema.js";

// ── Supabase 클라이언트 (지연 초기화) ────────────────────────────────────────

let _supabase = null;

/**
 * Supabase 클라이언트 싱글톤을 반환합니다.
 * API key는 반드시 import.meta.env에서 읽어야 합니다.
 * @returns {import("@supabase/supabase-js").SupabaseClient}
 */
function getSupabaseClient() {
  if (_supabase) return _supabase;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "[paymentSync] VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY 환경 변수가 설정되지 않았습니다. " +
        ".env 파일을 확인하세요."
    );
  }

  _supabase = createClient(url, key);
  return _supabase;
}

// ── 동기화 상태 ───────────────────────────────────────────────────────────────

/** @type {"idle" | "syncing" | "error"} */
let _syncState = "idle";
let _lastSyncError = null;

export function getSyncState() {
  return { state: _syncState, lastError: _lastSyncError };
}

// ── 핵심 동기화 함수 ─────────────────────────────────────────────────────────

/**
 * 네트워크가 온라인 상태일 때 미동기화 결제 레코드를 Supabase에 업로드합니다.
 *
 * @returns {Promise<{ flushed: number; errors: string[] }>}
 */
export async function flushPendingPayments() {
  if (!navigator.onLine) {
    console.info("[paymentSync] 오프라인 상태 — flush 건너뜀");
    return { flushed: 0, errors: [] };
  }

  _syncState = "syncing";
  _lastSyncError = null;

  const pending = await getUnsyncedPayments();
  if (pending.length === 0) {
    _syncState = "idle";
    return { flushed: 0, errors: [] };
  }

  const supabase = getSupabaseClient();
  const errors = [];
  let flushed = 0;

  for (const record of pending) {
    try {
      // last-write-wins: updatedAt 기준으로 서버 레코드와 충돌 해결
      const { data: existing } = await supabase
        .from("payments")
        .select("id, updated_at")
        .eq("id", record.id)
        .maybeSingle();

      // 서버 레코드가 더 최신이면 로컬 레코드를 서버 값으로 업데이트
      if (existing && existing.updated_at > record.updatedAt) {
        const { data: serverRecord } = await supabase
          .from("payments")
          .select("*")
          .eq("id", record.id)
          .single();

        if (serverRecord) {
          await putPayment(dbRowToRecord(serverRecord));
          await markPaymentSynced(record.id, new Date().toISOString());
          flushed++;
          continue;
        }
      }

      // 로컬 레코드를 서버에 upsert
      const { error } = await supabase
        .from("payments")
        .upsert(recordToDbRow(record), { onConflict: "id" });

      if (error) {
        errors.push(`[${record.id}] ${error.message}`);
        continue;
      }

      const syncedAt = new Date().toISOString();
      await markPaymentSynced(record.id, syncedAt);
      flushed++;
    } catch (err) {
      errors.push(`[${record.id}] ${err.message}`);
    }
  }

  _syncState = errors.length > 0 ? "error" : "idle";
  _lastSyncError = errors.length > 0 ? errors.join("; ") : null;

  if (errors.length > 0) {
    console.warn("[paymentSync] 일부 레코드 동기화 실패:", errors);
  } else {
    console.info(`[paymentSync] ${flushed}건 동기화 완료`);
  }

  return { flushed, errors };
}

/**
 * Supabase에서 특정 userId의 결제 내역을 가져와 IndexedDB에 저장합니다.
 * 앱 초기 로드 시 또는 pull-to-refresh 시 사용합니다.
 *
 * @param {string} userId
 * @returns {Promise<number>} 동기화된 레코드 수
 */
export async function pullPaymentsFromServer(userId) {
  if (!navigator.onLine) {
    console.info("[paymentSync] 오프라인 상태 — pull 건너뜀");
    return 0;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`[paymentSync] pull 실패: ${error.message}`);
  }

  const records = (data ?? []).map(dbRowToRecord);
  await Promise.all(records.map((r) => putPayment({ ...r, synced: true, syncedAt: new Date().toISOString() })));

  return records.length;
}

// ── 온라인 이벤트 핸들러 ─────────────────────────────────────────────────────

let _onlineHandler = null;

/**
 * window "online" 이벤트에 flush 핸들러를 등록합니다.
 * 앱 마운트 시 한 번만 호출하세요.
 */
export function registerOnlineSync() {
  if (_onlineHandler) return; // 중복 등록 방지

  _onlineHandler = () => {
    console.info("[paymentSync] 네트워크 복귀 — 오프라인 큐 flush 시작");
    flushPendingPayments().catch(console.error);
  };

  window.addEventListener("online", _onlineHandler);
}

/**
 * 등록된 "online" 이벤트 핸들러를 해제합니다.
 * 컴포넌트 언마운트 시 호출하세요.
 */
export function unregisterOnlineSync() {
  if (_onlineHandler) {
    window.removeEventListener("online", _onlineHandler);
    _onlineHandler = null;
  }
}

// ── 타입 변환 헬퍼 ───────────────────────────────────────────────────────────

/**
 * IndexedDB PaymentRecord → Supabase DB row (snake_case)
 * @param {import("../db/paymentSchema.js").PaymentRecord} record
 */
function recordToDbRow(record) {
  return {
    id: record.id,
    user_id: record.userId,
    amount: record.amount,
    currency: record.currency,
    status: record.status,
    provider: record.provider,
    provider_tx_id: record.providerTxId,
    order_id: record.orderId,
    description: record.description,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

/**
 * Supabase DB row → IndexedDB PaymentRecord (camelCase)
 * @param {Object} row
 * @returns {import("../db/paymentSchema.js").PaymentRecord}
 */
function dbRowToRecord(row) {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    provider: row.provider,
    providerTxId: row.provider_tx_id,
    orderId: row.order_id,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    synced: true,
    syncedAt: null,
  };
}
