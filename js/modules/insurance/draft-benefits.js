"use strict";

import { createPlannerId } from "../../utils/client-utils.js";

import {
  BENEFIT_SOURCE,
  BENEFIT_STATUS,
  normalizeBenefitLifecycle,
} from "./benefit-lifecycle.js";

/* ========================================
   ADD BENEFIT
======================================== */

export function addDraftBenefit(benefits, formData) {
  return [
    ...benefits,

    normalizeBenefitLifecycle({
      id: createPlannerId(),

      ...formData,

      source: BENEFIT_SOURCE.USER_ADDED,

      status: BENEFIT_STATUS.NEW,

      hasUserInput: true,

      isSuggested: false,

      isBasePlanBenefit: false,
    }),
  ];
}

/* ========================================
   UPDATE BENEFIT
======================================== */

export function updateDraftBenefit(benefits, benefitId, formData) {
  return benefits.map(function (benefit) {
    if (benefit.id !== benefitId) {
      return benefit;
    }

    const normalizedBenefit = normalizeBenefitLifecycle(benefit);

    return normalizeBenefitLifecycle({
      ...normalizedBenefit,

      ...formData,

      /*
       * Editing any benefit form and
       * clicking Save Changes counts as
       * deliberate user interaction.
       */
      hasUserInput: true,
    });
  });
}

/* ========================================
   REMOVE BENEFIT
======================================== */

export function removeDraftBenefit(benefits, benefitId) {
  return benefits.filter(function (benefit) {
    return benefit.id !== benefitId;
  });
}