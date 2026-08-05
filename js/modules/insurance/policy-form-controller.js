"use strict";

import {
  LONG_TERM_CARE_BASE_PLANS,
  POLICY_TYPE_DEFAULT_BENEFITS,
} from "../../constants/insurance.js";

import {
  createEmptyBenefit,
  createHospitalisationBaseBenefit,
  createLongTermCareBaseBenefit,
} from "../../factories/benefit-factory.js";

import { BENEFIT_SOURCE } from "./benefit-lifecycle.js";

import { getClientAge } from "../client-profile.js";

import {
  calculateHospitalisationPremiumPayment,
  getAutomaticHospitalisationMedisaveAmount,
  getHospitalisationAwl,
} from "./hospitalisation-premium.js";

import {
  calculateLongTermCarePremiumPayment,
  getAutomaticLongTermCareMedisaveAmount,
} from "./long-term-care-premium.js";

export function createPolicyFormController({
  elements,

  getDraftBenefits,
  setDraftBenefits,

  getPreviousPolicyType,
  setPreviousPolicyType,

  getDefaultLifeAssured,

  closeBenefitEditor,
  populateBenefitTypeOptions,

  renderDraftBenefits,
}) {
  /* ========================================
     INSURER
  ======================================== */

  function handleInsurerChange() {
    const isOtherSelected = elements.insurerSelect.value === "other";

    elements.otherInsurerGroup.hidden = !isOtherSelected;

    elements.otherInsurerInput.required = isOtherSelected;

    if (!isOtherSelected) {
      elements.otherInsurerInput.value = "";
    }
  }

  /* ========================================
     PREMIUM
  ======================================== */

  function updatePremiumFields() {
    const policyType = elements.policyTypeSelect.value;

    const isHospitalisation = policyType === "hospitalisation";

    const isLongTermCare = policyType === "long_term_care";

    const isWholeLife = policyType === "whole_life";

    const isTerm = policyType === "term";

    const isDisabilityIncome = policyType === "disability_income";

    const usesFixedAnnualPremium = isHospitalisation || isLongTermCare;

    if (usesFixedAnnualPremium) {
      elements.policyStatusSelect.value = "active";

      elements.premiumFrequencySelect.value = "annual";
    }

    const isPaidUp =
      !usesFixedAnnualPremium &&
      elements.policyStatusSelect.value === "paid_up";

    const isLimitedPay =
      !usesFixedAnnualPremium &&
      elements.policyStatusSelect.value === "limited_pay";

    const showsOptionalWholeLifeEndDate =
      isWholeLife && !isPaidUp && !isLimitedPay;

    const showsPremiumEndDate = isLimitedPay || showsOptionalWholeLifeEndDate;

    elements.policyStatusGroup.hidden = usesFixedAnnualPremium;

    /*
     * Term Life / CI uses a fixed coverage
     * end month.
     */
    elements.coverageEndDateGroup.hidden = !isTerm;

    elements.coverageEndDateInput.required = isTerm;

    /*
     * Disability Income uses an age instead
     * of a calendar end date.
     */
    elements.disabilityCoverageEndAgeGroup.hidden = !isDisabilityIncome;

    elements.disabilityCoverageEndAgeInput.required = isDisabilityIncome;

    if (isDisabilityIncome && !elements.disabilityCoverageEndAgeInput.value) {
      elements.disabilityCoverageEndAgeInput.value = "65";
    }

    elements.premiumPaymentEndDateGroup.hidden = !showsPremiumEndDate;

    elements.premiumPaymentEndDateInput.required = isLimitedPay;

    elements.premiumPaymentEndDateRequiredLabel.hidden = !isLimitedPay;

    elements.premiumPaymentEndDateOptionalLabel.hidden =
      !showsOptionalWholeLifeEndDate;

    elements.premiumPaymentEndDateHelper.textContent = isLimitedPay
      ? "Cashflow will stop this premium after the selected month."
      : "Leave blank if regular premiums continue for life.";

    elements.premiumAmountGroup.hidden = isPaidUp;

    elements.premiumFrequencyGroup.hidden = isPaidUp || usesFixedAnnualPremium;

    elements.premiumInput.required = !isPaidUp;

    elements.premiumFrequencySelect.required =
      !isPaidUp && !usesFixedAnnualPremium;

    if (isHospitalisation) {
      elements.policyPremiumLabel.textContent = "Annual Premium";
    } else if (isLongTermCare) {
      elements.policyPremiumLabel.textContent = "Annual Supplement Premium";
    } else {
      elements.policyPremiumLabel.textContent = "Premium";
    }
  }

  /* ========================================
   POLICY TYPE DETAILS
  ======================================== */

  function updatePolicyTypeDetailSections() {
    const policyType = elements.policyTypeSelect.value;

    const isEndowment = policyType === "endowment";

    const isAccumulation = policyType === "ilp_accumulation";

    const isRetirement = policyType === "retirement";

    elements.endowmentDetailsSection.hidden = !isEndowment;

    elements.endowmentMaturityDateInput.required = isEndowment;

    elements.endowmentGuaranteedAmountInput.required = isEndowment;

    elements.accumulationDetailsSection.hidden = !isAccumulation;

    elements.retirementDetailsSection.hidden = !isRetirement;

    elements.retirementPayoutStartAgeInput.required = isRetirement;

    elements.retirementMonthlyIncomeInput.required = isRetirement;

    elements.retirementPayoutTermSelect.required = isRetirement;

    updateRetirementPayoutDurationField();
  }

  function updateRetirementPayoutDurationField() {
    const needsDuration =
      elements.policyTypeSelect.value === "retirement" &&
      elements.retirementPayoutTermSelect.value === "limited";

    elements.retirementPayoutDurationGroup.hidden = !needsDuration;

    elements.retirementPayoutDurationInput.required = needsDuration;
  }

  /* ========================================
     LONG-TERM CARE
  ======================================== */

  function updateLongTermCareBasePlanField() {
    const isLongTermCarePolicy =
      elements.policyTypeSelect.value === "long_term_care";

    elements.longTermCareBasePlanGroup.hidden = !isLongTermCarePolicy;

    elements.longTermCarePremiumPaymentGroup.hidden = !isLongTermCarePolicy;

    if (!isLongTermCarePolicy) {
      elements.longTermCareBasePlanSelect.value = "";

      elements.longTermCareMedisaveInput.value = "";

      elements.longTermCareCashInput.value = "0";

      return;
    }

    updateLongTermCarePremiumPayment();
  }

  function handleLongTermCareBasePlanChange() {
    /*
     * Changing the base plan invalidates
     * the previous LTC base benefit and
     * supplementary benefits.
     *
     * Retain only untouched optional
     * suggestions that are unrelated to
     * the generated base plan.
     */
    const retainedBenefits = getDraftBenefits().filter(function (benefit) {
      return (
        benefit.source === BENEFIT_SOURCE.SUGGESTED &&
        benefit.hasUserInput !== true
      );
    });

    setDraftBenefits(retainedBenefits);

    closeBenefitEditor();

    const selectedBasePlan = elements.longTermCareBasePlanSelect.value;

    const basePlan = LONG_TERM_CARE_BASE_PLANS[selectedBasePlan];

    if (basePlan) {
      const lifeAssured = getPolicyLifeAssured();

      const basePlanBenefit = createLongTermCareBaseBenefit(
        selectedBasePlan,
        basePlan,
        lifeAssured,
      );

      setDraftBenefits([basePlanBenefit, ...getDraftBenefits()]);
    }

    renderDraftBenefits();
  }

  function updateAutomaticLongTermCareMedisave() {
    const automaticMedisaveAmount = getAutomaticLongTermCareMedisaveAmount(
      elements.premiumInput.value,
    );

    elements.longTermCareMedisaveInput.value = String(automaticMedisaveAmount);
  }

  function handleLongTermCarePremiumInput() {
    if (elements.policyTypeSelect.value !== "long_term_care") {
      return;
    }

    updateAutomaticLongTermCareMedisave();

    updateLongTermCarePremiumPayment();
  }

  function updateLongTermCarePremiumPayment() {
    if (elements.policyTypeSelect.value !== "long_term_care") {
      return;
    }

    const payment = calculateLongTermCarePremiumPayment({
      annualSupplementPremium: elements.premiumInput.value,

      medisaveAmount: elements.longTermCareMedisaveInput.value,
    });

    elements.longTermCareMedisaveInput.value = String(payment.medisaveAmount);

    elements.longTermCareCashInput.value = String(payment.cashAmount);
  }

  /* ========================================
   POLICY TYPE
======================================== */

  function handlePolicyTypeChange() {
    const policyType = elements.policyTypeSelect.value;

    populateBenefitTypeOptions();

    closeBenefitEditor();

    if (!hasOnlySuggestedBenefits()) {
      const confirmed = window.confirm(
        "Changing the policy type will replace the current benefits. Continue?",
      );

      if (!confirmed) {
        elements.policyTypeSelect.value = getPreviousPolicyType();

        populateBenefitTypeOptions();

        updateLongTermCareBasePlanField();

        updateHospitalisationFields();

        updatePremiumFields();

        updatePolicyTypeDetailSections();

        renderDraftBenefits();

        return;
      }
    }

    setPreviousPolicyType(policyType);

    setDraftBenefits([]);

    elements.coverageEndDateInput.value = "";

    elements.premiumPaymentEndDateInput.value = "";

    elements.disabilityCoverageEndAgeInput.value =
      policyType === "disability_income" ? "65" : "";

    elements.longTermCareBasePlanSelect.value = "";

    updateLongTermCareBasePlanField();

    const lifeAssured = getPolicyLifeAssured();

    if (policyType === "hospitalisation") {
      setDraftBenefits([createHospitalisationBaseBenefit(lifeAssured)]);
    } else {
      const defaultBenefitTypes =
        POLICY_TYPE_DEFAULT_BENEFITS[policyType] ?? [];

      const suggestedBenefits = defaultBenefitTypes.map(function (benefitType) {
        return createEmptyBenefit(benefitType, lifeAssured);
      });

      setDraftBenefits(suggestedBenefits);
    }

    updateHospitalisationFields({
      applyDefaultMedisave: policyType === "hospitalisation",
    });

    updatePremiumFields();

    updatePolicyTypeDetailSections();

    if (policyType === "long_term_care") {
      handleLongTermCarePremiumInput();
    }

    syncHospitalisationBaseBenefit();

    renderDraftBenefits();
  }

  function hasOnlySuggestedBenefits() {
    const draftBenefits = getDraftBenefits();

    if (draftBenefits.length === 0) {
      return true;
    }

    return draftBenefits.every(function (benefit) {
      return (
        benefit.source === BENEFIT_SOURCE.SUGGESTED &&
        benefit.hasUserInput !== true
      );
    });
  }

  /* ========================================
     LIFE ASSURED
  ======================================== */

  function syncSuggestedBenefitLifeAssured() {
    const lifeAssured = elements.policyLifeAssuredInput.value.trim();

    const updatedBenefits = getDraftBenefits().map(function (benefit) {
      /*
       * Only update untouched suggestions.
       *
       * A suggestion the adviser already
       * edited may contain an intentionally
       * different life assured.
       */
      const isUntouchedSuggestion =
        benefit.source === BENEFIT_SOURCE.SUGGESTED &&
        benefit.hasUserInput !== true;

      const isGeneratedBaseBenefit =
        benefit.source === BENEFIT_SOURCE.BASE_PLAN &&
        benefit.hasUserInput !== true;

      const shouldSync = isUntouchedSuggestion || isGeneratedBaseBenefit;

      if (!shouldSync) {
        return benefit;
      }

      return {
        ...benefit,

        lifeAssured,
      };
    });

    setDraftBenefits(updatedBenefits);

    renderDraftBenefits();
  }

  /* ========================================
     HOSPITALISATION
  ======================================== */

  function updateHospitalisationFields({ applyDefaultMedisave = false } = {}) {
    const isHospitalisation =
      elements.policyTypeSelect.value === "hospitalisation";

    elements.hospitalisationWardTypeGroup.hidden = !isHospitalisation;

    elements.hospitalisationRiderGroup.hidden = !isHospitalisation;

    elements.hospitalisationPremiumPaymentGroup.hidden = !isHospitalisation;

    elements.addBenefitButton.hidden = isHospitalisation;

    if (!isHospitalisation) {
      elements.hospitalisationRiderFields.hidden = true;

      return;
    }

    closeBenefitEditor();

    if (applyDefaultMedisave) {
      updateAutomaticHospitalisationMedisave();
    }

    updateHospitalisationRiderFields();

    updateHospitalisationPremiumPayment();
  }

  function updateHospitalisationRiderFields() {
    const hasRider = elements.hospitalisationRiderCheckbox.checked;

    elements.hospitalisationRiderFields.hidden = !hasRider;

    elements.hospitalisationRiderTypeSelect.required = hasRider;

    elements.hospitalisationRiderPremiumInput.required = hasRider;

    if (!hasRider) {
      elements.hospitalisationRiderTypeSelect.value = "";

      elements.hospitalisationRiderPremiumInput.value = "";
    }

    updateHospitalisationPremiumPayment();
  }

  function updateHospitalisationPremiumPayment() {
    if (elements.policyTypeSelect.value !== "hospitalisation") {
      return;
    }

    const payment = calculateHospitalisationPremiumPayment({
      annualBasePremium: elements.premiumInput.value,

      annualRiderPremium: elements.hospitalisationRiderCheckbox.checked
        ? elements.hospitalisationRiderPremiumInput.value
        : 0,

      medisaveAmount: elements.hospitalisationMedisaveInput.value,
    });

    /*
     * Reflect any cap applied by the calculator.
     *
     * For example, if the base premium is $200,
     * MediSave cannot remain at $300.
     */
    elements.hospitalisationMedisaveInput.value = String(
      payment.medisaveAmount,
    );

    elements.hospitalisationCashInput.value = String(payment.cashAmount);

    const awl = getHospitalisationAwl(getClientAge());

    elements.hospitalisationMedisaveHelper.textContent =
      awl > 0
        ? `Automatically limited to the lower of the annual base premium or the $${awl} Additional Withdrawal Limit.`
        : "Enter the MediSave amount shown in the insurer's records.";
  }

  function updateAutomaticHospitalisationMedisave() {
    const automaticMedisaveAmount = getAutomaticHospitalisationMedisaveAmount({
      annualBasePremium: elements.premiumInput.value,

      currentAge: getClientAge(),
    });

    elements.hospitalisationMedisaveInput.value = String(
      automaticMedisaveAmount,
    );
  }

  function handleHospitalisationBasePremiumInput() {
    if (elements.policyTypeSelect.value !== "hospitalisation") {
      return;
    }

    updateAutomaticHospitalisationMedisave();

    updateHospitalisationPremiumPayment();
  }

  function syncHospitalisationBaseBenefit() {
    if (elements.policyTypeSelect.value !== "hospitalisation") {
      return;
    }

    const hospitalClass = elements.hospitalisationWardTypeSelect.value;

    const hasRider = elements.hospitalisationRiderCheckbox.checked;

    const updatedBenefits = getDraftBenefits().map(function (benefit) {
      if (benefit.type !== "hospitalisation") {
        return benefit;
      }

      return {
        ...benefit,

        lifeAssured: getPolicyLifeAssured(),

        hospitalClass,

        riderType: hasRider
          ? elements.hospitalisationRiderTypeSelect.value
          : "no",

        hasRider,
      };
    });

    setDraftBenefits(updatedBenefits);
  }

  /* ========================================
     HELPERS
  ======================================== */

  function getPolicyLifeAssured() {
    return (
      elements.policyLifeAssuredInput.value.trim() ||
      getDefaultLifeAssured() ||
      ""
    );
  }

  return {
    updateHospitalisationFields,
    updateHospitalisationRiderFields,
    updateHospitalisationPremiumPayment,
    handleHospitalisationBasePremiumInput,
    syncHospitalisationBaseBenefit,
    handleInsurerChange,
    updatePremiumFields,
    updatePolicyTypeDetailSections,

    updateRetirementPayoutDurationField,
    updateLongTermCareBasePlanField,
    handleLongTermCareBasePlanChange,
    handleLongTermCarePremiumInput,
    updateLongTermCarePremiumPayment,
    handlePolicyTypeChange,
    syncSuggestedBenefitLifeAssured,
  };
}
