"use strict";

import { getProtection } from "../state/client-plan.js";

import { formatCurrency } from "../utils/client-utils.js";

import {
  PROTECTION_HORIZON_YEARS,
  PROTECTION_HORIZON_MONTHS,
  FUTURE_SELF_GROWTH_RATE_PERCENT,
  getSelectableExpenseItems,
  getSelectableLiabilities,
  getSelectedExpenseMonthlyTotal,
  getSelectedLiabilityMonthlyTotal,
  getFutureSelfDisplayedAmount,
} from "./protection-analysis.js";

import { calculateExistingCriticalIllnessCoverage } from "../services/protection-coverage-calculator.js";

import { on } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";

/* ========================================
   ELEMENTS
======================================== */

const neededExpenseCaption = document.getElementById(
  "sbmiNeededExpenseCaption",
);

const neededExpenseAmount = document.getElementById("sbmiNeededExpenseAmount");

const neededLiabilityCaption = document.getElementById(
  "sbmiNeededLiabilityCaption",
);

const neededLiabilityAmount = document.getElementById(
  "sbmiNeededLiabilityAmount",
);

const neededFutureSelfCaption = document.getElementById(
  "sbmiNeededFutureSelfCaption",
);

const neededFutureSelfAmount = document.getElementById(
  "sbmiNeededFutureSelfAmount",
);

const totalNeededValue = document.getElementById("sbmiTotalNeeded");

const existingList = document.getElementById("sbmiExistingList");

const existingEmptyMessage = document.getElementById(
  "sbmiExistingEmptyMessage",
);

const totalExistingValue = document.getElementById("sbmiTotalExisting");

const gapValue = document.getElementById("sbmiGapValue");

const gapTag = document.getElementById("sbmiGapTag");

const gapProgressFill = document.getElementById("sbmiGapProgressFill");

const gapProgressCaption = document.getElementById("sbmiGapProgressCaption");

/* ========================================
   INITIALIZATION
======================================== */

let moduleInitialized = false;

export function initializeSbmiAnalysis() {
  if (moduleInitialized) {
    renderSbmiAnalysis();

    return;
  }

  attachApplicationListeners();

  renderSbmiAnalysis();

  moduleInitialized = true;
}

/* ========================================
   RESET
======================================== */

export function resetSbmiAnalysis() {
  renderSbmiAnalysis();
}

/* ========================================
   EVENT LISTENERS
======================================== */

function attachApplicationListeners() {
  on(EVENTS.EXPENSES_CHANGED, renderSbmiAnalysis);
  on(EVENTS.LIABILITIES_CHANGED, renderSbmiAnalysis);
  on(EVENTS.COMMITMENTS_CHANGED, renderSbmiAnalysis);
  on(EVENTS.POLICIES_CHANGED, renderSbmiAnalysis);
}

/* ========================================
   RENDER
======================================== */

export function renderSbmiAnalysis() {
  const totalNeeded = renderCoverageNeeded();

  const totalExisting = renderExistingCoverage();

  renderCoverageGap(totalNeeded, totalExisting);
}

/* ========================================
   COVERAGE NEEDED
======================================== */

