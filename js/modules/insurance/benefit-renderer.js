"use strict";

import { formatCurrency } from "../../utils/client-utils.js";

import {
  BENEFIT_LABELS,
  HOSPITAL_CLASS_LABELS,
  PAYOUT_TYPE_LABELS,
} from "../../constants/insurance.js";

/* ========================================
   BENEFIT DISPLAY HELPERS
======================================== */

export function getBenefitAmountDescription(benefit) {
  if (benefit.type === "hospitalisation") {
    return (
      HOSPITAL_CLASS_LABELS[benefit.hospitalClass] ||
      "Hospital class not provided"
    );
  }

  const formattedAmount = formatCurrency(benefit.amount);

  switch (benefit.type) {
    case "hospital_cash":
      return `${formattedAmount} per day`;

    case "medical_reimbursement":
      return `${formattedAmount} per event`;

    case "disability_income":
    case "long_term_care_income":
    case "monthly_benefit":
      return `${formattedAmount} per month`;

    default:
      return formattedAmount;
  }
}

export function getBenefitSummary(benefit) {
  const parts = [];

  parts.push(getBenefitAmountDescription(benefit));

  if (benefit.type === "hospitalisation") {
    const riderLabel = getHospitalRiderLabel(
      benefit.riderType ||
        (benefit.hasRider === true
          ? "yes"
          : benefit.hasRider === false
            ? "no"
            : ""),
    );

    if (riderLabel) {
      parts.push(`Rider: ${riderLabel}`);
    }
  }

  if (benefit.type === "long_term_care_income") {
    if (benefit.payoutTerm === "extend_10_years") {
      parts.push("Extends total payout to 10 years");
    }

    if (benefit.payoutTerm === "lifetime") {
      parts.push("Lifetime payout");
    }

    if (benefit.payoutTerm === "limited" && benefit.payoutDuration > 0) {
      parts.push(
        `${benefit.payoutDuration} ${
          benefit.payoutDuration === 1 ? "month" : "months"
        } payout`,
      );
    }

    if (benefit.adlRequirement) {
      const adlLabel =
        benefit.adlRequirement === 1
          ? "1 ADL"
          : `${benefit.adlRequirement} ADLs`;

      parts.push(`Claim Trigger: ${adlLabel}`);
    }
  }

  if (benefit.lifeAssured) {
    parts.push(benefit.lifeAssured);
  }

  return parts.join(" · ");
}

export function createBenefitMetadata(benefit) {
  const metadata = document.createElement("div");

  metadata.className = "benefit-item-meta";

  appendMetadataItem(metadata, getBenefitDisplayName(benefit));

  if (benefit.payoutType) {
    appendMetadataItem(
      metadata,
      PAYOUT_TYPE_LABELS[benefit.payoutType] || benefit.payoutType,
    );
  }

  if (benefit.type === "hospitalisation") {
    const riderLabel = getHospitalRiderLabel(
      benefit.riderType ||
        (benefit.hasRider === true
          ? "yes"
          : benefit.hasRider === false
            ? "no"
            : ""),
    );

    if (riderLabel) {
      appendMetadataItem(metadata, `Rider: ${riderLabel}`);
    }
  }

  if (benefit.type === "long_term_care_income") {
    if (benefit.isBasePlanBenefit) {
      appendMetadataItem(metadata, "Base Plan");
    }

    if (benefit.payoutTerm === "extend_10_years") {
      appendMetadataItem(metadata, "Extends Total Payout to 10 Years");
    }

    if (benefit.payoutTerm === "lifetime") {
      appendMetadataItem(metadata, "Lifetime Payout");
    }

    if (benefit.payoutTerm === "limited" && benefit.payoutDuration > 0) {
      appendMetadataItem(
        metadata,
        `${benefit.payoutDuration} ${
          benefit.payoutDuration === 1 ? "Month" : "Months"
        } Payout`,
      );
    }
  }

  if (benefit.type === "long_term_care_income" && benefit.adlRequirement) {
    const adlLabel =
      benefit.adlRequirement === 1 ? "1 ADL" : `${benefit.adlRequirement} ADLs`;

    appendMetadataItem(metadata, `Claim Trigger: ${adlLabel}`);
  }

  if (benefit.notes) {
    appendMetadataItem(metadata, benefit.notes);
  }

  return metadata;
}

export function getBenefitDisplayName(benefit) {
  if (benefit.isBasePlanBenefit) {
    return benefit.customName || "Long-Term Care Base Plan";
  }

  if (benefit.type === "other") {
    return benefit.customName || "Other Benefit";
  }

  return BENEFIT_LABELS[benefit.type] || "Benefit";
}

/* ========================================
   PRIVATE HELPERS
======================================== */

function getHospitalRiderLabel(riderType) {
  switch (riderType) {
    case "panel_only":
      return "Yes (Panel Only)";

    case "yes":
      return "Yes";

    case "no":
      return "No";

    default:
      return "";
  }
}

function appendMetadataItem(container, text) {
  const item = document.createElement("span");

  item.textContent = text;

  container.appendChild(item);
}
