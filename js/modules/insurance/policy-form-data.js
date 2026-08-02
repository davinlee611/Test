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

  const policyType = elements.policyTypeSelect.value;

  const isHospitalisation = policyType === "hospitalisation";

  const premiumAmount = getWholeNumber(elements.premiumInput.value);

  const riderIncluded =
    isHospitalisation && elements.hospitalisationRiderCheckbox.checked;

  const riderAnnualPremium = riderIncluded
    ? getWholeNumber(elements.hospitalisationRiderPremiumInput.value)
    : 0;

  const premiumPayment = calculateHospitalisationPremiumPayment({
    annualBasePremium: premiumAmount,

    annualRiderPremium: riderAnnualPremium,

    medisaveAmount: elements.hospitalisationMedisaveInput.value,
  });

  return {
    policyName: elements.policyNameInput.value.trim(),

    policyType,

    longTermCareBasePlan:
      policyType === "long_term_care"
        ? elements.longTermCareBasePlanSelect.value
        : null,

    lifeAssured: elements.policyLifeAssuredInput.value.trim(),

    insurer,

    policyNumber: elements.policyNumberInput.value.trim(),

    /*
     * Hospitalisation status and frequency are hidden,
     * but saved internally as active and annual.
     */
    status: isHospitalisation ? "active" : elements.policyStatusSelect.value,

    premiumAmount,

    premiumFrequency: isHospitalisation
      ? "annual"
      : elements.premiumFrequencySelect.value,

    hospitalisation: isHospitalisation
      ? {
          wardType: elements.hospitalisationWardTypeSelect.value,

          rider: {
            included: riderIncluded,

            name: riderIncluded
              ? elements.hospitalisationRiderNameInput.value.trim()
              : "",

            annualPremium: riderAnnualPremium,
          },

          premiumPayment: {
            medisaveAmount: premiumPayment.medisaveAmount,

            cashAmount: premiumPayment.cashAmount,
          },
        }
      : null,
  };
}