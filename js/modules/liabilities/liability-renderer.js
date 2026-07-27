"use strict";

import {
  createPlanningCard,
  createPlanningCardActions,
  createPlanningCardButton,
  createPlanningCardDetails,
  createPlanningCardIcon,
  renderPlanningEmptyState,
} from "../../components/planning-card.js";

import { formatCurrency } from "../../utils/client-utils.js";

import {
  calculateTotalLiabilities,
  getLiabilityMonthlyCashRepayment,
  getLiabilityMonthlyCpfPayment,
} from "./liability-calculator.js";

import {
  getLiabilityIconClass,
  getLiabilityTypeLabel,
} from "./liability-config.js";

/* ========================================
   LIABILITY LIST
======================================== */

export function renderLiabilityList({
  list,
  emptyMessage,
  totalElement,
  liabilities,
  onEditLiability,
  onDeleteLiability,
}) {
  const safeLiabilities = Array.isArray(liabilities) ? liabilities : [];

  updateLiabilityTotal(totalElement, safeLiabilities);

  if (!list) {
    return;
  }

  list.innerHTML = "";

  if (safeLiabilities.length === 0) {
    renderPlanningEmptyState(list, "No liabilities added yet.", emptyMessage);

    return;
  }

  safeLiabilities.forEach(function (liability) {
    list.appendChild(
      createLiabilityItem({
        liability,
        onEditLiability,
        onDeleteLiability,
      }),
    );
  });
}

function createLiabilityItem({
  liability,
  onEditLiability,
  onDeleteLiability,
}) {
  return createPlanningCard({
    itemClass: "liability-item",

    icon: createPlanningCardIcon(getLiabilityIconClass(liability.type)),

    details: createLiabilityDetails(liability),

    actions: createLiabilityActions({
      liability,
      onEditLiability,
      onDeleteLiability,
    }),
  });
}

function createLiabilityDetails(liability) {
  return createPlanningCardDetails({
    title: liability.name || "Unnamed Liability",

    description: createLiabilityDescription(liability),
  });
}

function createLiabilityDescription(liability) {
  const monthlyCpfPayment = getLiabilityMonthlyCpfPayment(liability);

  const monthlyCashRepayment = getLiabilityMonthlyCashRepayment(liability);

  const parts = [
    getLiabilityTypeLabel(liability.type),

    `${formatCurrency(liability.outstandingBalance)} outstanding`,
  ];

  if (Number(liability.monthlyRepayment) > 0) {
    parts.push(`${formatCurrency(liability.monthlyRepayment)} monthly`);
  }

  if (Number(liability.interestRate) >= 0) {
    parts.push(`${Number(liability.interestRate) || 0}% interest`);
  }

  if (liability.repaymentEndDate) {
    parts.push(`repay by ${formatRepaymentDate(liability.repaymentEndDate)}`);
  }

  if (monthlyCpfPayment > 0) {
    parts.push(
      `${formatCurrency(monthlyCpfPayment)} CPF`,

      `${formatCurrency(monthlyCashRepayment)} cash`,
    );
  }

  return parts.join(" · ");
}

function createLiabilityActions({
  liability,
  onEditLiability,
  onDeleteLiability,
}) {
  const actions = createPlanningCardActions();

  actions.append(
    createPlanningCardButton({
      iconClass: "fa-solid fa-pen",

      label: `Edit ${liability.name}`,

      onClick() {
        onEditLiability(liability.id);
      },
    }),

    createPlanningCardButton({
      iconClass: "fa-solid fa-trash",

      variant: "delete",

      label: `Delete ${liability.name}`,

      onClick() {
        onDeleteLiability(liability.id);
      },
    }),
  );

  return actions;
}

function updateLiabilityTotal(totalElement, liabilities) {
  if (!totalElement) {
    return;
  }

  totalElement.textContent = formatCurrency(
    calculateTotalLiabilities(liabilities),
  );
}

function formatRepaymentDate(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value.slice(0, 7)
    : value;

  if (!/^\d{4}-\d{2}$/.test(normalizedValue)) {
    return value;
  }

  const [year, month] = normalizedValue.split("-").map(Number);

  if (month < 1 || month > 12) {
    return value;
  }

  return new Intl.DateTimeFormat("en-SG", {
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}