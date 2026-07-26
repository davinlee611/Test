"use strict";

/* ========================================
   BENEFIT FORM WRITER
======================================== */

export function writeBenefitFormData(
  elements,
  benefit,
  fallbackLifeAssured = "",
) {
  elements.benefitTypeSelect.value = benefit.type || "";

  elements.benefitLifeAssuredInput.value =
    benefit.lifeAssured || fallbackLifeAssured || "";

  elements.benefitCustomNameInput.value = benefit.customName || "";

  elements.benefitAmountInput.value = benefit.amount > 0 ? benefit.amount : "";

  elements.benefitPayoutTermSelect.value = benefit.payoutTerm || "";

  elements.benefitPayoutDurationInput.value =
    benefit.payoutDuration > 0 ? benefit.payoutDuration : "";

  elements.benefitPayoutTypeSelect.value = benefit.payoutType || "";

  elements.benefitHospitalClassSelect.value = benefit.hospitalClass || "";

  elements.benefitHospitalRiderSelect.value = getSavedRiderValue(benefit);

  elements.benefitAdlRequirementSelect.value =
    benefit.adlRequirement != null ? String(benefit.adlRequirement) : "";

  elements.benefitNotesInput.value = benefit.notes || "";
}

/* ========================================
   PRIVATE HELPERS
======================================== */

function getSavedRiderValue(benefit) {
  if (benefit.riderType) {
    return benefit.riderType;
  }

  if (benefit.hasRider === true) {
    return "yes";
  }

  if (benefit.hasRider === false) {
    return "no";
  }

  return "";
}
