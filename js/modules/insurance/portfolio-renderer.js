"use strict";

import {
  getPolicyValidationSummary,
  getPortfolioValidationSummary,
} from "./policy-validation.js";

import { createPolicyDetails } from "./policy-renderer.js";

import {
  createPlanningCard,
  createPlanningCardIcon,
  createPlanningCardActions,
  createPlanningCardButton,
  renderPlanningEmptyState,
} from "../../components/planning-card.js";

/* ========================================
   PORTFOLIO RENDERING
======================================== */

export function renderInsurancePortfolioView({
  elements,
  policies,
  validationContext,
  onEditPolicy,
  onDeletePolicy,
}) {
  renderPortfolioValidationSummary({
    elements,
    policies,
    validationContext,
  });

  renderPolicyList({
    elements,
    policies,
    validationContext,
    onEditPolicy,
    onDeletePolicy,
  });
}

/* ========================================
   PORTFOLIO VALIDATION SUMMARY
======================================== */

function renderPortfolioValidationSummary({
  elements,
  policies,
  validationContext,
}) {
  if (!elements.portfolioValidationSummary) {
    return;
  }

  if (policies.length === 0) {
    elements.portfolioValidationSummary.hidden = true;

    return;
  }

  const summary = getPortfolioValidationSummary(policies, validationContext);

  elements.portfolioErrorCount.textContent = summary.errorCount;

  elements.portfolioReviewCount.textContent = summary.reviewCount;

  elements.portfolioPassCount.textContent = summary.passCount;

  elements.portfolioErrorButton.disabled = summary.errorCount === 0;

  elements.portfolioReviewButton.disabled = summary.reviewCount === 0;

  elements.portfolioValidationSummary.hidden = false;
}

/* ========================================
   POLICY LIST
======================================== */

function renderPolicyList({
  elements,
  policies,
  validationContext,
  onEditPolicy,
  onDeletePolicy,
}) {
  if (!elements.policyList) {
    return;
  }

  elements.policyList.innerHTML = "";

  if (policies.length === 0) {
    renderPlanningEmptyState(
      elements.policyList,
      "No policies added yet.",
      elements.emptyPolicyMessage,
    );

    return;
  }

  policies.forEach(function (policy) {
    const policyElement = createPolicyElement({
      policy,
      policies,
      validationContext,
      onEditPolicy,
      onDeletePolicy,
    });

    elements.policyList.appendChild(policyElement);
  });
}

/* ========================================
   POLICY CARD
======================================== */

function createPolicyElement({
  policy,
  policies,
  validationContext,
  onEditPolicy,
  onDeletePolicy,
}) {
  const validationSummary = getPolicyValidationSummary(policy, {
    ...validationContext,

    allPolicies: policies,
  });

  const policyElement = createPlanningCard({
    itemClass: [
      "policy-item",

      `policy-item--${validationSummary.highestSeverity}`,
    ].join(" "),

    icon: createPolicyIcon(),

    details: createPolicyDetails(policy, validationSummary),

    actions: createPolicyActions({
      policy,
      onEditPolicy,
      onDeletePolicy,
    }),
  });

  policyElement.dataset.validationSeverity = validationSummary.highestSeverity;

  policyElement.dataset.policyId = policy.id;

  return policyElement;
}

function createPolicyIcon() {
  return createPlanningCardIcon("fa-solid fa-shield-halved");
}

/* ========================================
   POLICY ACTIONS
======================================== */

function createPolicyActions({ policy, onEditPolicy, onDeletePolicy }) {
  const actions = createPlanningCardActions();

  actions.append(
    createPolicyEditButton({
      policy,
      onEditPolicy,
    }),

    createPolicyDeleteButton({
      policy,
      onDeletePolicy,
    }),
  );

  return actions;
}

function createPolicyEditButton({ policy, onEditPolicy }) {
  return createPlanningCardButton({
    iconClass: "fa-solid fa-pen",

    label: `Edit ${policy.policyName || "policy"}`,

    onClick() {
      onEditPolicy(policy.id);
    },
  });
}

function createPolicyDeleteButton({ policy, onDeletePolicy }) {
  return createPlanningCardButton({
    iconClass: "fa-solid fa-trash",

    variant: "delete",

    label: `Delete ${policy.policyName || "policy"}`,

    onClick() {
      onDeletePolicy(policy);
    },
  });
}
