"use strict";

/* ========================================
   INSURANCE DOM ELEMENTS
======================================== */

export function getInsuranceElements() {
  return {
    portfolioValidationSummary: document.getElementById(
      "portfolioValidationSummary",
    ),

    portfolioErrorButton: document.getElementById("portfolioErrorButton"),

    portfolioErrorCount: document.getElementById("portfolioErrorCount"),

    portfolioReviewButton: document.getElementById("portfolioReviewButton"),

    portfolioReviewCount: document.getElementById("portfolioReviewCount"),

    portfolioPassCount: document.getElementById("portfolioPassCount"),

    policyList: document.getElementById("policyList"),

    emptyPolicyMessage: document.getElementById("emptyPolicyMessage"),

    addPolicyButton: document.getElementById("addPolicyButton"),

    policyModal: document.getElementById("policyModal"),

    policyModalTitle: document.getElementById("policyModalTitle"),

    closePolicyModalButton: document.getElementById("closePolicyModalButton"),

    cancelPolicyButton: document.getElementById("cancelPolicyButton"),

    savePolicyButton: document.getElementById("savePolicyButton"),

    policyNameInput: document.getElementById("policyNameInput"),

    policyTypeSelect: document.getElementById("policyTypeSelect"),

    longTermCareBasePlanGroup: document.getElementById(
      "longTermCareBasePlanGroup",
    ),

    longTermCareBasePlanSelect: document.getElementById(
      "longTermCareBasePlanSelect",
    ),

    policyLifeAssuredInput: document.getElementById("policyLifeAssuredInput"),

    insurerSelect: document.getElementById("insurerSelect"),

    otherInsurerGroup: document.getElementById("otherInsurerGroup"),

    otherInsurerInput: document.getElementById("otherInsurerInput"),

    policyNumberInput: document.getElementById("policyNumberInput"),

    policyStatusSelect: document.getElementById("policyStatusSelect"),

    premiumPaymentEndDateGroup: document.getElementById(
      "premiumPaymentEndDateGroup",
    ),

    premiumPaymentEndDateInput: document.getElementById(
      "premiumPaymentEndDateInput",
    ),

    premiumAmountGroup: document.getElementById("premiumAmountGroup"),

    premiumFrequencyGroup: document.getElementById("premiumFrequencyGroup"),

    premiumInput: document.getElementById("premiumInput"),

    premiumFrequencySelect: document.getElementById("premiumFrequencySelect"),

    policyFormMessage: document.getElementById("policyFormMessage"),

    addBenefitButton: document.getElementById("addBenefitButton"),

    benefitEditor: document.getElementById("benefitEditor"),

    benefitEditorTitle: document.getElementById("benefitEditorTitle"),

    closeBenefitEditorButton: document.getElementById(
      "closeBenefitEditorButton",
    ),

    benefitTypeSelect: document.getElementById("benefitTypeSelect"),

    benefitLifeAssuredInput: document.getElementById("benefitLifeAssuredInput"),

    benefitLifeAssuredGroup: document.getElementById("benefitLifeAssuredGroup"),

    benefitCustomNameGroup: document.getElementById("benefitCustomNameGroup"),

    benefitCustomNameInput: document.getElementById("benefitCustomNameInput"),

    benefitAmountGroup: document.getElementById("benefitAmountGroup"),

    benefitAmountLabel: document.getElementById("benefitAmountLabel"),

    benefitAmountInput: document.getElementById("benefitAmountInput"),

    benefitPayoutTermGroup: document.getElementById("benefitPayoutTermGroup"),

    benefitPayoutTermSelect: document.getElementById("benefitPayoutTermSelect"),

    benefitPayoutDurationGroup: document.getElementById(
      "benefitPayoutDurationGroup",
    ),

    benefitPayoutDurationInput: document.getElementById(
      "benefitPayoutDurationInput",
    ),

    benefitPayoutTypeGroup: document.getElementById("benefitPayoutTypeGroup"),

    benefitPayoutTypeSelect: document.getElementById("benefitPayoutTypeSelect"),

    benefitHospitalClassGroup: document.getElementById(
      "benefitHospitalClassGroup",
    ),

    benefitHospitalClassSelect: document.getElementById(
      "benefitHospitalClassSelect",
    ),

    benefitHospitalRiderGroup: document.getElementById(
      "benefitHospitalRiderGroup",
    ),

    benefitHospitalRiderSelect: document.getElementById(
      "benefitHospitalRiderSelect",
    ),

    benefitAdlRequirementGroup: document.getElementById(
      "benefitAdlRequirementGroup",
    ),

    benefitAdlRequirementSelect: document.getElementById(
      "benefitAdlRequirementSelect",
    ),

    benefitNotesInput: document.getElementById("benefitNotesInput"),

    benefitFormMessage: document.getElementById("benefitFormMessage"),

    cancelBenefitButton: document.getElementById("cancelBenefitButton"),

    saveBenefitButton: document.getElementById("saveBenefitButton"),

    policyBenefitList: document.getElementById("policyBenefitList"),

    emptyPolicyBenefitMessage: document.getElementById(
      "emptyPolicyBenefitMessage",
    ),

    policyValidationSection: document.getElementById("policyValidationSection"),

    policyValidationList: document.getElementById("policyValidationList"),

    policyStatusGroup: document.getElementById("policyStatusGroup"),

    policyPremiumLabel: document.getElementById("policyPremiumLabel"),

    hospitalisationWardTypeGroup: document.getElementById(
      "hospitalisationWardTypeGroup",
    ),

    hospitalisationWardTypeSelect: document.getElementById(
      "hospitalisationWardTypeSelect",
    ),

    hospitalisationRiderGroup: document.getElementById(
      "hospitalisationRiderGroup",
    ),

    hospitalisationRiderCheckbox: document.getElementById(
      "hospitalisationRiderCheckbox",
    ),

    hospitalisationRiderFields: document.getElementById(
      "hospitalisationRiderFields",
    ),

    hospitalisationRiderTypeSelect: document.getElementById(
      "hospitalisationRiderTypeSelect",
    ),

    hospitalisationRiderPremiumInput: document.getElementById(
      "hospitalisationRiderPremiumInput",
    ),

    hospitalisationPremiumPaymentGroup: document.getElementById(
      "hospitalisationPremiumPaymentGroup",
    ),

    hospitalisationMedisaveInput: document.getElementById(
      "hospitalisationMedisaveInput",
    ),

    hospitalisationMedisaveHelper: document.getElementById(
      "hospitalisationMedisaveHelper",
    ),

    hospitalisationCashInput: document.getElementById(
      "hospitalisationCashInput",
    ),

    longTermCarePremiumPaymentGroup: document.getElementById(
      "longTermCarePremiumPaymentGroup",
    ),

    longTermCareMedisaveInput: document.getElementById(
      "longTermCareMedisaveInput",
    ),

    longTermCareCashInput: document.getElementById("longTermCareCashInput"),

    endowmentDetailsSection: document.getElementById("endowmentDetailsSection"),

    endowmentMaturityDateInput: document.getElementById(
      "endowmentMaturityDateInput",
    ),

    endowmentGuaranteedAmountInput: document.getElementById(
      "endowmentGuaranteedAmountInput",
    ),

    endowmentNonGuaranteedAmountInput: document.getElementById(
      "endowmentNonGuaranteedAmountInput",
    ),

    retirementDetailsSection: document.getElementById(
      "retirementDetailsSection",
    ),

    retirementPayoutStartAgeInput: document.getElementById(
      "retirementPayoutStartAgeInput",
    ),

    retirementMonthlyIncomeInput: document.getElementById(
      "retirementMonthlyIncomeInput",
    ),

    retirementPayoutTermSelect: document.getElementById(
      "retirementPayoutTermSelect",
    ),

    retirementPayoutDurationGroup: document.getElementById(
      "retirementPayoutDurationGroup",
    ),

    retirementPayoutDurationInput: document.getElementById(
      "retirementPayoutDurationInput",
    ),
  };
}
