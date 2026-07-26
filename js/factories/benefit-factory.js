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
