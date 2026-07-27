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

    const updatedSource =
      normalizedBenefit.source === BENEFIT_SOURCE.SUGGESTED
        ? BENEFIT_SOURCE.USER_ADDED
        : normalizedBenefit.source;

    return normalizeBenefitLifecycle({
      ...normalizedBenefit,

      ...formData,

      /*
       * Once the user deliberately edits
       * a suggested benefit, it becomes a
       * confirmed user benefit.
       *
       * Base-plan benefits retain their
       * base-plan source.
       */
      source: updatedSource,

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