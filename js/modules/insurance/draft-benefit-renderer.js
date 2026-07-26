"use strict";

import { BENEFIT_LABELS } from "../../constants/insurance.js";

import {
  createPlanningCard,
  createPlanningCardIcon,
  createPlanningCardDetails,
  createPlanningCardActions,
  createPlanningCardButton,
} from "../../components/planning-card.js";

import {
  getBenefitDisplayName,
  getBenefitSummary,
  createBenefitMetadata,
} from "./benefit-renderer.js";

/* ========================================
   DRAFT BENEFIT LIST
======================================== */

export function renderDraftBenefitList({
  container,
  benefits = [],
  onEdit,
  onDelete,
}) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (benefits.length === 0) {
    renderEmptyBenefitMessage(container);

    return;
  }

  benefits.forEach(function (benefit) {
    container.appendChild(
      createBenefitElement(benefit, {
        onEdit,
        onDelete,
      }),
    );
  });
}

/* ========================================
   BENEFIT CARD
======================================== */

function createBenefitElement(benefit, { onEdit, onDelete }) {
  return createPlanningCard({
    itemClass: "benefit-item",

    icon: createBenefitIcon(),

    details: createBenefitDetails(benefit),

    actions: createBenefitActions(benefit, {
      onEdit,
      onDelete,
    }),
  });
}

function createBenefitIcon() {
  return createPlanningCardIcon("fa-solid fa-shield-heart");
}

function createBenefitDetails(benefit) {
  return createPlanningCardDetails({
    title: getBenefitDisplayName(benefit),

    description: getBenefitSummary(benefit),

    content: createBenefitMetadata(benefit),
  });
}

/* ========================================
   BENEFIT ACTIONS
======================================== */

function createBenefitActions(benefit, { onEdit, onDelete }) {
  const actions = createPlanningCardActions();

  if (benefit.isBasePlanBenefit) {
    return actions;
  }

  actions.append(
    createBenefitEditButton(benefit, onEdit),

    createBenefitDeleteButton(benefit, onDelete),
  );

  return actions;
}

function createBenefitEditButton(benefit, onEdit) {
  return createPlanningCardButton({
    iconClass: "fa-solid fa-pen",

    label: `Edit ${getBenefitActionLabel(benefit)}`,

    onClick() {
      if (typeof onEdit === "function") {
        onEdit(benefit.id);
      }
    },
  });
}

function createBenefitDeleteButton(benefit, onDelete) {
  return createPlanningCardButton({
    iconClass: "fa-solid fa-trash",

    variant: "delete",

    label: `Delete ${getBenefitActionLabel(benefit)}`,

    onClick() {
      if (typeof onDelete === "function") {
        onDelete(benefit.id);
      }
    },
  });
}

/* ========================================
   EMPTY STATE
======================================== */

function renderEmptyBenefitMessage(container) {
  const message = document.createElement("p");

  message.id = "emptyPolicyBenefitMessage";

  message.className = "empty-state-message";

  message.textContent = "No benefits added yet.";

  container.appendChild(message);
}

/* ========================================
   DISPLAY HELPERS
======================================== */

function getBenefitActionLabel(benefit) {
  if (benefit.isBasePlanBenefit) {
    return benefit.customName || "Long-Term Care Base Plan";
  }

  if (benefit.type === "other") {
    return benefit.customName || "Other Benefit";
  }

  return BENEFIT_LABELS[benefit.type] || "Benefit";
}
