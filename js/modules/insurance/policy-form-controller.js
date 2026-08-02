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
  getHospitalisationAwl,
} from "./hospitalisation-premium.js";

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

    const isHospitalisation =
      elements.policyTypeSelect.value === "hospitalisation";

    const isPaidUp = elements.policyStatusSelect.value === "paid_up";

    elements.premiumAmountGroup.hidden = isPaidUp;

    elements.premiumFrequencyGroup.hidden = isPaidUp || isHospitalisation;

    elements.premiumInput.required = !isPaidUp;

    elements.premiumFrequencySelect.required = !isPaidUp && !isHospitalisation;

    if (isPaidUp) {
      elements.premiumInput.value = "";

      elements.premiumFrequencySelect.value = "";
    }
  }

  /* ========================================
     LONG-TERM CARE
  ======================================== */

  function updateLongTermCareBasePlanField() {
    const isLongTermCarePolicy =
      elements.policyTypeSelect.value === "long_term_care";

    elements.longTermCareBasePlanGroup.hidden = !isLongTermCarePolicy;

    if (!isLongTermCarePolicy) {
      elements.longTermCareBasePlanSelect.value = "";
    }
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

        renderDraftBenefits();

        return;
      }
    }

    setPreviousPolicyType(policyType);

    setDraftBenefits([]);

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

    elements.policyStatusGroup.hidden = isHospitalisation;

    elements.addBenefitButton.hidden = isHospitalisation;

    if (!isHospitalisation) {
      elements.hospitalisationRiderFields.hidden = true;

      elements.policyPremiumLabel.textContent = "Premium";

      return;
    }

    elements.policyStatusSelect.value = "active";

    elements.premiumFrequencySelect.value = "annual";

    elements.premiumFrequencyGroup.hidden = true;

    elements.policyPremiumLabel.textContent = "Annual Premium";

    closeBenefitEditor();

    if (
      applyDefaultMedisave ||
      elements.hospitalisationMedisaveInput.value === ""
    ) {
      elements.hospitalisationMedisaveInput.value = String(
        getHospitalisationAwl(getClientAge()),
      );
    }

    updateHospitalisationRiderFields();

    updateHospitalisationPremiumPayment();
  }

  function updateHospitalisationRiderFields() {
    const hasRider = elements.hospitalisationRiderCheckbox.checked;

    elements.hospitalisationRiderFields.hidden = !hasRider;

    elements.hospitalisationRiderNameInput.required = hasRider;

    elements.hospitalisationRiderPremiumInput.required = hasRider;

    if (!hasRider) {
      elements.hospitalisationRiderNameInput.value = "";

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

    elements.hospitalisationCashInput.value = String(payment.cashAmount);

    const awl = getHospitalisationAwl(getClientAge());

    elements.hospitalisationMedisaveHelper.textContent =
      awl > 0
        ? `Pre-filled using the applicable Additional Withdrawal Limit of $${awl}.`
        : "Enter the MediSave amount shown in the insurer's records.";
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

        riderType: hasRider ? "yes" : "no",

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
    syncHospitalisationBaseBenefit,
    handleInsurerChange,
    updatePremiumFields,
    updateLongTermCareBasePlanField,
    handleLongTermCareBasePlanChange,
    handlePolicyTypeChange,
    syncSuggestedBenefitLifeAssured,
  };
}
