"use strict";

import { getAssets } from "../../state/client-plan.js";

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

    return {
      policies: getAllPolicies(),

      validationContext: createIncomeValidationContext(assets),
    };
  }

  /* ========================================
     CURRENT DRAFT VALIDATION
  ======================================== */

  function getDraftValidationItems({ lifeAssured = "" } = {}) {
    const assets = getAssets();

    const editingPolicyId = getEditingPolicyId() || "";

    return getCompletePolicyValidationItems({
      policyId: editingPolicyId,

      policyLifeAssured: lifeAssured,

      benefits: getDraftBenefits(),

      includeDraftBenefits: true,

      context: {
        editingPolicyId,

        allPolicies: getAllPolicies(),

        ...createIncomeValidationContext(assets),
      },
    });
  }

  /* ========================================
     DRAFT FORM VALIDATION
  ======================================== */

  function validateDraft({
    formData,

    insurerSelection,
  }) {
    const validationItems = getDraftValidationItems({
      lifeAssured: formData.lifeAssured,
    });

    return validatePolicyDraft({
      formData,

      insurerSelection,

      draftBenefits: getDraftBenefits(),

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
    return savePolicyDraft({
      formData,

      draftBenefits: getDraftBenefits(),

      editingPolicyId: getEditingPolicyId(),

      validate() {
        return validateDraft({
          formData,

          insurerSelection,
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

function createIncomeValidationContext(assets) {
  return {
    monthlyEmploymentIncome: assets?.income?.monthlyEmployment || 0,

    annualBonus: assets?.income?.annualBonus || 0,
  };
}
