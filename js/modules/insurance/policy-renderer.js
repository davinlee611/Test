"use strict";

import { formatCurrency } from "../../utils/client-utils.js";

import {
  BENEFIT_LABELS,
  LONG_TERM_CARE_BASE_PLANS,
  PAYOUT_TYPE_LABELS,
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

    description: createPolicyDescription({
      insurer,
      policyType,
      lifeAssured: policy.lifeAssured,
    }),

    content: createPolicyCardContent(policy, validationSummary),
  });
}

function createPolicyCardContent(policy, validationSummary) {
  const content = document.createElement("div");

  content.className = [
    "policy-card-content",
    getPolicyTypeClass(policy.policyType),
  ]
    .filter(Boolean)
    .join(" ");

  content.append(
    createPolicyMetadata(policy),

    createPolicyValidationPreview(validationSummary),

    createPolicyPayoutSummary(policy),

    createPolicyCoverageSummary(policy),
  );

  return content;
}

function createPolicyPayoutSummary(policy) {
  const section = document.createElement("section");

  section.className = "policy-coverage-summary";

  const heading = document.createElement("h5");

  heading.className = "policy-coverage-summary__title";

  const row = document.createElement("div");

  row.className = "policy-coverage-summary__row";

  const detail = document.createElement("span");

  const amount = document.createElement("strong");

  if (policy.policyType === "endowment") {
    const endowment = policy.endowment || {};

    const total =
      (Number(endowment.guaranteedMaturityAmount) || 0) +
      (Number(endowment.projectedNonGuaranteedAmount) || 0);

    if (!endowment.maturityDate && total <= 0) {
      section.hidden = true;

      return section;
    }

    heading.textContent = "Maturity Payout";

    detail.textContent = formatYearMonth(endowment.maturityDate);

    amount.textContent = formatCurrency(total);
  } else if (policy.policyType === "ilp_accumulation") {
    const accumulation = policy.accumulation || {};

    const currentValue = Number(accumulation.currentPolicyValue) || 0;

    const projectedValue = Number(accumulation.projectedPolicyValue) || 0;

    const projectedAge = Number(accumulation.projectedAtAge) || 0;

    if (currentValue <= 0 && projectedValue <= 0) {
      section.hidden = true;

      return section;
    }

    heading.textContent = "Accumulation Value";

    if (projectedValue > 0) {
      detail.textContent =
        projectedAge > 0
          ? `Projected at age ${projectedAge}`
          : "Projected value";

      amount.textContent = formatCurrency(projectedValue);
    } else {
      detail.textContent = accumulation.valueAsOf
        ? `Current value · ${formatYearMonth(accumulation.valueAsOf)}`
        : "Current policy value";

      amount.textContent = formatCurrency(currentValue);
    }
  } else if (policy.policyType === "retirement") {
    const retirement = policy.retirement || {};

    if (Number(retirement.monthlyIncome) <= 0) {
      section.hidden = true;

      return section;
    }

    const duration =
      retirement.payoutTerm === "lifetime"
        ? "Lifetime"
        : `${Number(retirement.payoutDurationMonths) / 12} years`;

    heading.textContent = "Retirement Payout";

    detail.textContent = `From age ${retirement.payoutStartAge} · ${duration}`;

    amount.textContent = `${formatCurrency(retirement.monthlyIncome)} / month`;
  } else {
    section.hidden = true;

    return section;
  }

  row.append(detail, amount);

  section.append(heading, row);

  return section;
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
   COVERAGE SUMMARY
======================================== */

function createPolicyCoverageSummary(policy) {
  const section = document.createElement("section");

  section.className = "policy-coverage-summary";

  const heading = document.createElement("h5");

  heading.className = "policy-coverage-summary__title";

  heading.textContent = "Coverage Summary";

  section.appendChild(heading);

  const benefits = Array.isArray(policy.benefits) ? policy.benefits : [];

  if (benefits.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.className = "policy-coverage-summary__empty";

    emptyMessage.textContent = "No benefits added.";

    section.appendChild(emptyMessage);

    return section;
  }

  const list = document.createElement("div");

  list.className = "policy-coverage-summary__list";

  benefits.forEach(function (benefit) {
    list.appendChild(createCoverageSummaryRow(benefit, policy));
  });

  section.appendChild(list);

  return section;
}

function createCoverageSummaryRow(benefit, policy) {
  const row = document.createElement("div");

  row.className = [
    "policy-coverage-summary__row",

    benefit.isSuggested ? "policy-coverage-summary__row--suggested" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const information = document.createElement("div");

  information.className = "policy-coverage-summary__information";

  const labelRow = document.createElement("div");

  labelRow.className = "policy-coverage-summary__label-row";

  const label = document.createElement("span");

  label.className = "policy-coverage-summary__label";

  label.textContent = getBenefitDisplayName(benefit);

  labelRow.appendChild(label);

  if (benefit.isSuggested) {
    const suggestedBadge = document.createElement("span");

    suggestedBadge.className = "policy-coverage-summary__suggested-badge";

    suggestedBadge.textContent = "Suggested";

    labelRow.appendChild(suggestedBadge);
  }

  information.appendChild(labelRow);

  const detail = getBenefitDetail(benefit, policy);

  if (detail) {
    const detailElement = document.createElement("span");

    detailElement.className = "policy-coverage-summary__detail";

    detailElement.textContent = detail;

    information.appendChild(detailElement);
  }

  row.appendChild(information);

  const amount = getBenefitAmount(benefit);

  if (amount) {
    const amountElement = document.createElement("strong");

    amountElement.className = "policy-coverage-summary__amount";

    amountElement.textContent = amount;

    row.appendChild(amountElement);
  }

  return row;
}

/* ========================================
   BENEFIT DISPLAY
======================================== */

function getBenefitDisplayName(benefit) {
  if (benefit.isBasePlanBenefit) {
    return benefit.customName || "Long-Term Care Base Plan";
  }

  if (benefit.type === "other") {
    return benefit.customName || "Other Benefit";
  }

  return BENEFIT_LABELS[benefit.type] || "Benefit";
}

function getBenefitAmount(benefit) {
  /*
   * Hospitalisation is intentionally
   * displayed without hospital class,
   * rider information or a monetary value.
   */
  if (benefit.type === "hospitalisation") {
    return "";
  }

  const amount = Number(benefit.amount) || 0;

  if (amount <= 0) {
    return "";
  }

  const formattedAmount = formatCurrency(amount);

  switch (benefit.type) {
    case "hospital_cash":
      return `${formattedAmount} / day`;

    case "disability_income":
    case "long_term_care_income":
      return `${formattedAmount} / month`;

    case "medical_reimbursement":
      return `${formattedAmount} / event`;

    default:
      return formattedAmount;
  }
}

function getBenefitDetail(benefit, policy) {
  const details = [];

  const payoutTypeLabel = PAYOUT_TYPE_LABELS[benefit.payoutType];

  if (payoutTypeLabel) {
    details.push(payoutTypeLabel);
  }

  if (benefit.type === "long_term_care_income") {
    appendLongTermCareDetails(details, benefit);
  }

  /*
   * Show the life assured only when it
   * differs from the policy-level
   * life assured.
   */
  if (benefit.lifeAssured && benefit.lifeAssured !== policy.lifeAssured) {
    details.push(`Life Assured: ${benefit.lifeAssured}`);
  }

  return details.join(" · ");
}

function appendLongTermCareDetails(details, benefit) {
  if (benefit.payoutTerm === "extend_10_years") {
    details.push("10-year total payout");
  }

  if (benefit.payoutTerm === "lifetime") {
    details.push("Lifetime payout");
  }

  if (benefit.payoutTerm === "limited" && Number(benefit.payoutDuration) > 0) {
    const duration = Number(benefit.payoutDuration);

    details.push(`${duration} ${duration === 1 ? "month" : "months"} payout`);
  }

  if (Number(benefit.adlRequirement) > 0) {
    const adlRequirement = Number(benefit.adlRequirement);

    details.push(adlRequirement === 1 ? "1 ADL" : `${adlRequirement} ADLs`);
  }
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

  if (policy.status === "paid_up") {
    appendMetadataItem(metadata, "No further premiums");
  } else if (policy.policyType === "hospitalisation") {
    appendMetadataItem(
      metadata,

      `Base: ${getPremiumDescription(policy.premium)}`,
    );

    const rider = policy.hospitalisation?.rider;

    if (rider?.included === true && Number(rider.annualPremium) > 0) {
      appendMetadataItem(
        metadata,

        [`Rider: ${formatCurrency(rider.annualPremium)}`, "Annual"].join(" · "),
      );
    }
  } else {
    appendMetadataItem(
      metadata,

      getPremiumDescription(policy.premium),
    );
  }

  if (policy.status === "limited_pay" && policy.premiumPaymentEndDate) {
    appendMetadataItem(
      metadata,

      `Premiums end ${formatYearMonth(policy.premiumPaymentEndDate)}`,
    );
  }

  if (policy.policyType === "term" && policy.coverageEndDate) {
    appendMetadataItem(
      metadata,

      `Coverage ends ${formatYearMonth(policy.coverageEndDate)}`,
    );
  }

  if (
    policy.policyType === "disability_income" &&
    Number(policy.coverageEndAge) >= 60
  ) {
    appendMetadataItem(
      metadata,

      `Coverage ends at age ${policy.coverageEndAge}`,
    );
  }

  if (
    policy.policyType === "whole_life" &&
    policy.status === "active" &&
    policy.premiumPaymentEndDate
  ) {
    appendMetadataItem(
      metadata,

      `Premiums end ${formatYearMonth(policy.premiumPaymentEndDate)}`,
    );
  }

  if (policy.policyType === "long_term_care" && policy.longTermCareBasePlan) {
    const basePlanLabel = getLongTermCareBasePlanLabel(
      policy.longTermCareBasePlan,
    );

    if (basePlanLabel) {
      appendMetadataItem(
        metadata,

        `Base Plan: ${basePlanLabel}`,
      );
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
    appendMetadataItem(
      metadata,

      `Policy No: ${policy.policyNumber}`,
    );
  }

  return metadata;
}

/* ========================================
   POLICY DESCRIPTION
======================================== */

function createPolicyDescription({ insurer, policyType, lifeAssured }) {
  const descriptionParts = [insurer, policyType];

  if (lifeAssured) {
    descriptionParts.push(`Life Assured: ${lifeAssured}`);
  }

  return descriptionParts.join(" · ");
}

/* ========================================
   POLICY TYPE CLASS
======================================== */

function getPolicyTypeClass(policyType) {
  const policyTypeClasses = {
    hospitalisation: "policy-card-content--hospitalisation",

    whole_life: "policy-card-content--life",

    term: "policy-card-content--critical-illness",

    disability_income: "policy-card-content--disability",

    personal_accident: "policy-card-content--accident",

    ilp_protection: "policy-card-content--investment",

    ilp_accumulation: "policy-card-content--investment",

    endowment: "policy-card-content--endowment",

    long_term_care: "policy-card-content--long-term-care",
  };

  return policyTypeClasses[policyType] || "policy-card-content--other";
}

/* ========================================
   DISPLAY HELPERS
======================================== */

function getPremiumDescription(premium) {
  if (!premium) {
    return "Premium not provided";
  }

  if (Number(premium.amount) <= 0) {
    return "Paid-up";
  }

  const frequencyLabel =
    PREMIUM_FREQUENCY_LABELS[premium.frequency] || "Premium";

  return [formatCurrency(premium.amount), frequencyLabel].join(" · ");
}

function getLongTermCareBasePlanLabel(basePlanValue) {
  if (basePlanValue === "supplement_only") {
    return "Supplement Only / " + "Other Base Plan";
  }

  return LONG_TERM_CARE_BASE_PLANS[basePlanValue]?.name || "";
}

function appendMetadataItem(container, text) {
  const item = document.createElement("span");

  item.textContent = text;

  container.appendChild(item);
}

function formatYearMonth(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(value || "");

  if (!match) {
    return "Date not provided";
  }

  return new Intl.DateTimeFormat("en-SG", {
    month: "short",

    year: "numeric",
  }).format(
    new Date(
      Number(match[1]),

      Number(match[2]) - 1,

      1,
    ),
  );
}
