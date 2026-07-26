"use strict";

import { formatCurrency } from "../../utils/client-utils.js";

import {
  LONG_TERM_CARE_BASE_PLANS,
  POLICY_STATUS_LABELS,
  POLICY_TYPE_LABELS,
  PREMIUM_FREQUENCY_LABELS,
} from "../../constants/insurance.js";

import { createPlanningCardDetails } from "../../components/planning-card.js";

/* ========================================
   POLICY CARD DETAILS
======================================== */

export function createPolicyDetails(policy, validationSummary) {
  const policyName = policy.policyName || "Unnamed Policy";

  const policyType = POLICY_TYPE_LABELS[policy.policyType] || "Other";

  const insurer = policy.insurer || "Insurer not specified";

  return createPlanningCardDetails({
    title: policyName,

    description: `${insurer} · ${policyType}`,

    content: createPolicyCardContent(policy, validationSummary),
  });
}

function createPolicyCardContent(policy, validationSummary) {
  const content = document.createElement("div");

  content.className = "policy-card-content";

  content.appendChild(createPolicyMetadata(policy));

  content.appendChild(createPolicyValidationPreview(validationSummary));

  return content;
}

/* ========================================
   POLICY VALIDATION PREVIEW
======================================== */

function createPolicyValidationPreview(validationSummary) {
  const container = document.createElement("div");

  container.className = [
    "policy-card-validation",
    `policy-card-validation--${validationSummary.highestSeverity}`,
  ].join(" ");

  const status = document.createElement("div");

  status.className = "policy-card-validation__status";

  const icon = document.createElement("i");

  icon.setAttribute("aria-hidden", "true");

  const label = document.createElement("strong");

  if (validationSummary.errors.length > 0) {
    icon.className = "fa-solid fa-circle-exclamation";

    label.textContent =
      validationSummary.errors.length === 1
        ? "1 issue requires attention"
        : `${validationSummary.errors.length} issues require attention`;
  } else if (validationSummary.reviews.length > 0) {
    icon.className = "fa-solid fa-triangle-exclamation";

    label.textContent =
      validationSummary.reviews.length === 1
        ? "1 item requires review"
        : `${validationSummary.reviews.length} items require review`;
  } else {
    icon.className = "fa-solid fa-circle-check";

    label.textContent = "No issues detected";
  }

  status.append(icon, label);

  container.appendChild(status);

  const messages = [...validationSummary.errors, ...validationSummary.reviews];

  messages.slice(0, 2).forEach(function (item) {
    const message = document.createElement("p");

    message.className = "policy-card-validation__message";

    message.textContent = item.message;

    container.appendChild(message);
  });

  if (messages.length > 2) {
    const remainingMessage = document.createElement("p");

    remainingMessage.className = "policy-card-validation__remaining";

    const remainingCount = messages.length - 2;

    remainingMessage.textContent =
      `+${remainingCount} more ` + `item${remainingCount === 1 ? "" : "s"}`;

    container.appendChild(remainingMessage);
  }

  return container;
}

/* ========================================
   POLICY METADATA
======================================== */

function createPolicyMetadata(policy) {
  const metadata = document.createElement("div");

  metadata.className = "benefit-item-meta";

  appendMetadataItem(
    metadata,
    POLICY_STATUS_LABELS[policy.status] || "Status not specified",
  );

  appendMetadataItem(metadata, getPremiumDescription(policy.premium));

  if (policy.policyType === "long_term_care" && policy.longTermCareBasePlan) {
    const basePlanLabel = getLongTermCareBasePlanLabel(
      policy.longTermCareBasePlan,
    );

    if (basePlanLabel) {
      appendMetadataItem(metadata, `Base Plan: ${basePlanLabel}`);
    }
  }

  const benefitCount = Array.isArray(policy.benefits)
    ? policy.benefits.length
    : 0;

  appendMetadataItem(
    metadata,
    benefitCount === 1 ? "1 benefit" : `${benefitCount} benefits`,
  );

  if (policy.policyNumber) {
    appendMetadataItem(metadata, `Policy No: ${policy.policyNumber}`);
  }

  return metadata;
}

/* ========================================
   DISPLAY HELPERS
======================================== */

function getPremiumDescription(premium) {
  if (!premium) {
    return "Premium not provided";
  }

  if (premium.amount <= 0) {
    return "Paid-up";
  }

  const frequencyLabel =
    PREMIUM_FREQUENCY_LABELS[premium.frequency] || "Premium";

  return [formatCurrency(premium.amount), frequencyLabel].join(" · ");
}

function getLongTermCareBasePlanLabel(basePlanValue) {
  if (basePlanValue === "supplement_only") {
    return "Supplement Only / Other Base Plan";
  }

  return LONG_TERM_CARE_BASE_PLANS[basePlanValue]?.name || "";
}

function appendMetadataItem(container, text) {
  const item = document.createElement("span");

  item.textContent = text;

  container.appendChild(item);
}
