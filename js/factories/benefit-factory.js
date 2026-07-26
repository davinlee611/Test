"use strict";

import { createPlannerId } from "../utils/client-utils.js";

/* ========================================
   BENEFIT FACTORIES
======================================== */

export function createEmptyBenefit(benefitType,lifeAssured) {
  return {
    id: createPlannerId(),

    isSuggested: true,

    type: benefitType,

    customName: "",

    lifeAssured,

    amount: 0,

    payoutType: null,

    payoutTerm: null,

    payoutDuration: null,

    hospitalClass: "",

    riderType: "",

    adlRequirement: null,

    notes: "",
  };
}

export function createLongTermCareBaseBenefit(basePlanValue, basePlan, lifeAssured) {
  return {
    id: createPlannerId(),

    isSuggested: true,

    isBasePlanBenefit: true,

    basePlan: basePlanValue,

    type: "long_term_care_income",

    customName: basePlan.name,

    lifeAssured,

    amount: basePlan.amount,

    payoutType: null,

    payoutTerm: basePlan.payoutTerm,

    payoutDuration: basePlan.payoutDuration,

    hospitalClass: "",

    riderType: "",

    adlRequirement: basePlan.adlRequirement,

    notes: "",
  };
}
