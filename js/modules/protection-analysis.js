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

/* ========================================
   PROTECTION HORIZON

   How many years of an ongoing obligation the Step 2 helper text
   assumes should be covered. A fixed planning assumption for now,
   not a calculated recommendation.
======================================== */

const PROTECTION_HORIZON_YEARS = 5;

const PROTECTION_HORIZON_MONTHS = PROTECTION_HORIZON_YEARS * 12;

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
  });

  on(EVENTS.LIABILITIES_CHANGED, function () {
    renderLiabilityChecklist(getProtection());
  });

  on(EVENTS.COMMITMENTS_CHANGED, function () {
    renderFutureSelfChecklist(getProtection());
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
}

function syncRadioGroup(inputs, value) {
  inputs.forEach(function (input) {
    input.checked = input.value === value;
  });
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
        },
      }),
    );
  });

  const totalMonthlyExpenses = items.reduce(function (total, item) {
    return total + item.amount;
  }, 0);

  expenseChecklist.appendChild(
    createChecklistHelper(
      `${PROTECTION_HORIZON_YEARS} years of expenses: ${formatCurrency(
        totalMonthlyExpenses * PROTECTION_HORIZON_MONTHS,
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
        },
      }),
    );
  });

  const totalMonthlyLiabilityRepayments = liabilities.reduce(function (
    total,
    liability,
  ) {
    return total + (Number(liability.monthlyRepayment) || 0);
  }, 0);

  liabilityChecklist.appendChild(
    createChecklistHelper(
      `${PROTECTION_HORIZON_YEARS} years of liabilities: ${formatCurrency(
        totalMonthlyLiabilityRepayments * PROTECTION_HORIZON_MONTHS,
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

  const calculatedFutureValue = monthlyAmount * PROTECTION_HORIZON_MONTHS;

  const customAmount = Number(protection.futureSelfProtectionAmount) || 0;

  const displayedAmount = customAmount > 0 ? customAmount : calculatedFutureValue;

  futureSelfChecklist.appendChild(
    createFutureSelfItem({
      checked: Boolean(protection.includeFutureSelfContribution),

      displayedAmount,

      helperText:
        `Calculated future value, or enter custom amount. ` +
        `(Based on ${formatCurrency(monthlyAmount)}/mth for ` +
        `${PROTECTION_HORIZON_YEARS} years)`,

      onToggle(checked) {
        updateProtection({ includeFutureSelfContribution: checked });
      },

      onAmountChange(value) {
        updateProtection({ futureSelfProtectionAmount: value });
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

  const row = document.createElement("label");

  row.className = "protection-checklist-item-row";

  const checkbox = document.createElement("input");

  checkbox.type = "checkbox";

  checkbox.checked = checked;

  checkbox.addEventListener("change", function () {
    onToggle(checkbox.checked);
  });

  const labelSpan = document.createElement("span");

  labelSpan.className = "protection-checklist-item-label";

  labelSpan.textContent = "Monthly Contribution to Future Self";

  row.append(checkbox, labelSpan);

  const amountField = document.createElement("div");

  amountField.className = "protection-checklist-amount-field";

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

  const helper = createChecklistHelper(helperText);

  amountField.append(currencyWrap, helper);

  item.append(row, amountField);

  return item;
}
