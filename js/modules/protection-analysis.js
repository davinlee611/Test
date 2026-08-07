"use strict";

import {
  createEmptyProtection,
  getExpenses,
  getLiabilities,
  getPriorities,
  getProtection,
  updateProtection,
} from "../state/client-plan.js";

import {
  formatCurrency,
  getInputWholeNumber,
} from "../utils/client-utils.js";

import { EXPENSE_FIELDS } from "./expenses/expense-config.js";

import { getLiabilityTypeLabel } from "./liabilities/liability-config.js";

import { calculateMonthlyContributionFutureValue } from "./cost-analysis.js";

import { on } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";

/* ========================================
   ELEMENTS
======================================== */

const waitTimeInputs = Array.from(
  document.querySelectorAll('input[name="protectionWaitTimeImportance"]'),
);

const injuryProneInputs = Array.from(
  document.querySelectorAll(
    'input[name="protectionActiveExerciseInjuryProne"]',
  ),
);

const expenseChecklist = document.getElementById(
  "protectionExpenseChecklist",
);

const emptyExpenseMessage = document.getElementById(
  "protectionEmptyExpenseMessage",
);

const liabilityChecklist = document.getElementById(
  "protectionLiabilityChecklist",
);

const emptyLiabilityMessage = document.getElementById(
  "protectionEmptyLiabilityMessage",
);

const futureSelfChecklist = document.getElementById(
  "protectionFutureSelfChecklist",
);

const emptyFutureSelfMessage = document.getElementById(
  "protectionEmptyFutureSelfMessage",
);

const coverageTotalValue = document.getElementById(
  "protectionCoverageTotalValue",
);

/* ========================================
   PROTECTION HORIZON

   How many years of an ongoing obligation the Step 2 helper text
   assumes should be covered. A fixed planning assumption for now,
   not a calculated recommendation.
======================================== */

const PROTECTION_HORIZON_YEARS = 5;

const PROTECTION_HORIZON_MONTHS = PROTECTION_HORIZON_YEARS * 12;

/*
 * Growth assumption for the Future Self future-value calculation.
 * Matches the app's existing Pre-FYBC Growth Assumption default
 * (see cost-analysis.js), kept independent here rather than reading
 * the live Analysis/Next Steps input so this page doesn't silently
 * change if that unrelated input is edited.
 */
const FUTURE_SELF_GROWTH_RATE_PERCENT = 5;

/* ========================================
   INITIALIZATION
======================================== */

let moduleInitialized = false;

export function initializeProtectionAnalysis() {
  if (moduleInitialized) {
    renderProtectionAnalysis();

    return;
  }

  attachStepOneListeners();
  attachApplicationListeners();

  renderProtectionAnalysis();

  moduleInitialized = true;
}

/* ========================================
   RESET
======================================== */

export function resetProtectionAnalysis() {
  updateProtection(createEmptyProtection());

  renderProtectionAnalysis();
}

/* ========================================
   EVENT LISTENERS
======================================== */

function attachStepOneListeners() {
  waitTimeInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      updateProtection({ waitTimeImportance: Number(input.value) });
    });
  });

  injuryProneInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      updateProtection({ activeExerciseInjuryProne: input.value === "yes" });
    });
  });
}

function attachApplicationListeners() {
  on(EVENTS.EXPENSES_CHANGED, function () {
    renderExpenseChecklist(getProtection());
    renderCoverageTotal(getProtection());
  });

  on(EVENTS.LIABILITIES_CHANGED, function () {
    renderLiabilityChecklist(getProtection());
    renderCoverageTotal(getProtection());
  });

  on(EVENTS.COMMITMENTS_CHANGED, function () {
    renderFutureSelfChecklist(getProtection());
    renderCoverageTotal(getProtection());
  });
}

/* ========================================
   RENDER
======================================== */

export function renderProtectionAnalysis() {
  const protection = getProtection();

  syncRadioGroup(
    waitTimeInputs,
    protection.waitTimeImportance ? String(protection.waitTimeImportance) : "",
  );

  syncRadioGroup(
    injuryProneInputs,
    protection.activeExerciseInjuryProne === null
      ? ""
      : protection.activeExerciseInjuryProne
        ? "yes"
        : "no",
  );

  renderExpenseChecklist(protection);
  renderLiabilityChecklist(protection);
  renderFutureSelfChecklist(protection);
  renderCoverageTotal(protection);
}

function syncRadioGroup(inputs, value) {
  inputs.forEach(function (input) {
    input.checked = input.value === value;
  });
}

/* ========================================
   STEP 2 — COVERAGE TOTAL
======================================== */

