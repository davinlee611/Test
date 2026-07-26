"use strict";

/* ========================================
   BENEFIT VALIDATION
======================================== */

export function validateBenefit(formData, { longTermCareBasePlan = "" } = {}) {
  if (!formData.type) {
    return "Select a benefit type.";
  }

  if (!formData.lifeAssured) {
    return "Enter the life assured.";
  }

  if (formData.type === "other" && !formData.customName) {
    return "Enter the benefit name.";
  }

  if (formData.type === "hospitalisation") {
    if (!formData.hospitalClass) {
      return "Select the hospital class.";
    }

    if (!formData.riderType) {
      return "Select the rider status.";
    }

    return "";
  }

  if (formData.type === "long_term_care_income") {
    const validationMessage = validateLongTermCareBenefit(
      formData,
      longTermCareBasePlan,
    );

    if (validationMessage) {
      return validationMessage;
    }
  }

  if (formData.amount <= 0) {
    return getBenefitAmountValidationMessage(formData.type);
  }

  const requiresPayoutType =
    formData.type === "critical_illness" ||
    formData.type === "early_critical_illness";

  if (requiresPayoutType && !formData.payoutType) {
    return "Select whether the payout is " + "accelerated or additional.";
  }

  return "";
}

/* ========================================
   LONG-TERM CARE VALIDATION
======================================== */

function validateLongTermCareBenefit(formData, basePlan) {
  if (!formData.payoutTerm) {
    return "Select the payout term.";
  }

  const isElderShield =
    basePlan === "eldershield_300" || basePlan === "eldershield_400";

  if (
    isElderShield &&
    !["extend_10_years", "lifetime"].includes(formData.payoutTerm)
  ) {
    return "Select either Extend Total " + "Payout to 10 Years or Lifetime.";
  }

  if (basePlan === "careshield_life" && formData.payoutTerm !== "lifetime") {
    return "CareShield Life supplements " + "must have a lifetime payout.";
  }

  if (formData.payoutTerm === "limited" && formData.payoutDuration <= 0) {
    return "Enter the payout duration " + "in months.";
  }

  if (!formData.adlRequirement) {
    return "Select the Claim Trigger " + "(ADLs).";
  }

  return "";
}

/* ========================================
   AMOUNT MESSAGE
======================================== */

function getBenefitAmountValidationMessage(benefitType) {
  switch (benefitType) {
    case "hospital_cash":
      return "Enter the daily cash benefit.";

    case "medical_reimbursement":
      return "Enter the medical " + "reimbursement amount per event.";

    case "disability_income":
    case "long_term_care_income":
    case "monthly_benefit":
      return "Enter the monthly benefit.";

    default:
      return "Enter a coverage amount " + "greater than zero.";
  }
}
