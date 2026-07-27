"use strict";

/* ========================================
   POLICY FORM VALIDATION
======================================== */

export function validatePolicyDraft({
  formData,

  insurerSelection,

  draftBenefits,

  validationItems,
}) {
  if (!formData.policyName) {
    return "Enter the policy name.";
  }

  if (!formData.policyType) {
    return "Select a policy type.";
  }

  if (
    formData.policyType === "long_term_care" &&
    !formData.longTermCareBasePlan
  ) {
    return "Select the Long-Term Care base plan.";
  }

  if (!formData.lifeAssured) {
    return "Enter the life assured.";
  }

  if (!insurerSelection) {
    return "Select an insurer.";
  }

  if (insurerSelection === "other" && !formData.insurer) {
    return "Enter the insurer name.";
  }

  if (!formData.status) {
    return "Select the policy status.";
  }

  if (formData.status === "active") {
    if (formData.premiumAmount <= 0) {
      return "Enter the policy premium.";
    }

    if (!formData.premiumFrequency) {
      return "Select the premium frequency.";
    }
  }

  if (!Array.isArray(draftBenefits) || draftBenefits.length === 0) {
    return "Add at least one benefit to the policy.";
  }

  const firstError = validationItems.find(function (item) {
    return item.severity === "error" && !item.valid;
  });

  if (firstError) {
    return firstError.message;
  }

  return "";
}
