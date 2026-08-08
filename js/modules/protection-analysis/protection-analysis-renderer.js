"use strict";

import { formatCurrency } from "../../utils/client-utils.js";

import { getLiabilityTypeLabel } from "../liabilities/liability-config.js";

import {
  PROTECTION_HORIZON_MONTHS,
  PROTECTION_HORIZON_YEARS,
  getCoverageNeededBreakdown,
  getSelectableExpenseItems,
  getSelectableLiabilities,
  getSelectedExpenseMonthlyTotal,
  getSelectedLiabilityMonthlyTotal,
} from "./protection-analysis-calculator.js";

/* ========================================
   STEP 1 — RADIO SYNC
======================================== */

export function syncRadioGroup(inputs, value) {
  inputs.forEach(function (input) {
    input.checked = input.value === value;
  });
}

/* ========================================
   STEP 2 — COVERAGE TOTAL
======================================== */

export function renderCoverageTotal({ elements, protection }) {
  if (!elements.coverageTotalValue) {
    return;
  }

  elements.coverageTotalValue.textContent = formatCurrency(
    getCoverageNeededBreakdown(protection).totalNeeded,
  );
}

/* ========================================
   STEP 2 — EXPENSE CHECKLIST
======================================== */

export function renderExpenseChecklist({ elements, protection, onToggle }) {
  const { expenseChecklist, emptyExpenseMessage } = elements;

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
          onToggle(item.key, checked);
        },
      }),
    );
  });

  const totalSelectedMonthlyExpenses =
    getSelectedExpenseMonthlyTotal(protection);

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

export function renderLiabilityChecklist({ elements, protection, onToggle }) {
  const { liabilityChecklist, emptyLiabilityMessage } = elements;

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
          onToggle(liability.id, checked);
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
