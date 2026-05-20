/**
 * @fileoverview i18n strings for the TimeCapsule payment module.
 * Keys are available in Korean (ko), English (en), and Japanese (ja).
 *
 * Usage:
 *   import { t } from '../i18n/payment.js';
 *   const label = t('payment.cardNumber', 'en');
 */

/** @type {Record<string, Record<string, string>>} */
export const messages = {
  ko: {
    // ── 섹션 제목 ──────────────────────────────────────────────────
    'payment.title': '결제 정보 입력',
    'payment.subtitle': '안전하게 암호화된 결제',

    // ── 카드 정보 ─────────────────────────────────────────────────
    'payment.cardNumber': '카드 번호',
    'payment.cardNumber.placeholder': '1234 5678 9012 3456',
    'payment.cardHolder': '카드 소유자 이름',
    'payment.cardHolder.placeholder': '홍길동',
    'payment.expiry': '유효기간',
    'payment.expiry.placeholder': 'MM / YY',
    'payment.cvv': 'CVV',
    'payment.cvv.placeholder': '123',

    // ── 금액 ──────────────────────────────────────────────────────
    'payment.amount': '결제 금액',
    'payment.currency': '통화',

    // ── 버튼 ──────────────────────────────────────────────────────
    'payment.submit': '결제하기',
    'payment.cancel': '취소',
    'payment.processing': '처리 중…',

    // ── 검증 메시지 ────────────────────────────────────────────────
    'payment.error.cardNumber.required': '카드 번호를 입력해 주세요.',
    'payment.error.cardNumber.invalid': '유효하지 않은 카드 번호입니다.',
    'payment.error.cardHolder.required': '카드 소유자 이름을 입력해 주세요.',
    'payment.error.expiry.required': '유효기간을 입력해 주세요.',
    'payment.error.expiry.invalid': '올바른 유효기간(MM/YY)을 입력해 주세요.',
    'payment.error.cvv.required': 'CVV를 입력해 주세요.',
    'payment.error.cvv.invalid': 'CVV는 3~4자리 숫자입니다.',
    'payment.error.amount.required': '결제 금액을 입력해 주세요.',
    'payment.error.amount.invalid': '올바른 금액을 입력해 주세요.',

    // ── 상태 메시지 ────────────────────────────────────────────────
    'payment.success': '결제가 완료되었습니다.',
    'payment.failure': '결제에 실패했습니다. 다시 시도해 주세요.',
    'payment.secure.badge': 'SSL 암호화 보호',
  },

  en: {
    // ── Section titles ─────────────────────────────────────────────
    'payment.title': 'Payment Details',
    'payment.subtitle': 'Securely encrypted checkout',

    // ── Card info ──────────────────────────────────────────────────
    'payment.cardNumber': 'Card Number',
    'payment.cardNumber.placeholder': '1234 5678 9012 3456',
    'payment.cardHolder': 'Cardholder Name',
    'payment.cardHolder.placeholder': 'Jane Doe',
    'payment.expiry': 'Expiry Date',
    'payment.expiry.placeholder': 'MM / YY',
    'payment.cvv': 'CVV',
    'payment.cvv.placeholder': '123',

    // ── Amount ─────────────────────────────────────────────────────
    'payment.amount': 'Amount',
    'payment.currency': 'Currency',

    // ── Buttons ────────────────────────────────────────────────────
    'payment.submit': 'Pay Now',
    'payment.cancel': 'Cancel',
    'payment.processing': 'Processing…',

    // ── Validation messages ────────────────────────────────────────
    'payment.error.cardNumber.required': 'Card number is required.',
    'payment.error.cardNumber.invalid': 'Invalid card number.',
    'payment.error.cardHolder.required': 'Cardholder name is required.',
    'payment.error.expiry.required': 'Expiry date is required.',
    'payment.error.expiry.invalid': 'Enter a valid expiry date (MM/YY).',
    'payment.error.cvv.required': 'CVV is required.',
    'payment.error.cvv.invalid': 'CVV must be 3–4 digits.',
    'payment.error.amount.required': 'Amount is required.',
    'payment.error.amount.invalid': 'Enter a valid amount.',

    // ── Status ─────────────────────────────────────────────────────
    'payment.success': 'Payment successful.',
    'payment.failure': 'Payment failed. Please try again.',
    'payment.secure.badge': 'SSL Encrypted',
  },

  ja: {
    // ── セクションタイトル ──────────────────────────────────────────
    'payment.title': '支払い情報の入力',
    'payment.subtitle': '安全に暗号化された決済',

    // ── カード情報 ─────────────────────────────────────────────────
    'payment.cardNumber': 'カード番号',
    'payment.cardNumber.placeholder': '1234 5678 9012 3456',
    'payment.cardHolder': 'カード名義人',
    'payment.cardHolder.placeholder': '山田 太郎',
    'payment.expiry': '有効期限',
    'payment.expiry.placeholder': 'MM / YY',
    'payment.cvv': 'CVV',
    'payment.cvv.placeholder': '123',

    // ── 金額 ───────────────────────────────────────────────────────
    'payment.amount': '支払い金額',
    'payment.currency': '通貨',

    // ── ボタン ─────────────────────────────────────────────────────
    'payment.submit': '支払う',
    'payment.cancel': 'キャンセル',
    'payment.processing': '処理中…',

    // ── バリデーションメッセージ ────────────────────────────────────
    'payment.error.cardNumber.required': 'カード番号を入力してください。',
    'payment.error.cardNumber.invalid': '有効なカード番号ではありません。',
    'payment.error.cardHolder.required': 'カード名義人を入力してください。',
    'payment.error.expiry.required': '有効期限を入力してください。',
    'payment.error.expiry.invalid': '有効な有効期限（MM/YY）を入力してください。',
    'payment.error.cvv.required': 'CVVを入力してください。',
    'payment.error.cvv.invalid': 'CVVは3〜4桁の数字です。',
    'payment.error.amount.required': '支払い金額を入力してください。',
    'payment.error.amount.invalid': '有効な金額を入力してください。',

    // ── ステータス ─────────────────────────────────────────────────
    'payment.success': 'お支払いが完了しました。',
    'payment.failure': 'お支払いに失敗しました。もう一度お試しください。',
    'payment.secure.badge': 'SSL暗号化保護',
  },
};

/**
 * Supported locale codes for the payment module.
 * @typedef {'ko' | 'en' | 'ja'} Locale
 */

/**
 * Resolves a translation string for the given key and locale.
 * Falls back to English, then returns the raw key if no match is found.
 *
 * @param {string} key - i18n message key (e.g. 'payment.submit')
 * @param {Locale} [locale='ko'] - Target locale
 * @returns {string} Translated string
 */
export function t(key, locale = 'ko') {
  return messages[locale]?.[key] ?? messages.en?.[key] ?? key;
}
