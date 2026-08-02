"use strict";

import { createPlannerId } from "../utils/client-utils.js";

import {
  BENEFIT_SOURCE,
  BENEFIT_STATUS,
} from "../modules/insurance/benefit-lifecycle.js";

/* ========================================
   SUGGESTED BENEFIT
======================================== */

export function createEmptyBenefit(benefitType, lifeAssured) {
  return {
    id: createPlannerId(),

    source: BENEFIT_SOURCE.SUGGESTED,

    status: BENEFIT_STATUS.NEW,

    hasUserInput: false,

    /*
     * Compatibility flags.
     */
    isSuggested: true,

    isBasePlanBenefit: false,

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

/* ========================================
   HOSPITALISATION BENEFIT
======================================== */

export function createHospitalisationBaseBenefit(lifeAssured) {
  return {
    id: createPlannerId(),

    source: BENEFIT_SOURCE.BASE_PLAN,

    status: BENEFIT_STATUS.NEW,

    hasUserInput: false,

    isSuggested: false,

    isBasePlanBenefit: true,

    type: "hospitalisation",

    customName: "Hospitalisation Coverage",

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

/* ========================================
   LONG-TERM CARE BASE BENEFIT
======================================== */

export function createLongTermCareBaseBenefit(
  basePlanValue,
  basePlan,
  lifeAssured,
) {
  return {
    id: createPlannerId(),

    source: BENEFIT_SOURCE.BASE_PLAN,

    status: BENEFIT_STATUS.NEW,

    hasUserInput: false,

    /*
     * Compatibility flags.
     */
    isSuggested: false,

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