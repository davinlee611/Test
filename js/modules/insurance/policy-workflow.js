"use strict";

import { getAssets, getClientProfile } from "../../state/client-plan.js";

import {
  getAllPolicies,
  createPolicy,
  updatePolicy,
  removePolicy,
  clearPolicies,
} from "../../services/policy-service.js";

import { getCompletePolicyValidationItems } from "./policy-validation.js";

import { validatePolicyDraft } from "./policy-form-validator.js";

import { savePolicyDraft } from "./policy-save-service.js";

import { cleanBenefitsForSave } from "./benefit-cleanup.js";

/* ========================================
   POLICY WORKFLOW
======================================== */

export function createPolicyWorkflow({
  getDraftBenefits,

  getEditingPolicyId,
}) {
  /* ========================================
     SAVED PORTFOLIO DATA
  ======================================== */

  function getPortfolioData() {
    const assets = getAssets();

    const profile = getClientProfile();

    return {
      policies: getAllPolicies(),

      validationContext: createIncomeValidationContext(assets, profile),
    };
  }

  /* ========================================
     CURRENT DRAFT VALIDATION
  ======================================== */

  function getDraftValidationItems({
    lifeAssured = "",

    benefits = getDraftBenefits(),
  } = {}) {
    const assets = getAssets();

    const profile = getClientProfile();

    const editingPolicyId = getEditingPolicyId() || "";

    return getCompletePolicyValidationItems({
      policyId: editingPolicyId,

      policyLifeAssured: lifeAssured,

      benefits,

      includeDraftBenefits: true,

      context: {
        editingPolicyId,

        allPolicies: getAllPolicies(),

        ...createIncomeValidationContext(assets, profile),
      },
    });
  }

  /* ========================================
     DRAFT FORM VALIDATION
  ======================================== */

  function validateDraft({
    formData,

    insurerSelection,

    benefits = getDraftBenefits(),
  }) {
    const validationItems = getDraftValidationItems({
      lifeAssured: formData.lifeAssured,

      benefits,
    });

    return validatePolicyDraft({
      formData,

      insurerSelection,

      draftBenefits: benefits,

      validationItems,
    });
  }

  /* ========================================
     SAVE POLICY
  ======================================== */

  function save({
    formData,

    insurerSelection,
  }) {
    const benefits = cleanBenefitsForSave(getDraftBenefits());

    return savePolicyDraft({
      formData,

      draftBenefits: benefits,

      editingPolicyId: getEditingPolicyId(),

      validate() {
        return validateDraft({
          formData,

          insurerSelection,

          benefits,
        });
      },

      createPolicy,

      updatePolicy,
    });
  }

  /* ========================================
     DELETE POLICY
  ======================================== */

  function deletePolicy(policyId) {
    if (!policyId) {
      return false;
    }

    return removePolicy(policyId);
  }

  /* ========================================
     RESET POLICIES
  ======================================== */

  function resetPolicies() {
    clearPolicies();
  }

  return {
    getPortfolioData,

    getDraftValidationItems,

    validateDraft,

    save,

    deletePolicy,

    resetPolicies,
  };
}

/* ========================================
   PRIVATE HELPERS
======================================== */

function createIncomeValidationContext(assets, profile) {
  return {
    monthlyEmploymentIncome: assets?.income?.monthlyEmployment || 0,

    annualBonus: assets?.income?.annualBonus || 0,

    annualNetTradeIncome: assets?.income?.annualNetTradeIncome || 0,

    employmentStatus: profile?.employmentStatus || "",
  };
}