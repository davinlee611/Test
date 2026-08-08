"use strict";

import { getProtection } from "../../state/client-plan.js";

import { formatCurrency } from "../../utils/client-utils.js";

import { getCoverageNeededBreakdown } from "../protection-analysis.js";

import {
  calculateCoverageGap,
  calculateExistingCriticalIllnessCoverage,
} from "../../services/protection-coverage-calculator.js";

import {
  getInjuryCheckResult,
  getWaitTimeCheckResult,
} from "./sbmi-analysis-check-calculator.js";

/* ========================================
   COVERAGE NEEDED
======================================== */

export function renderCoverageNeeded(elements) {
  const breakdown = getCoverageNeededBreakdown(getProtection());

  if (elements.neededExpenseCaption) {
    elements.neededExpenseCaption.textContent =
      breakdown.expenseItemCount === 0
        ? "No expenses recorded"
        : `${breakdown.selectedExpenseCount} of ${breakdown.expenseItemCount} expense categories selected`;
  }

  if (elements.neededExpenseAmount) {
    elements.neededExpenseAmount.textContent = formatCurrency(
      breakdown.expenseTotal,
    );
  }

  if (elements.neededLiabilityCaption) {
    elements.neededLiabilityCaption.textContent =
      breakdown.liabilityCount === 0
        ? "No liabilities recorded"
        : `${breakdown.selectedLiabilityCount} of ${breakdown.liabilityCount} liabilities selected`;
  }

  if (elements.neededLiabilityAmount) {
    elements.neededLiabilityAmount.textContent = formatCurrency(
      breakdown.liabilityTotal,
    );
  }

  if (elements.totalNeededValue) {
    elements.totalNeededValue.textContent = formatCurrency(
      breakdown.totalNeeded,
    );
  }

  return breakdown.totalNeeded;
}

/* ========================================
   EXISTING COVERAGE
======================================== */

export function renderExistingCoverage(elements) {
  if (!elements.existingList) {
    return 0;
  }

  elements.existingList.innerHTML = "";

  const { entries, totalAmount } = calculateExistingCriticalIllnessCoverage();

  if (entries.length === 0) {
    if (elements.existingEmptyMessage) {
      elements.existingList.appendChild(elements.existingEmptyMessage);
    }
  } else {
    entries.forEach(function (entry) {
      elements.existingList.appendChild(createExistingCoverageRow(entry));
    });
  }

  if (elements.totalExistingValue) {
    elements.totalExistingValue.textContent = formatCurrency(totalAmount);
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

export function renderCoverageGap(elements, totalNeeded, totalExisting) {
  const { gap, isCovered, coveragePercent } = calculateCoverageGap(
    totalNeeded,
    totalExisting,
  );

  if (elements.gapValue) {
    elements.gapValue.textContent = formatCurrency(gap);

    elements.gapValue.classList.toggle(
      "sbmi-gap-value--shortfall",
      !isCovered,
    );
    elements.gapValue.classList.toggle("sbmi-gap-value--covered", isCovered);
  }

  if (elements.gapTag) {
    elements.gapTag.textContent = isCovered ? "Fully Covered" : "Shortfall";

    elements.gapTag.classList.toggle("sbmi-gap-tag--shortfall", !isCovered);
    elements.gapTag.classList.toggle("sbmi-gap-tag--covered", isCovered);
  }

  if (elements.gapProgressFill) {
    elements.gapProgressFill.style.width = `${coveragePercent}%`;
  }

  if (elements.gapProgressCaption) {
    elements.gapProgressCaption.textContent = `${coveragePercent}% of ${formatCurrency(
      totalNeeded,
    )}`;
  }
}

/* ========================================
   MEDICAL PROTECTION CHECK
======================================== */

export function renderMedicalProtectionCheck(elements) {
  renderWaitTimeCheck(elements);

  renderInjuryCheck(elements);
}

function renderWaitTimeCheck(elements) {
  const result = getWaitTimeCheckResult();

  if (elements.waitTimeScaleDots) {
    Array.from(elements.waitTimeScaleDots.children).forEach(function (
      dot,
      index,
    ) {
      dot.classList.toggle("is-filled", index < result.importance);
    });
  }

  if (elements.waitTimeSignalValue) {
    elements.waitTimeSignalValue.textContent =
      result.importance > 0
        ? `${result.importance} / 5 — ${result.importanceLabel}`
        : "Not yet answered";
  }

  if (elements.waitTimeRecordedValue) {
    elements.waitTimeRecordedValue.textContent = result.wardLabel
      ? `Hospitalisation — ${result.wardLabel}`
      : "No Hospitalisation policy recorded";
  }

  if (!elements.waitTimeFlag) {
    return;
  }

  if (!result.flag) {
    elements.waitTimeFlag.hidden = true;

    return;
  }

  elements.waitTimeFlag.hidden = false;

  setFlag({
    flagElement: elements.waitTimeFlag,
    iconElement: elements.waitTimeFlagIcon,
    titleElement: elements.waitTimeFlagTitle,
    detailElement: elements.waitTimeFlagDetail,
    ...result.flag,
  });
}

function renderInjuryCheck(elements) {
  const result = getInjuryCheckResult();

  if (elements.injurySignalValue) {
    elements.injurySignalValue.textContent =
      result.injuryProne === null
        ? "Not yet answered"
        : result.injuryProne
          ? "Yes — Active & Injury-Prone"
          : "No";
  }

  if (elements.injuryRecordedValue) {
    elements.injuryRecordedValue.textContent =
      result.accidentCoverage.policyCount > 0
        ? `${result.accidentCoverage.policyCount} Personal Accident ${
            result.accidentCoverage.policyCount === 1 ? "policy" : "policies"
          } · ${formatCurrency(result.accidentCoverage.totalAmount)} coverage`
        : "No Personal Accident policy recorded";
  }

  if (!elements.injuryFlag) {
    return;
  }

  if (!result.flag) {
    elements.injuryFlag.hidden = true;

    return;
  }

  elements.injuryFlag.hidden = false;

  setFlag({
    flagElement: elements.injuryFlag,
    iconElement: elements.injuryFlagIcon,
    titleElement: elements.injuryFlagTitle,
    detailElement: elements.injuryFlagDetail,
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
