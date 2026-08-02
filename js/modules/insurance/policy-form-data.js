"use strict";

import { getWholeNumber } from "../../utils/client-utils.js";

import { calculateHospitalisationPremiumPayment } from "./hospitalisation-premium.js";

/* ========================================
   POLICY FORM DATA
======================================== */

export function readPolicyFormData(elements) {
  const selectedInsurer = elements.insurerSelect.value;

  const insurer =
    selectedInsurer === "other"
      ? elements.otherInsurerInput.value.trim()
      : selectedInsurer;

  return {
    policyName: elements.policyNameInput.value.trim(),

    policyType: elements.policyTypeSelect.value,

    longTermCareBasePlan:
      elements.policyTypeSelect.value === "long_term_care"
        ? elements.longTermCareBasePlanSelect.value
        : null,

    lifeAssured: elements.policyLifeAssuredInput.value.trim(),

    insurer,

    policyNumber: elements.policyNumberInput.value.trim(),

    status: elements.policyStatusSelect.value,

    premiumAmount: getWholeNumber(elements.premiumInput.value),

    premiumFrequency: elements.premiumFrequencySelect.value,
  };
}
