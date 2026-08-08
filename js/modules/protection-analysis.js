"use strict";

import {
  createEmptyProtection,
  getExpenses,
  getLiabilities,
  getProtection,
  updateProtection,
} from "../state/client-plan.js";

import { formatCurrency } from "../utils/client-utils.js";

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

const coverageTotalValue = document.getElementById(
  "protectionCoverageTotalValue",
);

/* ========================================
   PROTECTION HORIZON

   How many years of an ongoing obligation the Step 2 helper text
   assumes should be covered. A fixed planning assumption for now,
   not a calculated recommendation.
======================================== */

export const PROTECTION_HORIZON_YEARS = 5;

export const PROTECTION_HORIZON_MONTHS = PROTECTION_HORIZON_YEARS * 12;

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

export function getSelectableExpenseItems() {
  const expenses = getExpenses();

  return EXPENSE_FIELDS.map(function (field) {
    return {
      key: field.key,
      label: field.label,
      amount: Number(expenses?.[field.key]) || 0,
    };
  }).filter(function (item) {
    return item.amount > 0;
  });
}

export function getSelectableLiabilities() {
  return getLiabilities() || [];
}

export function getSelectedExpenseMonthlyTotal(protection) {
  const selectedExpenseKeys = protection.selectedExpenseKeys || [];

  return getSelectableExpenseItems().reduce(function (total, item) {
    if (!selectedExpenseKeys.includes(item.key)) {
      return total;
    }

    return total + item.amount;
  }, 0);
}

export function getSelectedLiabilityMonthlyTotal(protection) {
  const selectedLiabilityIds = protection.selectedLiabilityIds || [];

  return getSelectableLiabilities()
    .filter(function (liability) {
      return selectedLiabilityIds.includes(liability.id);
    })
    .reduce(function (total, liability) {
      return total + (Number(liability.monthlyRepayment) || 0);
    }, 0);
}

/*
 * Pure breakdown of the "Coverage Needed" figure, shared by this page's
 * own coverage total, SBMI Analysis, and the Client Report so all three
 * show the same number without recalculating it independently.
 */
export function getCoverageNeededBreakdown(protection) {
  const expenseItems = getSelectableExpenseItems();

  const selectedExpenseKeys = protection.selectedExpenseKeys || [];

  const selectedExpenseCount = expenseItems.filter(function (item) {
    return selectedExpenseKeys.includes(item.key);
  }).length;

  const expenseTotal =
    getSelectedExpenseMonthlyTotal(protection) * PROTECTION_HORIZON_MONTHS;

  const liabilities = getSelectableLiabilities();

  const selectedLiabilityIds = protection.selectedLiabilityIds || [];

  const selectedLiabilityCount = liabilities.filter(function (liability) {
    return selectedLiabilityIds.includes(liability.id);
  }).length;

  const liabilityTotal =
    getSelectedLiabilityMonthlyTotal(protection) * PROTECTION_HORIZON_MONTHS;

  return {
    expenseItemCount: expenseItems.length,
    selectedExpenseCount,
    expenseTotal,

    liabilityCount: liabilities.length,
    selectedLiabilityCount,
    liabilityTotal,

    totalNeeded: expenseTotal + liabilityTotal,
  };
}

function renderCoverageTotal(protection) {
  if (!coverageTotalValue) {
    return;
  }

  coverageTotalValue.textContent = formatCurrency(
    getCoverageNeededBreakdown(protection).totalNeeded,
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

  const items = getSelectableExpenseItems();

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

  const liabilities = getSelectableLiabilities();

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