function getSelectedExpenseMonthlyTotal(protection) {
  const expenses = getExpenses();

  const selectedExpenseKeys = protection.selectedExpenseKeys || [];

  return EXPENSE_FIELDS.reduce(function (total, field) {
    if (!selectedExpenseKeys.includes(field.key)) {
      return total;
    }

    return total + (Number(expenses?.[field.key]) || 0);
  }, 0);
}

function getSelectedLiabilityMonthlyTotal(protection) {
  const liabilities = getLiabilities() || [];

  const selectedLiabilityIds = protection.selectedLiabilityIds || [];

  return liabilities
    .filter(function (liability) {
      return selectedLiabilityIds.includes(liability.id);
    })
    .reduce(function (total, liability) {
      return total + (Number(liability.monthlyRepayment) || 0);
    }, 0);
}

function getFutureSelfDisplayedAmount(protection) {
  const monthlyAmount =
    Number(getPriorities().commitments?.contributionToFutureSelf) || 0;

  if (monthlyAmount <= 0) {
    return 0;
  }

  const calculatedFutureValue = calculateMonthlyContributionFutureValue({
    monthlyAmount,
    months: PROTECTION_HORIZON_MONTHS,
    annualRatePercent: FUTURE_SELF_GROWTH_RATE_PERCENT,
  });

  const customAmount = Number(protection.futureSelfProtectionAmount) || 0;

  return customAmount > 0 ? customAmount : calculatedFutureValue;
}

function renderCoverageTotal(protection) {
  if (!coverageTotalValue) {
    return;
  }

  const expenseTotal =
    getSelectedExpenseMonthlyTotal(protection) * PROTECTION_HORIZON_MONTHS;

  const liabilityTotal =
    getSelectedLiabilityMonthlyTotal(protection) * PROTECTION_HORIZON_MONTHS;

  const futureSelfTotal = protection.includeFutureSelfContribution
    ? getFutureSelfDisplayedAmount(protection)
    : 0;

  coverageTotalValue.textContent = formatCurrency(
    expenseTotal + liabilityTotal + futureSelfTotal,
  );
}

/* ========================================
   STEP 2 — EXPENSE CHECKLIST
======================================== */

function renderExpenseChecklist(protection) {
  if (!expenseChecklist) {
    return;
  }

  expenseChecklist.innerHTML = "";

  const expenses = getExpenses();

  const items = EXPENSE_FIELDS.map(function (field) {
    return {
      key: field.key,
      label: field.label,
      amount: Number(expenses?.[field.key]) || 0,
    };
  }).filter(function (item) {
    return item.amount > 0;
  });

  if (items.length === 0) {
    if (emptyExpenseMessage) {
      expenseChecklist.appendChild(emptyExpenseMessage);
    }

    return;
  }

  const selectedExpenseKeys = protection.selectedExpenseKeys || [];

  items.forEach(function (item) {
    expenseChecklist.appendChild(
      createChecklistItem({
        checked: selectedExpenseKeys.includes(item.key),

        label: item.label,

        amountText: `${formatCurrency(item.amount)}/mth`,

        onToggle(checked) {
          toggleArraySelection("selectedExpenseKeys", item.key, checked);

          const nextProtection = getProtection();

          renderExpenseChecklist(nextProtection);
          renderCoverageTotal(nextProtection);
        },
      }),
    );
  });

  const totalSelectedMonthlyExpenses = getSelectedExpenseMonthlyTotal(protection);

  expenseChecklist.appendChild(
    createChecklistHelper(
      `${PROTECTION_HORIZON_YEARS} years of expenses: ${formatCurrency(
        totalSelectedMonthlyExpenses * PROTECTION_HORIZON_MONTHS,
      )}`,
    ),
  );
}

/* ========================================
   STEP 2 — LIABILITY CHECKLIST
======================================== */

function renderLiabilityChecklist(protection) {
  if (!liabilityChecklist) {
    return;
  }

  liabilityChecklist.innerHTML = "";

  const liabilities = getLiabilities() || [];

  if (liabilities.length === 0) {
    if (emptyLiabilityMessage) {
      liabilityChecklist.appendChild(emptyLiabilityMessage);
    }

    return;
  }

  const selectedLiabilityIds = protection.selectedLiabilityIds || [];

  liabilities.forEach(function (liability) {
    liabilityChecklist.appendChild(
      createChecklistItem({
        checked: selectedLiabilityIds.includes(liability.id),

        label: liability.name || getLiabilityTypeLabel(liability.type),

        amountText: `${formatCurrency(liability.monthlyRepayment)}/mth`,

        onToggle(checked) {
          toggleArraySelection("selectedLiabilityIds", liability.id, checked);

          const nextProtection = getProtection();

          renderLiabilityChecklist(nextProtection);
          renderCoverageTotal(nextProtection);
        },
      }),
    );
  });

  const totalSelectedMonthlyLiabilityRepayments =
    getSelectedLiabilityMonthlyTotal(protection);

  liabilityChecklist.appendChild(
    createChecklistHelper(
      `${PROTECTION_HORIZON_YEARS} years of liabilities: ${formatCurrency(
        totalSelectedMonthlyLiabilityRepayments * PROTECTION_HORIZON_MONTHS,
      )}`,
    ),
  );
}

