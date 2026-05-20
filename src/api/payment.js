/**
 * payment.js
 * TimeCapsule PWA — 결제 API Layer (메인 진입점)
 *
 * 역할:
 *   1. 결제 공급사(Toss Payments / Stripe) API 호출 추상화
 *   2. IndexedDB 로컬 퍼시스턴스 (오프라인 우선)
 *   3. Supabase 동기화 (온라인 복귀 시 자동 flush)
 *
 * 환경 변수 (.env → import.meta.env):
 *   VITE_TOSS_CLIENT_KEY   - Toss Payments 클라이언트 키 (ck_test_... / ck_live_...)
 *   VITE_STRIPE_PUBLIC_KEY - Stripe publishable key (pk_test_... / pk_live_...)
 *   VITE_SUPABASE_URL      - Supabase 프로젝트 URL
 *   VITE_SUPABASE_ANON_KEY - Supabase anon key
 *   VITE_API_BASE_URL      - TimeCapsule 백엔드 API base URL
 *
 * !! API key를 이 파일에 하드코딩하지 마세요 !!
 */

import { v4 as uuidv4 } from "uuid";
import { putPayment, getPayment } from "../db/paymentSchema.js";
import {
  flushPendingPayments,
  registerOnlineSync,
  unregisterOnlineSync,
} from "../sync/paymentSync.js";

// ── 초기화 ───────────────────────────────────────────────────────────────────

/**
 * 결제 모듈을 초기화합니다. 앱 부트스트랩 시 한 번만 호출하세요.
 * - 온라인 복귀 이벤트 핸들러 등록
 * - 앱 시작 시 미동기화 큐 flush 시도
 */
export function initPaymentModule() {
  _assertEnvVars();
  registerOnlineSync();

  // 앱 시작 시 이미 온라인이면 즉시 flush
  if (navigator.onLine) {
    flushPendingPayments().catch((err) =>
      console.warn("[payment] 초기 flush 실패:", err.message)
    );
  }
}

/**
 * 결제 모듈을 정리합니다. (SPA 언마운트 / 테스트 후 정리용)
 */
export function teardownPaymentModule() {
  unregisterOnlineSync();
}

// ── 결제 요청 ────────────────────────────────────────────────────────────────

/**
 * 새 결제를 요청합니다.
 *
 * 흐름:
 *   1. 로컬 IndexedDB에 pending 레코드 생성 (오프라인 안전)
 *   2. 결제 공급사 SDK 호출
 *   3. 백엔드 검증 API 호출
 *   4. 성공 시 status = "completed", synced = false 로 업데이트
 *   5. 온라인이면 즉시 Supabase 동기화
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {number} params.amount        - 결제 금액 (원 단위, 예: 9900)
 * @param {string} params.currency      - ISO 4217 코드 (예: "KRW")
 * @param {string} params.orderId       - 주문 ID
 * @param {string} params.description   - 결제 설명
 * @param {"toss"|"stripe"} params.provider - 결제 수단
 * @returns {Promise<{ success: boolean; paymentId: string; providerTxId?: string; error?: string }>}
 */
export async function requestPayment({
  userId,
  amount,
  currency = "KRW",
  orderId,
  description,
  provider = "toss",
}) {
  const paymentId = uuidv4();
  const now = new Date().toISOString();

  // 1. 로컬에 pending 레코드 생성
  const record = {
    id: paymentId,
    userId,
    amount,
    currency,
    status: "pending",
    provider,
    providerTxId: null,
    orderId,
    description,
    createdAt: now,
    updatedAt: now,
    synced: false,
    syncedAt: null,
  };

  await putPayment(record);

  try {
    // 2. 결제 공급사 SDK 호출
    const providerTxId = await _callProviderSDK({ provider, amount, currency, orderId, description });

    // 3. 백엔드 검증
    await _verifyWithBackend({ paymentId, providerTxId, provider, orderId, amount });

    // 4. 성공 업데이트
    const updatedRecord = {
      ...record,
      status: "completed",
      providerTxId,
      updatedAt: new Date().toISOString(),
      synced: false,
    };
    await putPayment(updatedRecord);

    // 5. 온라인이면 즉시 동기화
    if (navigator.onLine) {
      flushPendingPayments().catch(console.warn);
    }

    return { success: true, paymentId, providerTxId };
  } catch (err) {
    // 실패 레코드 저장 (감사 로그 목적)
    await putPayment({
      ...record,
      status: "failed",
      updatedAt: new Date().toISOString(),
    });

    return { success: false, paymentId, error: err.message };
  }
}

/**
 * 결제를 환불합니다.
 *
 * @param {object} params
 * @param {string} params.paymentId    - 환불할 결제 ID
 * @param {number} [params.amount]     - 부분 환불 금액 (없으면 전액 환불)
 * @param {string} params.reason       - 환불 사유
 * @returns {Promise<{ success: boolean; error?: string }>}
 */
