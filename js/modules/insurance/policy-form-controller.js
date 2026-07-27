"use strict";

import {
  LONG_TERM_CARE_BASE_PLANS,
  POLICY_TYPE_DEFAULT_BENEFITS,
} from "../../constants/insurance.js";

import {
  createEmptyBenefit,
  createLongTermCareBaseBenefit,
} from "../../factories/benefit-factory.js";

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
    const isPaidUp = elements.policyStatusSelect.value === "paid_up";

    elements.premiumAmountGroup.hidden = isPaidUp;

    elements.premiumFrequencyGroup.hidden = isPaidUp;

    elements.premiumInput.required = !isPaidUp;

    elements.premiumFrequencySelect.required = !isPaidUp;

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
     * Changing the base plan invalidates the
     * previously entered supplementary benefits
     * because their payout options depend on the
     * selected base plan.
     *
     * Keep only untouched suggested benefits.
     */
    const retainedBenefits = getDraftBenefits().filter(function (benefit) {
      return benefit.isSuggested && !benefit.isBasePlanBenefit;
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

        renderDraftBenefits();

        return;
      }
    }

    setPreviousPolicyType(policyType);

    setDraftBenefits([]);

    elements.longTermCareBasePlanSelect.value = "";

    updateLongTermCareBasePlanField();

    const defaultBenefitTypes = POLICY_TYPE_DEFAULT_BENEFITS[policyType] ?? [];

    const lifeAssured = getPolicyLifeAssured();

    const suggestedBenefits = defaultBenefitTypes.map(function (benefitType) {
      return createEmptyBenefit(benefitType, lifeAssured);
    });

    setDraftBenefits(suggestedBenefits);

    renderDraftBenefits();
  }

  function hasOnlySuggestedBenefits() {
    const draftBenefits = getDraftBenefits();

    if (draftBenefits.length === 0) {
      return true;
    }

    return draftBenefits.every(function (benefit) {
      return benefit.isSuggested;
    });
  }

  /* ========================================
     LIFE ASSURED
  ======================================== */

  function syncSuggestedBenefitLifeAssured() {
    const lifeAssured = elements.policyLifeAssuredInput.value.trim();

    const updatedBenefits = getDraftBenefits().map(function (benefit) {
      if (!benefit.isSuggested) {
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
    handleInsurerChange,
    updatePremiumFields,
    updateLongTermCareBasePlanField,
    handleLongTermCareBasePlanChange,
    handlePolicyTypeChange,
    syncSuggestedBenefitLifeAssured,
  };
}
