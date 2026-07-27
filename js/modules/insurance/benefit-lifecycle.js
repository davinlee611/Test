"use strict";

/* ========================================
   BENEFIT SOURCE
======================================== */

export const BENEFIT_SOURCE = Object.freeze({
  USER_ADDED: "user-added",

  SUGGESTED: "suggested",

  BASE_PLAN: "base-plan",
});

/* ========================================
   BENEFIT STATUS
======================================== */

export const BENEFIT_STATUS = Object.freeze({
  NEW: "new",

  EXISTING: "existing",
});

/* ========================================
   NORMALISATION
======================================== */

export function normalizeBenefitLifecycle(
  benefit,
  { status = benefit?.status || BENEFIT_STATUS.NEW } = {},
) {
  const source = getBenefitSource(benefit);

  return {
    ...benefit,

    source,

    status,

    hasUserInput: benefit?.hasUserInput === true,

    /*
     * Keep the old flags temporarily so
     * existing renderers and validations
     * continue to work.
     */
    isSuggested: source === BENEFIT_SOURCE.SUGGESTED,

    isBasePlanBenefit: source === BENEFIT_SOURCE.BASE_PLAN,
  };
}

/* ========================================
   EXISTING BENEFITS
======================================== */

export function markBenefitsAsExisting(benefits) {
  if (!Array.isArray(benefits)) {
    return [];
  }

  return benefits.map(function (benefit) {
    return normalizeBenefitLifecycle(benefit, {
      status: BENEFIT_STATUS.EXISTING,
    });
  });
}

/* ========================================
   SOURCE INFERENCE
======================================== */

function getBenefitSource(benefit) {
  if (Object.values(BENEFIT_SOURCE).includes(benefit?.source)) {
    return benefit.source;
  }

  /*
   * Support benefits saved before
   * source metadata was introduced.
   */
  if (benefit?.isBasePlanBenefit === true) {
    return BENEFIT_SOURCE.BASE_PLAN;
  }

  if (benefit?.isSuggested === true) {
    return BENEFIT_SOURCE.SUGGESTED;
  }

  return BENEFIT_SOURCE.USER_ADDED;
}