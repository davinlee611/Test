"use strict";

import { formatCurrency } from "../../utils/client-utils.js";

/* ========================================
   FORMATTERS
======================================== */

export function setCurrency(element, value) {
  setText(element, formatCurrency(value));
}

export function setSignedCurrency(element, value) {
  const prefix = value < 0 ? "-" : "";

  setText(element, `${prefix}${formatCurrency(Math.abs(value))}`);

  element?.classList.toggle("is-negative", value < 0);
  element?.classList.toggle("is-positive", value > 0);
}

export function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

export function setHidden(element, hidden) {
  if (element) {
    element.hidden = hidden;
  }
}

export function formatRate(value) {
  const safeRate = getNonNegativeNumber(value);

  return `${safeRate.toFixed(1)}% p.a.`;
}

export function getFiniteNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

export function getNonNegativeNumber(value) {
  return Math.max(0, getFiniteNumber(value));
}