function renderCoverageNeeded() {
  const protection = getProtection();

  const expenseItems = getSelectableExpenseItems();

  const selectedExpenseKeys = protection.selectedExpenseKeys || [];

  const selectedExpenseCount = expenseItems.filter(function (item) {
    return selectedExpenseKeys.includes(item.key);
  }).length;

  const expenseTotal =
    getSelectedExpenseMonthlyTotal(protection) * PROTECTION_HORIZON_MONTHS;

  if (neededExpenseCaption) {
    neededExpenseCaption.textContent =
      expenseItems.length === 0
        ? "No expenses recorded"
        : `${selectedExpenseCount} of ${expenseItems.length} expense categories selected`;
  }

  if (neededExpenseAmount) {
    neededExpenseAmount.textContent = formatCurrency(expenseTotal);
  }

  const liabilities = getSelectableLiabilities();

  const selectedLiabilityIds = protection.selectedLiabilityIds || [];

  const selectedLiabilityCount = liabilities.filter(function (liability) {
    return selectedLiabilityIds.includes(liability.id);
  }).length;

  const liabilityTotal =
    getSelectedLiabilityMonthlyTotal(protection) * PROTECTION_HORIZON_MONTHS;

  if (neededLiabilityCaption) {
    neededLiabilityCaption.textContent =
      liabilities.length === 0
        ? "No liabilities recorded"
        : `${selectedLiabilityCount} of ${liabilities.length} liabilities selected`;
  }

  if (neededLiabilityAmount) {
    neededLiabilityAmount.textContent = formatCurrency(liabilityTotal);
  }

  const futureSelfIncluded = Boolean(protection.includeFutureSelfContribution);

  const futureSelfAmount = futureSelfIncluded
    ? getFutureSelfDisplayedAmount(protection)
    : 0;

  if (neededFutureSelfCaption) {
    neededFutureSelfCaption.textContent = futureSelfIncluded
      ? `Included at ${FUTURE_SELF_GROWTH_RATE_PERCENT}% p.a. over ${PROTECTION_HORIZON_YEARS} years`
      : "Not included";
  }

  if (neededFutureSelfAmount) {
    neededFutureSelfAmount.textContent = formatCurrency(futureSelfAmount);
  }

  const totalNeeded = expenseTotal + liabilityTotal + futureSelfAmount;

  if (totalNeededValue) {
    totalNeededValue.textContent = formatCurrency(totalNeeded);
  }

  return totalNeeded;
}

/* ========================================
   EXISTING COVERAGE
======================================== */

function renderExistingCoverage() {
  if (!existingList) {
    return 0;
  }

  existingList.innerHTML = "";

  const { entries, totalAmount } = calculateExistingCriticalIllnessCoverage();

  if (entries.length === 0) {
    if (existingEmptyMessage) {
      existingList.appendChild(existingEmptyMessage);
    }
  } else {
    entries.forEach(function (entry) {
      existingList.appendChild(createExistingCoverageRow(entry));
    });
  }

  if (totalExistingValue) {
    totalExistingValue.textContent = formatCurrency(totalAmount);
  }

  return totalAmount;
}

function createExistingCoverageRow(entry) {
  const row = document.createElement("div");

  row.className = "sbmi-summary-row";

  const labelWrap = document.createElement("div");

  const labelSpan = document.createElement("span");

  labelSpan.textContent = entry.policyName;

  labelWrap.appendChild(labelSpan);

  const captionParts = [
    entry.benefitType === "early_critical_illness"
      ? "Early Critical Illness"
      : "Critical Illness",
  ];

  if (entry.payoutTypeLabel) {
    captionParts.push(entry.payoutTypeLabel);
  }

  const caption = document.createElement("small");

  caption.textContent = captionParts.join(" · ");

  labelWrap.appendChild(caption);

  if (entry.note) {
    const note = document.createElement("small");

    note.className = "sbmi-summary-row-note";

    note.textContent = entry.note;

    labelWrap.appendChild(note);
  }

  const amount = document.createElement("strong");

  amount.textContent = formatCurrency(entry.amount);

  row.append(labelWrap, amount);

  return row;
}

/* ========================================
   COVERAGE GAP
======================================== */

function renderCoverageGap(totalNeeded, totalExisting) {
  const gap = totalNeeded - totalExisting;

  const isCovered = gap <= 0;

  if (gapValue) {
    gapValue.textContent = formatCurrency(Math.abs(gap));

    gapValue.classList.toggle("sbmi-gap-value--shortfall", !isCovered);
    gapValue.classList.toggle("sbmi-gap-value--covered", isCovered);
  }

  if (gapTag) {
    gapTag.textContent = isCovered ? "Fully Covered" : "Shortfall";

    gapTag.classList.toggle("sbmi-gap-tag--shortfall", !isCovered);
    gapTag.classList.toggle("sbmi-gap-tag--covered", isCovered);
  }

  const coveragePercent =
    totalNeeded > 0
      ? Math.min(100, Math.round((totalExisting / totalNeeded) * 100))
      : 100;

  if (gapProgressFill) {
    gapProgressFill.style.width = `${coveragePercent}%`;
  }

  if (gapProgressCaption) {
    gapProgressCaption.textContent = `${coveragePercent}% of ${formatCurrency(
      totalNeeded,
    )}`;
  }
}
