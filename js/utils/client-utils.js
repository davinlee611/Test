"use strict";

/* ========================================
   DATE UTILITIES
======================================== */

export function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* ========================================
   NUMBER UTILITIES
======================================== */

export function getWholeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return Math.trunc(number);
}

export function getInputWholeNumber(inputElement) {
  if (!inputElement) {
    return 0;
  }

  return getWholeNumber(inputElement.value);
}

/* ========================================
   FORMATTERS
======================================== */

export function formatCurrency(value) {
  const number = Number(value);

  const safeValue = Number.isFinite(number) ? number : 0;

  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(safeValue);
}

export function formatDeduction(value) {
  const amount = Math.round(Number(value) || 0);

  if (amount === 0) {
    return "$0";
  }

  return "-" + formatCurrency(amount);
}

export function formatPercentage(decimalRate) {
  const percentage = Number(decimalRate || 0) * 100;

  return (
    percentage.toLocaleString("en-SG", {
      maximumFractionDigits: 1,
    }) + "%"
  );
}

/* ========================================
   VALIDATION UTILITIES
======================================== */

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ========================================
   PLANNER ID UTILITIES
======================================== */

export function createPlannerId() {
  if (
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}

/* ========================================
   HTML UTILITIES
======================================== */

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
