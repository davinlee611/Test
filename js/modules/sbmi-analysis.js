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

import {
  calculateExistingCriticalIllnessCoverage,
  getBestRecordedHospitalisationWardClass,
  getPersonalAccidentCoverageSummary,
} from "../services/protection-coverage-calculator.js";

import { HOSPITAL_CLASS_LABELS } from "../constants/insurance.js";

import { on } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";

/* ========================================
   MEDICAL PROTECTION CHECK

   How high a Step 1 "importance of not waiting for treatment" answer
   must be before it's treated as a preference for Private ward class.
   A fixed threshold for now, not a calculated recommendation.
======================================== */

const HIGH_WAIT_TIME_IMPORTANCE_THRESHOLD = 4;

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

const waitTimeSignalValue = document.getElementById("sbmiWaitTimeSignalValue");

const waitTimeScaleDots = document.getElementById("sbmiWaitTimeScaleDots");

const waitTimeRecordedValue = document.getElementById(
  "sbmiWaitTimeRecordedValue",
);

const waitTimeFlag = document.getElementById("sbmiWaitTimeFlag");

const waitTimeFlagIcon = document.getElementById("sbmiWaitTimeFlagIcon");

const waitTimeFlagTitle = document.getElementById("sbmiWaitTimeFlagTitle");

const waitTimeFlagDetail = document.getElementById("sbmiWaitTimeFlagDetail");

const injurySignalValue = document.getElementById("sbmiInjurySignalValue");

const injuryRecordedValue = document.getElementById("sbmiInjuryRecordedValue");

const injuryFlag = document.getElementById("sbmiInjuryFlag");

const injuryFlagIcon = document.getElementById("sbmiInjuryFlagIcon");

const injuryFlagTitle = document.getElementById("sbmiInjuryFlagTitle");

const injuryFlagDetail = document.getElementById("sbmiInjuryFlagDetail");

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

  renderMedicalProtectionCheck();
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

/* ========================================
   MEDICAL PROTECTION CHECK
======================================== */

function renderMedicalProtectionCheck() {
  renderWaitTimeCheck();

  renderInjuryCheck();
}

function renderWaitTimeCheck() {
  const protection = getProtection();

  const importance = Number(protection.waitTimeImportance) || 0;

  if (waitTimeScaleDots) {
    Array.from(waitTimeScaleDots.children).forEach(function (dot, index) {
      dot.classList.toggle("is-filled", index < importance);
    });
  }

  if (waitTimeSignalValue) {
    waitTimeSignalValue.textContent =
      importance > 0
        ? `${importance} / 5 — ${getImportanceLabel(importance)}`
        : "Not yet answered";
  }

  const wardType = getBestRecordedHospitalisationWardClass();

  if (waitTimeRecordedValue) {
    waitTimeRecordedValue.textContent = wardType
      ? `Hospitalisation — ${HOSPITAL_CLASS_LABELS[wardType] || wardType}`
      : "No Hospitalisation policy recorded";
  }

  if (!waitTimeFlag) {
    return;
  }

  const isHighImportance = importance >= HIGH_WAIT_TIME_IMPORTANCE_THRESHOLD;

  if (!isHighImportance) {
    waitTimeFlag.hidden = true;

    return;
  }

  waitTimeFlag.hidden = false;

  if (wardType === "private") {
    setFlag({
      flagElement: waitTimeFlag,
      iconElement: waitTimeFlagIcon,
      titleElement: waitTimeFlagTitle,
      detailElement: waitTimeFlagDetail,
      variant: "success",
      icon: "✅",
      title: "Matches Preference",
      detail: "The recorded plan is already Private ward class.",
    });

    return;
  }

  setFlag({
    flagElement: waitTimeFlag,
    iconElement: waitTimeFlagIcon,
    titleElement: waitTimeFlagTitle,
    detailElement: waitTimeFlagDetail,
    variant: "warning",
    icon: "⚠️",
    title: "Consider Private Ward",
    detail: wardType
      ? `High importance on avoiding treatment delays, but the recorded plan is ${
          HOSPITAL_CLASS_LABELS[wardType] || wardType
        } — not Private.`
      : "High importance on avoiding treatment delays, but no Hospitalisation plan is recorded.",
  });
}

function getImportanceLabel(importance) {
  if (importance >= HIGH_WAIT_TIME_IMPORTANCE_THRESHOLD) {
    return "High Importance";
  }

  if (importance === 3) {
    return "Medium Importance";
  }

  return "Low Importance";
}

function renderInjuryCheck() {
  const protection = getProtection();

  const injuryProne = protection.activeExerciseInjuryProne;

  if (injurySignalValue) {
    injurySignalValue.textContent =
      injuryProne === null
        ? "Not yet answered"
        : injuryProne
          ? "Yes — Active & Injury-Prone"
          : "No";
  }

  const accidentCoverage = getPersonalAccidentCoverageSummary();

  if (injuryRecordedValue) {
    injuryRecordedValue.textContent =
      accidentCoverage.policyCount > 0
        ? `${accidentCoverage.policyCount} Personal Accident ${
            accidentCoverage.policyCount === 1 ? "policy" : "policies"
          } · ${formatCurrency(accidentCoverage.totalAmount)} coverage`
        : "No Personal Accident policy recorded";
  }

  if (!injuryFlag) {
    return;
  }

  if (injuryProne !== true) {
    injuryFlag.hidden = true;

    return;
  }

  injuryFlag.hidden = false;

  if (accidentCoverage.policyCount > 0) {
    setFlag({
      flagElement: injuryFlag,
      iconElement: injuryFlagIcon,
      titleElement: injuryFlagTitle,
      detailElement: injuryFlagDetail,
      variant: "success",
      icon: "✅",
      title: "Personal Accident Cover in Place",
      detail: "No action needed — a Personal Accident policy is already recorded.",
    });

    return;
  }

  setFlag({
    flagElement: injuryFlag,
    iconElement: injuryFlagIcon,
    titleElement: injuryFlagTitle,
    detailElement: injuryFlagDetail,
    variant: "warning",
    icon: "⚠️",
    title: "Consider Personal Accident Cover",
    detail:
      "Client is active and injury-prone, but no Personal Accident policy is recorded.",
  });
}

function setFlag({
  flagElement,
  iconElement,
  titleElement,
  detailElement,
  variant,
  icon,
  title,
  detail,
}) {
  flagElement.classList.remove(
    "sbmi-check-flag--warning",
    "sbmi-check-flag--success",
  );

  flagElement.classList.add(`sbmi-check-flag--${variant}`);

  if (iconElement) {
    iconElement.textContent = icon;
  }

  if (titleElement) {
    titleElement.textContent = title;
  }

  if (detailElement) {
    detailElement.textContent = detail;
  }
}
