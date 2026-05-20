/**
 * @fileoverview TimeCapsule PWA – Payment Form UI Component
 *
 * Vanilla-JS web component that renders a glassmorphism payment form with:
 *   • Responsive layout for 375 px (mobile) and 768 px (tablet+) breakpoints
 *   • Touch targets ≥ 44 × 44 px on every interactive element
 *   • Glassmorphism CSS tokens (see src/styles/payment.css)
 *   • Full i18n support for ko / en / ja via src/i18n/payment.js
 *   • Attribute-driven configuration (locale, currency, amount)
 *   • Dispatches custom events: payment-submit, payment-cancel
 *
 * @example
 * ```html
 * <payment-form locale="ko" currency="KRW" amount="29000"></payment-form>
 * ```
 *
 * @module ui/PaymentForm
 */

import { t } from '../i18n/payment.js';

// ─────────────────────────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a raw digit string into "XXXX XXXX XXXX XXXX" notation.
 *
 * @param {string} value - Raw input value
 * @returns {string} Formatted card number (max 19 chars incl. spaces)
 */
function formatCardNumber(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

/**
 * Formats input into "MM / YY" expiry notation.
 *
 * @param {string} value - Raw input value
 * @returns {string} Formatted expiry string
 */
function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

/**
 * Validates a credit-card number via the Luhn algorithm.
 *
 * @param {string} value - Card number (spaces stripped internally)
 * @returns {boolean} True if the number passes the Luhn check
 */
function isValidLuhn(value) {
  const digits = value.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/**
 * Validates an expiry date string in "MM / YY" format.
 * Ensures the date is not in the past.
 *
 * @param {string} value - Formatted expiry string
 * @returns {boolean} True when valid and not expired
 */
function isValidExpiry(value) {
  const match = value.replace(/\s/g, '').match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = parseInt(match[1], 10);
  const year = 2000 + parseInt(match[2], 10);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const expiry = new Date(year, month - 1, 1);
  return expiry >= new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Validates a CVV code (3 or 4 digits).
 *
 * @param {string} value - CVV string
 * @returns {boolean} True for 3–4 digit strings
 */
function isValidCVV(value) {
  return /^\d{3,4}$/.test(value.trim());
}

/**
 * Validates a numeric amount greater than zero.
 *
 * @param {string} value - Amount string
 * @returns {boolean} True when value is a positive finite number
 */
function isValidAmount(value) {
  const n = parseFloat(value);
  return isFinite(n) && n > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shadow DOM template
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the inner HTML template for the payment form.
 *
 * @param {object} opts
 * @param {import('../i18n/payment.js').Locale} opts.locale - Active locale
 * @param {string} opts.amount - Pre-filled amount value
 * @param {string} opts.currency - Pre-selected ISO 4217 currency code
 * @returns {string} HTML string for the form
 */
function buildTemplate({ locale, amount, currency }) {
  const currencies = ['KRW', 'USD', 'JPY', 'EUR'];
  const currencyOptions = currencies
    .map((c) => `<option value="${c}"${c === currency ? ' selected' : ''}>${c}</option>`)
    .join('');

  return /* html */ `
    <link rel="stylesheet" href="./src/styles/payment.css" />

    <form class="payment-form" novalidate aria-label="${t('payment.title', locale)}">
      <!-- Header -->
      <header class="payment-form__header">
        <h2 class="payment-form__title">${t('payment.title', locale)}</h2>
        <p class="payment-form__subtitle">
          <svg class="payment-form__secure-icon" aria-hidden="true"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          ${t('payment.secure.badge', locale)}
        </p>
      </header>

      <!-- Card info fields -->
      <div class="payment-form__group">

        <!-- Card number -->
        <div class="payment-form__field">
          <label class="payment-form__label" for="pf-card-number">
            ${t('payment.cardNumber', locale)}
          </label>
          <input
            id="pf-card-number"
            class="payment-form__input"
            type="text"
            inputmode="numeric"
            autocomplete="cc-number"
            maxlength="19"
            placeholder="${t('payment.cardNumber.placeholder', locale)}"
            aria-required="true"
            aria-describedby="pf-card-number-error"
          />
          <span id="pf-card-number-error" class="payment-form__error" role="alert"></span>
        </div>

        <!-- Cardholder name -->
        <div class="payment-form__field">
          <label class="payment-form__label" for="pf-card-holder">
            ${t('payment.cardHolder', locale)}
          </label>
          <input
            id="pf-card-holder"
            class="payment-form__input"
            type="text"
            autocomplete="cc-name"
            placeholder="${t('payment.cardHolder.placeholder', locale)}"
            aria-required="true"
            aria-describedby="pf-card-holder-error"
          />
          <span id="pf-card-holder-error" class="payment-form__error" role="alert"></span>
        </div>

        <!-- Expiry + CVV row -->
        <div class="payment-form__row">
          <div class="payment-form__field">
            <label class="payment-form__label" for="pf-expiry">
              ${t('payment.expiry', locale)}
            </label>
            <input
              id="pf-expiry"
              class="payment-form__input"
              type="text"
              inputmode="numeric"
              autocomplete="cc-exp"
              maxlength="7"
              placeholder="${t('payment.expiry.placeholder', locale)}"
              aria-required="true"
              aria-describedby="pf-expiry-error"
            />
            <span id="pf-expiry-error" class="payment-form__error" role="alert"></span>
          </div>

          <div class="payment-form__field">
            <label class="payment-form__label" for="pf-cvv">
              ${t('payment.cvv', locale)}
            </label>
            <input
              id="pf-cvv"
              class="payment-form__input"
              type="text"
              inputmode="numeric"
              autocomplete="cc-csc"
              maxlength="4"
              placeholder="${t('payment.cvv.placeholder', locale)}"
              aria-required="true"
              aria-describedby="pf-cvv-error"
            />
            <span id="pf-cvv-error" class="payment-form__error" role="alert"></span>
          </div>
        </div>

        <!-- Amount + currency -->
        <div class="payment-form__field">
          <label class="payment-form__label" for="pf-amount">
            ${t('payment.amount', locale)}
          </label>
          <div class="payment-form__amount-row">
            <input
              id="pf-amount"
              class="payment-form__input"
              type="text"
              inputmode="decimal"
              placeholder="0"
              value="${amount}"
              aria-required="true"
              aria-describedby="pf-amount-error"
            />
            <select
              id="pf-currency"
              class="payment-form__currency-select"
              aria-label="${t('payment.currency', locale)}"
            >
              ${currencyOptions}
            </select>
          </div>
          <span id="pf-amount-error" class="payment-form__error" role="alert"></span>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="payment-form__actions">
        <button
          type="submit"
          class="payment-form__btn payment-form__btn--primary"
          data-action="submit"
        >
          ${t('payment.submit', locale)}
        </button>
        <button
          type="button"
          class="payment-form__btn payment-form__btn--secondary"
          data-action="cancel"
        >
          ${t('payment.cancel', locale)}
        </button>
      </div>

      <!-- Status banner -->
      <div id="pf-status" class="payment-form__status" role="status" aria-live="polite"></div>
    </form>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Element
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @class PaymentForm
 * @extends HTMLElement
 *
 * @description
 * `<payment-form>` is a self-contained web component that renders the full
 * TimeCapsule checkout UI. It encapsulates all styles via Shadow DOM and
 * communicates results via custom DOM events.
 *
 * @fires PaymentForm#payment-submit - When the form passes validation.
 *   `detail`: `{ cardNumber, cardHolder, expiry, cvv, amount, currency }`
 * @fires PaymentForm#payment-cancel - When the user taps the Cancel button.
 *
 * @attr {string} [locale='ko'] - Display locale: 'ko' | 'en' | 'ja'
 * @attr {string} [currency='KRW'] - Pre-selected ISO 4217 currency code
 * @attr {string} [amount=''] - Pre-filled payment amount
 */
class PaymentForm extends HTMLElement {
  /** @type {ShadowRoot} */
  #shadow;

  /** @type {boolean} */
  #processing = false;

  // ── Observed attributes ────────────────────────────────────────────────────
  static get observedAttributes() {
    return ['locale', 'currency', 'amount'];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /** Render and attach event listeners when added to the DOM. */
  connectedCallback() {
    this.#render();
    this.#attachListeners();
  }

  /**
   * Re-render when a watched attribute changes.
   *
   * @param {string} _name - Attribute name
   * @param {string|null} oldValue - Previous value
   * @param {string|null} newValue - New value
   */
  attributeChangedCallback(_name, oldValue, newValue) {
    if (oldValue !== newValue && this.isConnected) {
      this.#render();
      this.#attachListeners();
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Programmatically sets the processing state of the submit button.
   * Call with `true` while an async payment request is in-flight,
   * `false` on completion/error.
   *
   * @param {boolean} isProcessing
   */
  setProcessing(isProcessing) {
    this.#processing = isProcessing;
    const btn = this.#shadow.querySelector('[data-action="submit"]');
    if (!btn) return;
    const locale = /** @type {import('../i18n/payment.js').Locale} */ (
      this.getAttribute('locale') ?? 'ko'
    );
    btn.disabled = isProcessing;
    btn.innerHTML = isProcessing
      ? `<span class="payment-form__spinner" aria-hidden="true"></span>${t('payment.processing', locale)}`
      : t('payment.submit', locale);
  }

  /**
   * Displays a status message banner (success or failure).
   *
   * @param {'success'|'failure'} type - Banner variant
   * @param {string} [message] - Override text (falls back to i18n default)
   */
  showStatus(type, message) {
    const el = this.#shadow.getElementById('pf-status');
    if (!el) return;
    const locale = /** @type {import('../i18n/payment.js').Locale} */ (
      this.getAttribute('locale') ?? 'ko'
    );
    el.textContent = message ?? t(`payment.${type}`, locale);
    el.className = `payment-form__status payment-form__status--${type} payment-form__status--visible`;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Resolves current attribute values with their defaults.
   *
   * @returns {{ locale: import('../i18n/payment.js').Locale, currency: string, amount: string }}
   */
  #getConfig() {
    return {
      locale: /** @type {import('../i18n/payment.js').Locale} */ (
        this.getAttribute('locale') ?? 'ko'
      ),
      currency: this.getAttribute('currency') ?? 'KRW',
      amount: this.getAttribute('amount') ?? '',
    };
  }

  /** Renders the template into the shadow root. */
  #render() {
    this.#shadow.innerHTML = buildTemplate(this.#getConfig());
  }

  /** Wires up all interactive event listeners inside the shadow root. */
  #attachListeners() {
    const root = this.#shadow;

    // ── Input formatters ─────────────────────────────────────────────────────
    root.getElementById('pf-card-number')?.addEventListener('input', (e) => {
      const input = /** @type {HTMLInputElement} */ (e.target);
      const cursor = input.selectionStart;
      input.value = formatCardNumber(input.value);
      // Restore cursor position roughly (spaces shift positions by 1 each group)
      try { input.setSelectionRange(cursor, cursor); } catch (_) { /* noop */ }
    });

    root.getElementById('pf-expiry')?.addEventListener('input', (e) => {
      const input = /** @type {HTMLInputElement} */ (e.target);
      input.value = formatExpiry(input.value);
    });

    root.getElementById('pf-cvv')?.addEventListener('input', (e) => {
      const input = /** @type {HTMLInputElement} */ (e.target);
      input.value = input.value.replace(/\D/g, '').slice(0, 4);
    });

    root.getElementById('pf-amount')?.addEventListener('input', (e) => {
      const input = /** @type {HTMLInputElement} */ (e.target);
      // Allow digits and a single decimal point
      input.value = input.value.replace(/[^\d.]/g, '').replace(/(\.\d{2})\d+$/, '$1');
    });

    // ── Inline validation on blur ────────────────────────────────────────────
    const { locale } = this.#getConfig();

    /**
     * Sets or clears the validation error for a field.
     *
     * @param {string} fieldId - Input element id
     * @param {string} errorId - Error span element id
     * @param {string} errorKey - i18n key for the error message (empty = valid)
     */
    const setError = (fieldId, errorId, errorKey) => {
      const input = root.getElementById(fieldId);
      const err = root.getElementById(errorId);
      if (!input || !err) return;
      const msg = errorKey ? t(errorKey, locale) : '';
      err.textContent = msg;
      input.classList.toggle('payment-form__input--error', Boolean(errorKey));
      input.setAttribute('aria-invalid', String(Boolean(errorKey)));
    };

    root.getElementById('pf-card-number')?.addEventListener('blur', () => {
      const v = /** @type {HTMLInputElement} */ (root.getElementById('pf-card-number')).value;
      if (!v) {
        setError('pf-card-number', 'pf-card-number-error', 'payment.error.cardNumber.required');
      } else if (!isValidLuhn(v)) {
        setError('pf-card-number', 'pf-card-number-error', 'payment.error.cardNumber.invalid');
      } else {
        setError('pf-card-number', 'pf-card-number-error', '');
      }
    });

    root.getElementById('pf-card-holder')?.addEventListener('blur', () => {
      const v = /** @type {HTMLInputElement} */ (root.getElementById('pf-card-holder')).value.trim();
      setError(
        'pf-card-holder',
        'pf-card-holder-error',
        v ? '' : 'payment.error.cardHolder.required',
      );
    });

    root.getElementById('pf-expiry')?.addEventListener('blur', () => {
      const v = /** @type {HTMLInputElement} */ (root.getElementById('pf-expiry')).value;
      if (!v) {
        setError('pf-expiry', 'pf-expiry-error', 'payment.error.expiry.required');
      } else if (!isValidExpiry(v)) {
        setError('pf-expiry', 'pf-expiry-error', 'payment.error.expiry.invalid');
      } else {
        setError('pf-expiry', 'pf-expiry-error', '');
      }
    });

    root.getElementById('pf-cvv')?.addEventListener('blur', () => {
      const v = /** @type {HTMLInputElement} */ (root.getElementById('pf-cvv')).value;
      if (!v) {
        setError('pf-cvv', 'pf-cvv-error', 'payment.error.cvv.required');
      } else if (!isValidCVV(v)) {
        setError('pf-cvv', 'pf-cvv-error', 'payment.error.cvv.invalid');
      } else {
        setError('pf-cvv', 'pf-cvv-error', '');
      }
    });

    root.getElementById('pf-amount')?.addEventListener('blur', () => {
      const v = /** @type {HTMLInputElement} */ (root.getElementById('pf-amount')).value;
      if (!v) {
        setError('pf-amount', 'pf-amount-error', 'payment.error.amount.required');
      } else if (!isValidAmount(v)) {
        setError('pf-amount', 'pf-amount-error', 'payment.error.amount.invalid');
      } else {
        setError('pf-amount', 'pf-amount-error', '');
      }
    });

    // ── Form submit ──────────────────────────────────────────────────────────
    root.querySelector('form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.#processing) return;

      const cardNumber = /** @type {HTMLInputElement} */ (root.getElementById('pf-card-number')).value;
      const cardHolder = /** @type {HTMLInputElement} */ (root.getElementById('pf-card-holder')).value.trim();
      const expiry = /** @type {HTMLInputElement} */ (root.getElementById('pf-expiry')).value;
      const cvv = /** @type {HTMLInputElement} */ (root.getElementById('pf-cvv')).value;
      const amount = /** @type {HTMLInputElement} */ (root.getElementById('pf-amount')).value;
      const currency = /** @type {HTMLSelectElement} */ (root.getElementById('pf-currency')).value;

      // Full validation before dispatch
      let valid = true;

      if (!cardNumber) {
        setError('pf-card-number', 'pf-card-number-error', 'payment.error.cardNumber.required');
        valid = false;
      } else if (!isValidLuhn(cardNumber)) {
        setError('pf-card-number', 'pf-card-number-error', 'payment.error.cardNumber.invalid');
        valid = false;
      }

      if (!cardHolder) {
        setError('pf-card-holder', 'pf-card-holder-error', 'payment.error.cardHolder.required');
        valid = false;
      }

      if (!expiry) {
        setError('pf-expiry', 'pf-expiry-error', 'payment.error.expiry.required');
        valid = false;
      } else if (!isValidExpiry(expiry)) {
        setError('pf-expiry', 'pf-expiry-error', 'payment.error.expiry.invalid');
        valid = false;
      }

      if (!cvv) {
        setError('pf-cvv', 'pf-cvv-error', 'payment.error.cvv.required');
        valid = false;
      } else if (!isValidCVV(cvv)) {
        setError('pf-cvv', 'pf-cvv-error', 'payment.error.cvv.invalid');
        valid = false;
      }

      if (!amount) {
        setError('pf-amount', 'pf-amount-error', 'payment.error.amount.required');
        valid = false;
      } else if (!isValidAmount(amount)) {
        setError('pf-amount', 'pf-amount-error', 'payment.error.amount.invalid');
        valid = false;
      }

      if (!valid) return;

      /**
       * @event PaymentForm#payment-submit
       * @type {CustomEvent}
       * @property {object} detail
       * @property {string} detail.cardNumber - Formatted card number (masked for logging)
       * @property {string} detail.cardHolder - Cardholder name
       * @property {string} detail.expiry - MM / YY expiry string
       * @property {string} detail.cvv - CVV (never log/store this value)
       * @property {string} detail.amount - Amount string
       * @property {string} detail.currency - ISO 4217 currency code
       */
      this.dispatchEvent(
        new CustomEvent('payment-submit', {
          bubbles: true,
          composed: true,
          detail: { cardNumber, cardHolder, expiry, cvv, amount, currency },
        }),
      );
    });

    // ── Cancel button ────────────────────────────────────────────────────────
    root.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
      /**
       * @event PaymentForm#payment-cancel
       * @type {CustomEvent}
       */
      this.dispatchEvent(new CustomEvent('payment-cancel', { bubbles: true, composed: true }));
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────────────────────────────────────

if (!customElements.get('payment-form')) {
  customElements.define('payment-form', PaymentForm);
}

export { PaymentForm };
