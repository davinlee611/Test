"use strict";

/* ========================================
   DATE UTILITIES
======================================== */

export function getTodayDate() {
  const today = new Date();

  return today.toISOString().split("T")[0];
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
  return (
    "$" +
    getWholeNumber(value).toLocaleString("en-SG", {
      maximumFractionDigits: 0,
    })
  );
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
   ID UTILITIES
======================================== */

export function createUniqueId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return Date.now().toString(36) + Math.random().toString(36).slice(2);
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
