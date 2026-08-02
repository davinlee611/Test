"use strict";

/* ========================================
   POLICY FORM WRITER
======================================== */

export function writePolicyFormData(
  elements,
  policy,
  fallbackLifeAssured = "",
) {
  elements.policyNameInput.value = policy.policyName || "";

  elements.policyTypeSelect.value = policy.policyType || "";

  elements.longTermCareBasePlanSelect.value = policy.longTermCareBasePlan || "";

  writeInsurerFields(elements, policy.insurer);

  elements.policyNumberInput.value = policy.policyNumber || "";

  elements.policyLifeAssuredInput.value =
    policy.lifeAssured || fallbackLifeAssured || "";

  elements.policyStatusSelect.value = policy.status || "";

  elements.premiumInput.value = policy.premium?.amount || "";

  elements.premiumFrequencySelect.value = policy.premium?.frequency || "annual";

  writeHospitalisationFields(elements, policy);
}

/* ========================================
   HOSPITALISATION WRITER
======================================== */

function writeHospitalisationFields(elements, policy) {
  const hospitalisation = policy.hospitalisation || {};

  const rider = hospitalisation.rider || {};

  const premiumPayment = hospitalisation.premiumPayment || {};

  elements.hospitalisationWardTypeSelect.value = hospitalisation.wardType || "";

  elements.hospitalisationRiderCheckbox.checked = rider.included === true;

  elements.hospitalisationRiderTypeSelect.value = rider.type || "";

  elements.hospitalisationRiderPremiumInput.value =
    Number(rider.annualPremium) > 0 ? String(rider.annualPremium) : "";

  elements.hospitalisationMedisaveInput.value = Number.isFinite(
    Number(premiumPayment.medisaveAmount),
  )
    ? String(premiumPayment.medisaveAmount)
    : "";

  elements.hospitalisationCashInput.value = Number.isFinite(
    Number(premiumPayment.cashAmount),
  )
    ? String(premiumPayment.cashAmount)
    : "0";
}

/* ========================================
   PRIVATE INSURER WRITER
======================================== */

function writeInsurerFields(elements, insurer) {
  const savedInsurer = insurer || "";

  const insurerOptionExists = Array.from(elements.insurerSelect.options).some(
    function (option) {
      return option.value === savedInsurer;
    },
  );

  if (savedInsurer && insurerOptionExists && savedInsurer !== "other") {
    elements.insurerSelect.value = savedInsurer;

    elements.otherInsurerInput.value = "";
  } else if (savedInsurer) {
    elements.insurerSelect.value = "other";

    elements.otherInsurerInput.value = savedInsurer;
  } else {
    elements.insurerSelect.value = "";

    elements.otherInsurerInput.value = "";
  }

  const isOtherSelected = elements.insurerSelect.value === "other";

  elements.otherInsurerGroup.hidden = !isOtherSelected;

  elements.otherInsurerInput.required = isOtherSelected;

  if (!isOtherSelected) {
    elements.otherInsurerInput.value = "";
  }
}