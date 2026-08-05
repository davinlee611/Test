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

  if (formData.policyType === "hospitalisation") {
    const hospitalisation = formData.hospitalisation;

    if (!hospitalisation?.wardType) {
      return "Select the hospitalisation ward type.";
    }

    if (formData.premiumAmount <= 0) {
      return "Enter the annual hospitalisation premium.";
    }

    if (hospitalisation.rider?.included) {
      if (!hospitalisation.rider.type) {
        return "Select the hospitalisation rider type.";
      }

      if (hospitalisation.rider.annualPremium <= 0) {
        return "Enter the annual rider premium.";
      }
    }

    if (
      hospitalisation.premiumPayment.medisaveAmount > formData.premiumAmount
    ) {
      return (
        "The MediSave amount cannot exceed " +
        "the annual base hospitalisation premium."
      );
    }
  }

  if (
    formData.policyType === "hospital_cash" &&
    !draftBenefits.some(function (benefit) {
      return benefit.type === "hospital_cash";
    })
  ) {
    return "Add the Hospital Cash benefit.";
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

  if (["active", "limited_pay"].includes(formData.status)) {
    if (formData.premiumAmount <= 0) {
      return "Enter the policy premium.";
    }

    if (!formData.premiumFrequency) {
      return "Select the premium frequency.";
    }
  }

  if (
    formData.status === "limited_pay" &&
    !/^\d{4}-\d{2}$/.test(formData.premiumPaymentEndDate || "")
  ) {
    return "Select the premium payment end date.";
  }

  /*
   * Whole Life regular-pay may optionally
   * include a premium payment end date.
   */
  if (
    formData.policyType === "whole_life" &&
    formData.premiumPaymentEndDate &&
    !/^\d{4}-\d{2}$/.test(formData.premiumPaymentEndDate)
  ) {
    return "Select a valid premium payment " + "end date.";
  }

  /*
   * Term Life and Critical Illness share
   * the same term-based coverage model.
   */
  if (formData.policyType === "term") {
    if (!/^\d{4}-\d{2}$/.test(formData.coverageEndDate || "")) {
      return "Select the Term Life / Critical " + "Illness coverage end date.";
    }

    if (
      formData.premiumPaymentEndDate &&
      formData.premiumPaymentEndDate > formData.coverageEndDate
    ) {
      return (
        "The premium payment end date " +
        "cannot be after the coverage " +
        "end date."
      );
    }
  }

  /*
   * Disability Income coverage normally
   * ends between ages 60 and 70.
   */
  if (formData.policyType === "disability_income") {
    if (
      !Number.isInteger(formData.coverageEndAge) ||
      formData.coverageEndAge < 60 ||
      formData.coverageEndAge > 70
    ) {
      return "Enter a Disability Income " + "coverage end age from 60 to 70.";
    }
  }

  if (formData.policyType === "endowment") {
    if (!/^\d{4}-\d{2}$/.test(formData.endowment?.maturityDate || "")) {
      return "Select the endowment maturity date.";
    }

    if (formData.endowment.guaranteedMaturityAmount <= 0) {
      return "Enter the guaranteed maturity amount.";
    }
  }

  if (formData.policyType === "ilp_accumulation") {
    const accumulation = formData.accumulation || {};

    const hasCurrentValue = accumulation.currentPolicyValue > 0;

    const hasValueDate = Boolean(accumulation.valueAsOf);

    const hasProjectedValue = accumulation.projectedPolicyValue > 0;

    const hasProjectedAge = accumulation.projectedAtAge > 0;

    if (hasCurrentValue && !hasValueDate) {
      return "Select the month for the current " + "investment policy value.";
    }

    if (hasValueDate && !hasCurrentValue) {
      return (
        "Enter the current investment policy " +
        "value or clear the value date."
      );
    }

    if (hasValueDate) {
      const valueDate = new Date(`${accumulation.valueAsOf}-01T00:00:00`);

      const today = new Date();

      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      if (Number.isNaN(valueDate.getTime()) || valueDate > currentMonth) {
        return "The investment policy value date " + "cannot be in the future.";
      }
    }

    if (
      hasProjectedValue &&
      (!Number.isInteger(accumulation.projectedAtAge) ||
        accumulation.projectedAtAge < 1 ||
        accumulation.projectedAtAge > 120)
    ) {
      return (
        "Enter the age corresponding to the " +
        "projected investment policy value."
      );
    }

    if (hasProjectedAge && !hasProjectedValue) {
      return (
        "Enter the projected investment policy " +
        "value or clear the projected age."
      );
    }
  }

  if (formData.policyType === "retirement") {
    const retirement = formData.retirement;

    if (retirement?.payoutStartAge <= 0) {
      return "Enter the retirement payout start age.";
    }

    if (retirement?.monthlyIncome <= 0) {
      return "Enter the monthly retirement income.";
    }

    if (!retirement?.payoutTerm) {
      return "Select the retirement payout term.";
    }

    if (
      retirement.payoutTerm === "limited" &&
      retirement.payoutDurationMonths <= 0
    ) {
      return "Enter the retirement payout duration.";
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
