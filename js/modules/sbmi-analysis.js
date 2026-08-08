"use strict";

import { getProtection } from "../state/client-plan.js";

import { formatCurrency } from "../utils/client-utils.js";

import { getCoverageNeededBreakdown } from "./protection-analysis.js";

import {
  calculateCoverageGap,
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
  const breakdown = getCoverageNeededBreakdown(getProtection());

  if (neededExpenseCaption) {
    neededExpenseCaption.textContent =
      breakdown.expenseItemCount === 0
        ? "No expenses recorded"
        : `${breakdown.selectedExpenseCount} of ${breakdown.expenseItemCount} expense categories selected`;
  }

  if (neededExpenseAmount) {
    neededExpenseAmount.textContent = formatCurrency(breakdown.expenseTotal);
  }

  if (neededLiabilityCaption) {
    neededLiabilityCaption.textContent =
      breakdown.liabilityCount === 0
        ? "No liabilities recorded"
        : `${breakdown.selectedLiabilityCount} of ${breakdown.liabilityCount} liabilities selected`;
  }

  if (neededLiabilityAmount) {
    neededLiabilityAmount.textContent = formatCurrency(breakdown.liabilityTotal);
  }

  if (totalNeededValue) {
    totalNeededValue.textContent = formatCurrency(breakdown.totalNeeded);
  }

  return breakdown.totalNeeded;
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
  const { gap, isCovered, coveragePercent } = calculateCoverageGap(
    totalNeeded,
    totalExisting,
  );

  if (gapValue) {
    gapValue.textContent = formatCurrency(gap);

    gapValue.classList.toggle("sbmi-gap-value--shortfall", !isCovered);
    gapValue.classList.toggle("sbmi-gap-value--covered", isCovered);
  }

  if (gapTag) {
    gapTag.textContent = isCovered ? "Fully Covered" : "Shortfall";

    gapTag.classList.toggle("sbmi-gap-tag--shortfall", !isCovered);
    gapTag.classList.toggle("sbmi-gap-tag--covered", isCovered);
  }

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

/*
 * Pure result for the Treatment Wait-Time Preference check, shared by
 * this page's own rendering and the Client Report.
 */
export function getWaitTimeCheckResult() {
  const protection = getProtection();

  const importance = Number(protection.waitTimeImportance) || 0;

  const wardType = getBestRecordedHospitalisationWardClass();

  const isHighImportance = importance >= HIGH_WAIT_TIME_IMPORTANCE_THRESHOLD;

  let flag = null;

  if (isHighImportance) {
    flag =
      wardType === "private"
        ? {
            variant: "success",
            icon: "✅",
            title: "Matches Preference",
            detail: "The recorded plan is already Private ward class.",
          }
        : {
            variant: "warning",
            icon: "⚠️",
            title: "Consider Private Ward",
            detail: wardType
              ? `High importance on avoiding treatment delays, but the recorded plan is ${
                  HOSPITAL_CLASS_LABELS[wardType] || wardType
                } — not Private.`
              : "High importance on avoiding treatment delays, but no Hospitalisation plan is recorded.",
          };
  }

  return {
    importance,
    importanceLabel: importance > 0 ? getImportanceLabel(importance) : null,
    wardType,
    wardLabel: wardType ? HOSPITAL_CLASS_LABELS[wardType] || wardType : null,
    flag,
  };
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

/*
 * Pure result for the Active Lifestyle / Injury Risk check, shared by
 * this page's own rendering and the Client Report.
 */
export function getInjuryCheckResult() {
  const protection = getProtection();

  const injuryProne = protection.activeExerciseInjuryProne;

  const accidentCoverage = getPersonalAccidentCoverageSummary();

  let flag = null;

  if (injuryProne === true) {
    flag =
      accidentCoverage.policyCount > 0
        ? {
            variant: "success",
            icon: "✅",
            title: "Personal Accident Cover in Place",
            detail:
              "No action needed — a Personal Accident policy is already recorded.",
          }
        : {
            variant: "warning",
            icon: "⚠️",
            title: "Consider Personal Accident Cover",
            detail:
              "Client is active and injury-prone, but no Personal Accident policy is recorded.",
          };
  }

  return { injuryProne, accidentCoverage, flag };
}

function renderWaitTimeCheck() {
  const result = getWaitTimeCheckResult();

  if (waitTimeScaleDots) {
    Array.from(waitTimeScaleDots.children).forEach(function (dot, index) {
      dot.classList.toggle("is-filled", index < result.importance);
    });
  }

  if (waitTimeSignalValue) {
    waitTimeSignalValue.textContent =
      result.importance > 0
        ? `${result.importance} / 5 — ${result.importanceLabel}`
        : "Not yet answered";
  }

  if (waitTimeRecordedValue) {
    waitTimeRecordedValue.textContent = result.wardLabel
      ? `Hospitalisation — ${result.wardLabel}`
      : "No Hospitalisation policy recorded";
  }

  if (!waitTimeFlag) {
    return;
  }

  if (!result.flag) {
    waitTimeFlag.hidden = true;

    return;
  }

  waitTimeFlag.hidden = false;

  setFlag({
    flagElement: waitTimeFlag,
    iconElement: waitTimeFlagIcon,
    titleElement: waitTimeFlagTitle,
    detailElement: waitTimeFlagDetail,
    ...result.flag,
  });
}

function renderInjuryCheck() {
  const result = getInjuryCheckResult();

  if (injurySignalValue) {
    injurySignalValue.textContent =
      result.injuryProne === null
        ? "Not yet answered"
        : result.injuryProne
          ? "Yes — Active & Injury-Prone"
          : "No";
  }

  if (injuryRecordedValue) {
    injuryRecordedValue.textContent =
      result.accidentCoverage.policyCount > 0
        ? `${result.accidentCoverage.policyCount} Personal Accident ${
            result.accidentCoverage.policyCount === 1 ? "policy" : "policies"
          } · ${formatCurrency(result.accidentCoverage.totalAmount)} coverage`
        : "No Personal Accident policy recorded";
  }

  if (!injuryFlag) {
    return;
  }

  if (!result.flag) {
    injuryFlag.hidden = true;

    return;
  }

  injuryFlag.hidden = false;

  setFlag({
    flagElement: injuryFlag,
    iconElement: injuryFlagIcon,
    titleElement: injuryFlagTitle,
    detailElement: injuryFlagDetail,
    ...result.flag,
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
