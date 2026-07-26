"use strict";

import { getWholeNumber } from "../../utils/client-utils.js";

/* ========================================
   BENEFIT FORM DATA
======================================== */

export function readBenefitFormData(elements) {
  return {
    type: elements.benefitTypeSelect.value,

    customName: elements.benefitCustomNameInput.value.trim(),

    lifeAssured: elements.benefitLifeAssuredInput.value.trim(),

    amount: getWholeNumber(elements.benefitAmountInput.value),

    payoutType: elements.benefitPayoutTypeSelect.value || null,

    payoutTerm: elements.benefitPayoutTermSelect.value || null,

    payoutDuration: getBenefitPayoutDuration(elements),

    hospitalClass: elements.benefitHospitalClassSelect.value,

    riderType: elements.benefitHospitalRiderSelect.value,

    adlRequirement: elements.benefitAdlRequirementSelect.value
      ? Number(elements.benefitAdlRequirementSelect.value)
      : null,

    notes: elements.benefitNotesInput.value.trim(),
  };
}

/* ========================================
   PRIVATE HELPERS
======================================== */

function getBenefitPayoutDuration(elements) {
  const payoutTerm = elements.benefitPayoutTermSelect.value;

  if (payoutTerm === "extend_10_years") {
    return 120;
  }

  if (payoutTerm === "limited") {
    return getWholeNumber(elements.benefitPayoutDurationInput.value);
  }

  return null;
}