/* ========================================
   STEP 2 — FUTURE SELF CHECKLIST
======================================== */

function renderFutureSelfChecklist(protection) {
  if (!futureSelfChecklist) {
    return;
  }

  futureSelfChecklist.innerHTML = "";

  const monthlyAmount =
    Number(getPriorities().commitments?.contributionToFutureSelf) || 0;

  if (monthlyAmount <= 0) {
    if (emptyFutureSelfMessage) {
      futureSelfChecklist.appendChild(emptyFutureSelfMessage);
    }

    return;
  }

  const displayedAmount = getFutureSelfDisplayedAmount(protection);

  futureSelfChecklist.appendChild(
    createFutureSelfItem({
      checked: Boolean(protection.includeFutureSelfContribution),

      displayedAmount,

      helperText:
        `Calculated future value, or enter custom amount. ` +
        `(Based on ${formatCurrency(monthlyAmount)}/mth for ` +
        `${PROTECTION_HORIZON_YEARS} years at ` +
        `${FUTURE_SELF_GROWTH_RATE_PERCENT}% p.a.)`,

      onToggle(checked) {
        updateProtection({ includeFutureSelfContribution: checked });

        renderCoverageTotal(getProtection());
      },

      onAmountChange(value) {
        updateProtection({ futureSelfProtectionAmount: value });

        renderCoverageTotal(getProtection());
      },
    }),
  );
}

/* ========================================
   STEP 2 — SHARED HELPERS
======================================== */

function toggleArraySelection(fieldKey, itemId, isSelected) {
  const protection = getProtection();

  const current = protection[fieldKey] || [];

  const next = isSelected
    ? [...current, itemId]
    : current.filter(function (id) {
        return id !== itemId;
      });

  updateProtection({ [fieldKey]: next });
}

function createChecklistItem({ checked, label, amountText, onToggle }) {
  const item = document.createElement("label");

  item.className = "protection-checklist-item";

  const input = document.createElement("input");

  input.type = "checkbox";

  input.checked = checked;

  input.addEventListener("change", function () {
    onToggle(input.checked);
  });

  const labelSpan = document.createElement("span");

  labelSpan.className = "protection-checklist-item-label";

  labelSpan.textContent = label;

  const amountSpan = document.createElement("span");

  amountSpan.className = "protection-checklist-item-amount";

  amountSpan.textContent = amountText;

  item.append(input, labelSpan, amountSpan);

  return item;
}

function createChecklistHelper(text) {
  const helper = document.createElement("small");

  helper.className = "protection-checklist-helper";

  helper.textContent = text;

  return helper;
}

function createFutureSelfItem({
  checked,
  displayedAmount,
  helperText,
  onToggle,
  onAmountChange,
}) {
  const item = document.createElement("div");

  item.className = "protection-checklist-item protection-checklist-item--editable";

  const row = document.createElement("div");

  row.className = "protection-checklist-item-row";

  const labelWrap = document.createElement("label");

  labelWrap.className = "protection-checklist-item-label-wrap";

  const checkbox = document.createElement("input");

  checkbox.type = "checkbox";

  checkbox.checked = checked;

  checkbox.addEventListener("change", function () {
    onToggle(checkbox.checked);
  });

  const labelSpan = document.createElement("span");

  labelSpan.className = "protection-checklist-item-label";

  labelSpan.textContent = "Monthly Contribution to Future Self";

  labelWrap.append(checkbox, labelSpan);

  const currencyWrap = document.createElement("div");

  currencyWrap.className = "currency-input";

  const currencySymbol = document.createElement("span");

  currencySymbol.textContent = "$";

  const amountInput = document.createElement("input");

  amountInput.type = "number";

  amountInput.className = "form-control";

  amountInput.min = "0";

  amountInput.step = "1";

  amountInput.inputMode = "numeric";

  amountInput.value =
    displayedAmount > 0 ? String(Math.round(displayedAmount)) : "";

  amountInput.addEventListener("input", function () {
    onAmountChange(getInputWholeNumber(amountInput));
  });

  currencyWrap.append(currencySymbol, amountInput);

  row.append(labelWrap, currencyWrap);

  const helper = createChecklistHelper(helperText);

  item.append(row, helper);

  return item;
}
