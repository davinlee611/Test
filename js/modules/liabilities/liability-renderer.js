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

import { calculateTotalLiabilities } from "./liability-calculator.js";

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
    renderPlanningEmptyState(
      list,

      "No liabilities added yet.",

      emptyMessage,
    );

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

/* ========================================
   LIABILITY ITEM
======================================== */

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

/* ========================================
   LIABILITY DETAILS
======================================== */

function createLiabilityDetails(liability) {
  return createPlanningCardDetails({
    title: liability.name || "Unnamed Liability",

    description: createLiabilityDescription(liability),
  });
}

function createLiabilityDescription(liability) {
  const parts = [
    getLiabilityTypeLabel(liability.type),

    `${formatCurrency(liability.outstandingBalance)} outstanding`,
  ];

  if (Number(liability.monthlyRepayment) > 0) {
    parts.push(`${formatCurrency(liability.monthlyRepayment)} monthly`);
  }

  if (Number(liability.interestRate) > 0) {
    parts.push(`${liability.interestRate}% interest`);
  }

  return parts.join(" · ");
}

/* ========================================
   LIABILITY ACTIONS
======================================== */

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

/* ========================================
   LIABILITY TOTAL
======================================== */

function updateLiabilityTotal(totalElement, liabilities) {
  if (!totalElement) {
    return;
  }

  const total = calculateTotalLiabilities(liabilities);

  totalElement.textContent = formatCurrency(total);
}