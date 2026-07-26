"use strict";

import { createPlannerId } from "../../utils/client-utils.js";

/* ========================================
   DRAFT BENEFIT COLLECTION
======================================== */

export function addDraftBenefit(benefits, formData) {
  return [
    ...benefits,
    {
      id: createPlannerId(),

      isSuggested: false,

      ...formData,
    },
  ];
}

export function updateDraftBenefit(benefits, benefitId, formData) {
  return benefits.map(function (benefit) {
    if (benefit.id !== benefitId) {
      return benefit;
    }

    return {
      ...benefit,

      ...formData,

      isSuggested: false,
    };
  });
}

export function removeDraftBenefit(benefits, benefitId) {
  return benefits.filter(function (benefit) {
    return benefit.id !== benefitId;
  });
}