export async function refundPayment({ paymentId, amount, reason }) {
  const record = await getPayment(paymentId);
  if (!record) {
    return { success: false, error: `결제 레코드를 찾을 수 없습니다: ${paymentId}` };
  }
  if (record.status !== "completed") {
    return { success: false, error: `환불 가능한 상태가 아닙니다: ${record.status}` };
  }

  try {
    const refundAmount = amount ?? record.amount;
    await _callRefundAPI({ provider: record.provider, providerTxId: record.providerTxId, amount: refundAmount, reason });

    const updatedRecord = {
      ...record,
      status: "refunded",
      updatedAt: new Date().toISOString(),
      synced: false,
    };
    await putPayment(updatedRecord);

    if (navigator.onLine) {
      flushPendingPayments().catch(console.warn);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * 결제 내역을 조회합니다 (IndexedDB 로컬 캐시 기반).
 *
 * @param {string} paymentId
 * @returns {Promise<import("../db/paymentSchema.js").PaymentRecord | undefined>}
 */
export async function getPaymentRecord(paymentId) {
  return getPayment(paymentId);
}

// ── 내부 헬퍼 ────────────────────────────────────────────────────────────────

/**
 * 필수 환경 변수 존재 여부를 확인합니다.
 * 누락 시 명확한 오류 메시지를 던져 하드코딩 유혹을 차단합니다.
 */
function _assertEnvVars() {
  const required = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "VITE_API_BASE_URL",
  ];

  const missing = required.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `[payment] 필수 환경 변수가 설정되지 않았습니다: ${missing.join(", ")}\n` +
        ".env 파일을 생성하고 값을 채워 주세요. (.env.example 참고)"
    );
  }
}

/**
 * 결제 공급사 SDK를 호출하고 providerTxId를 반환합니다.
 * @param {{ provider: string; amount: number; currency: string; orderId: string; description: string }} params
 * @returns {Promise<string>} providerTxId
 */
async function _callProviderSDK({ provider, amount, currency, orderId, description }) {
  if (provider === "toss") {
    const tossClientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
    if (!tossClientKey) {
      throw new Error("VITE_TOSS_CLIENT_KEY 환경 변수가 설정되지 않았습니다.");
    }

    // Toss Payments SDK는 전역 로드(loadTossPayments) 방식을 사용합니다.
    // 실제 구현에서는 @tosspayments/payment-widget-sdk 를 import 해서 사용하세요.
    const tossPayments = window.__tossPaymentsSDK ?? (await _loadTossSDK(tossClientKey));
    const result = await tossPayments.requestPayment("카드", {
      amount,
      orderId,
      orderName: description,
      currency,
      successUrl: `${import.meta.env.VITE_API_BASE_URL}/payments/toss/success`,
      failUrl: `${import.meta.env.VITE_API_BASE_URL}/payments/toss/fail`,
    });

    return result.paymentKey;
  }

  if (provider === "stripe") {
    const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!stripePublicKey) {
      throw new Error("VITE_STRIPE_PUBLIC_KEY 환경 변수가 설정되지 않았습니다.");
    }

    // Stripe는 loadStripe(@stripe/stripe-js)를 통해 사용합니다.
    const { loadStripe } = await import("@stripe/stripe-js");
    const stripe = await loadStripe(stripePublicKey);

    // PaymentIntent client_secret은 백엔드에서 발급받아야 합니다.
    const { clientSecret } = await _fetchClientSecret({ amount, currency, orderId });
    const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret);

    if (error) throw new Error(error.message);
    return paymentIntent.id;
  }

  throw new Error(`지원하지 않는 결제 공급사: ${provider}`);
}

/**
 * 백엔드 결제 검증 API를 호출합니다.
 * @param {{ paymentId: string; providerTxId: string; provider: string; orderId: string; amount: number }} params
 */
async function _verifyWithBackend({ paymentId, providerTxId, provider, orderId, amount }) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(`${baseUrl}/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId, providerTxId, provider, orderId, amount }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `결제 검증 실패 (HTTP ${res.status})`);
  }
}

/**
 * 환불 API를 호출합니다.
 * @param {{ provider: string; providerTxId: string; amount: number; reason: string }} params
 */
async function _callRefundAPI({ provider, providerTxId, amount, reason }) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(`${baseUrl}/payments/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, providerTxId, amount, reason }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `환불 요청 실패 (HTTP ${res.status})`);
  }
}

/**
 * Stripe용 PaymentIntent client_secret을 백엔드에서 발급받습니다.
 * @param {{ amount: number; currency: string; orderId: string }} params
 * @returns {Promise<{ clientSecret: string }>}
 */
async function _fetchClientSecret({ amount, currency, orderId }) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(`${baseUrl}/payments/stripe/intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency, orderId }),
  });

  if (!res.ok) {
    throw new Error(`PaymentIntent 발급 실패 (HTTP ${res.status})`);
  }

  return res.json();
}

/**
 * Toss Payments SDK를 동적으로 로드합니다 (CDN 폴백).
 * 가능하면 npm 패키지 @tosspayments/payment-widget-sdk 를 사용하세요.
 * @param {string} clientKey
 */
async function _loadTossSDK(clientKey) {
  // npm 패키지가 있으면 해당 방식을 사용합니다.
  // import { loadTossPayments } from "@tosspayments/payment-widget-sdk";
  // return loadTossPayments(clientKey);
  throw new Error(
    "Toss Payments SDK가 로드되지 않았습니다. " +
      "@tosspayments/payment-widget-sdk 를 설치하고 initPaymentModule() 전에 로드하세요."
  );
}
