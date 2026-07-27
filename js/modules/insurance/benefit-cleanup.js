"use strict";

import {
  BENEFIT_SOURCE,
  BENEFIT_STATUS,
  normalizeBenefitLifecycle,
} from "./benefit-lifecycle.js";

/* ========================================
   BENEFIT CLEANUP
======================================== */

export function cleanBenefitsForSave(benefits) {
  if (!Array.isArray(benefits)) {
    return [];
  }

  return benefits
    .map(function (benefit) {
      return normalizeBenefitLifecycle(benefit);
    })
    .filter(shouldKeepBenefit);
}

/* ========================================
   SAVE RULES
======================================== */

export function shouldKeepBenefit(benefit) {
  /*
   * Rule 5:
   * Previously saved benefits are never
   * removed merely because they were not
   * edited during the current session.
   */
  if (benefit.status === BENEFIT_STATUS.EXISTING) {
    return true;
  }

  /*
   * Rule 1:
   * Manually added benefits are kept.
   */
  if (benefit.source === BENEFIT_SOURCE.USER_ADDED) {
    return true;
  }

  /*
   * Rule 4:
   * Benefits generated from a selected
   * base plan are kept.
   */
  if (benefit.source === BENEFIT_SOURCE.BASE_PLAN) {
    return true;
  }

  /*
   * Rules 2 and 3:
   * Keep an edited suggestion and remove
   * an untouched suggestion.
   */
  if (benefit.source === BENEFIT_SOURCE.SUGGESTED) {
    return benefit.hasUserInput === true;
  }

  /*
   * Defensive fallback for unexpected
   * or legacy benefit objects.
   */
  return true;
}