"use strict";

import { getAssets, getClientProfile } from "../state/client-plan.js";

import {
  getAllPolicies,
  createPolicy,
  updatePolicy,
  removePolicy,
  clearPolicies,
} from "../services/policy-service.js";

import { readPolicyFormData } from "./insurance/policy-form-data.js";

import { savePolicyDraft } from "./insurance/policy-save-service.js";

import { createPolicyModal } from "./insurance/policy-modal.js";

import { getCompletePolicyValidationItems } from "./insurance/policy-validation.js";

import { renderDraftBenefitList } from "./insurance/draft-benefit-renderer.js";

import { renderPolicyValidationItems } from "./insurance/validation-renderer.js";

import { createBenefitEditor } from "./insurance/benefit-editor.js";

import { createPolicyFormController } from "./insurance/policy-form-controller.js";

import { renderInsurancePortfolioView } from "./insurance/portfolio-renderer.js";

import { getInsuranceElements } from "./insurance/insurance-elements.js";

import { bindInsuranceEvents } from "./insurance/insurance-event-binder.js";

import { validatePolicyDraft } from "./insurance/policy-form-validator.js";

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

let elements = {};

let policyModal = null;

let benefitEditor = null;

let policyFormController = null;

let draftBenefits = [];

let editingBenefitId = null;

let editingPolicyId = null;

let previousPolicyType = "";

/* ========================================
   INITIALIZATION
======================================== */

export function initializeInsurancePortfolio() {
  elements = getInsuranceElements();

  createInsuranceControllers();

  if (!moduleInitialized) {
    bindModuleEvents();

    moduleInitialized = true;
  }

  renderInsurancePortfolio();
}

/* ========================================
   CONTROLLER CREATION
======================================== */

function createInsuranceControllers() {
  benefitEditor = createBenefitEditor({
    elements,

    getDraftBenefits() {
      return draftBenefits;
    },

    setDraftBenefits(updatedBenefits) {
      draftBenefits = updatedBenefits;
    },

    getEditingBenefitId() {
      return editingBenefitId;
    },

    setEditingBenefitId(benefitId) {
      editingBenefitId = benefitId;
    },

    getPolicyType() {
      return elements.policyTypeSelect.value;
    },

    getPolicyLifeAssured() {
      return elements.policyLifeAssuredInput.value.trim();
    },

    getDefaultLifeAssured() {
      return getClientProfile().fullName || "";
    },

    getLongTermCareBasePlan() {
      return elements.longTermCareBasePlanSelect.value;
    },

    onBenefitsChanged() {
      renderDraftBenefits();
    },
  });

  policyFormController = createPolicyFormController({
    elements,

    getDraftBenefits() {
      return draftBenefits;
    },

    setDraftBenefits(updatedBenefits) {
      draftBenefits = updatedBenefits;
    },

    getPreviousPolicyType() {
      return previousPolicyType;
    },

    setPreviousPolicyType(policyType) {
      previousPolicyType = policyType;
    },

    getDefaultLifeAssured() {
      return getClientProfile().fullName || "";
    },

    closeBenefitEditor() {
      benefitEditor.close();
    },

    populateBenefitTypeOptions(selectedBenefitType) {
      benefitEditor.populateBenefitTypeOptions(selectedBenefitType);
    },

    renderDraftBenefits,
  });

  policyModal = createPolicyModal({
    elements,

    setDraftBenefits(updatedBenefits) {
      draftBenefits = updatedBenefits;
    },

    setEditingBenefitId(benefitId) {
      editingBenefitId = benefitId;
    },

    setEditingPolicyId(policyId) {
      editingPolicyId = policyId;
    },

    setPreviousPolicyType(policyType) {
      previousPolicyType = policyType;
    },

    populateBenefitTypeOptions(selectedBenefitType) {
      benefitEditor.populateBenefitTypeOptions(selectedBenefitType);
    },

    updateLongTermCareBasePlanField() {
      policyFormController.updateLongTermCareBasePlanField();
    },

    updatePremiumFields() {
      policyFormController.updatePremiumFields();
    },

    handleInsurerChange() {
      policyFormController.handleInsurerChange();
    },

    closeBenefitEditor() {
      benefitEditor.close();
    },

    renderDraftBenefits,

    getLifeAssuredFromBenefits,
  });
}

/* ========================================
   RESET
======================================== */

export function resetInsurancePortfolio() {
  clearPolicies();

  draftBenefits = [];

  editingBenefitId = null;

  editingPolicyId = null;

  previousPolicyType = "";

  policyModal?.close();

  renderInsurancePortfolio();
}

/* ========================================
   EVENT BINDING
======================================== */

function bindModuleEvents() {
  bindInsuranceEvents({
    elements,

    onPortfolioErrorClick() {
      scrollToFirstPolicyWithSeverity("error");
    },

    onPortfolioReviewClick() {
      scrollToFirstPolicyWithSeverity("review");
    },

    onAddPolicy() {
      policyModal.openAdd();
    },

    onClosePolicy() {
      policyModal.close();
    },

    onSavePolicy() {
      savePolicy();
    },

    onInsurerChange() {
      policyFormController.handleInsurerChange();
    },

    onPolicyStatusChange() {
      policyFormController.updatePremiumFields();
    },

    onPolicyTypeChange() {
      policyFormController.handlePolicyTypeChange();
    },

    onLongTermCareBasePlanChange() {
      policyFormController.handleLongTermCareBasePlanChange();
    },

    onPolicyLifeAssuredInput() {
      policyFormController.syncSuggestedBenefitLifeAssured();
    },

    onAddBenefit() {
      benefitEditor.openAdd();
    },

    onCloseBenefit() {
      benefitEditor.close();
    },

    onBenefitPayoutTermChange() {
      benefitEditor.updatePayoutDurationField();
    },

    onBenefitTypeChange() {
      benefitEditor.updateBenefitFields();
    },

    onSaveBenefit() {
      benefitEditor.save();
    },
  });
}

/* ========================================
   SAVE POLICY
======================================== */

function savePolicy() {
  clearPolicyFormMessage();

  const formData = readPolicyFormData(elements);

  const result = savePolicyDraft({
    formData,

    draftBenefits,

    editingPolicyId,

    validate() {
      return validateCurrentPolicyDraft(formData);
    },

    createPolicy,

    updatePolicy,
  });

  if (!result.success) {
    showPolicyFormMessage(result.message);

    return;
  }

  renderInsurancePortfolio();

  policyModal.close();
}

/* ========================================
   POLICY FORM VALIDATION
======================================== */

function validateCurrentPolicyDraft(formData) {
  const validationItems = getCurrentDraftPolicyValidationItems({
    lifeAssured: formData.lifeAssured,
  });

  return validatePolicyDraft({
    formData,

    insurerSelection: elements.insurerSelect.value,

    draftBenefits,

    validationItems,
  });
}

/* ========================================
   POLICY VALIDATION DATA
======================================== */

function getCurrentDraftPolicyValidationItems({
  lifeAssured = elements.policyLifeAssuredInput.value.trim(),
} = {}) {
  const assets = getAssets();

  return getCompletePolicyValidationItems({
    policyId: editingPolicyId || "",

    policyLifeAssured: lifeAssured,

    benefits: draftBenefits,

    includeDraftBenefits: true,

    context: {
      editingPolicyId: editingPolicyId || "",

      allPolicies: getAllPolicies(),

      monthlyEmploymentIncome: assets.income.monthlyEmployment,

      annualBonus: assets.income.annualBonus,
    },
  });
}

/* ========================================
   POLICY VALIDATION RENDERING
======================================== */

function renderPolicyValidation() {
  const validationItems = getCurrentDraftPolicyValidationItems();

  const hasErrors = validationItems.some(function (item) {
    return item.severity === "error" && !item.valid;
  });

  if (!hasErrors) {
    clearPolicyFormMessage();
  }

  renderPolicyValidationItems({
    section: elements.policyValidationSection,

    list: elements.policyValidationList,

    validationItems,

    hasBenefits: draftBenefits.length > 0,
  });
}

/* ========================================
   POLICY FORM MESSAGE
======================================== */

function showPolicyFormMessage(message) {
  if (!elements.policyFormMessage) {
    return;
  }

  elements.policyFormMessage.textContent = message;

  elements.policyFormMessage.scrollIntoView({
    behavior: "smooth",

    block: "nearest",
  });
}

function clearPolicyFormMessage() {
  if (!elements.policyFormMessage) {
    return;
  }

  elements.policyFormMessage.textContent = "";
}

/* ========================================
   DRAFT BENEFIT RENDERING
======================================== */

function renderDraftBenefits() {
  renderDraftBenefitList({
    container: elements.policyBenefitList,

    benefits: draftBenefits,

    onEdit(benefitId) {
      benefitEditor.openEdit(benefitId);
    },

    onDelete(benefitId) {
      benefitEditor.confirmDelete(benefitId);
    },
  });

  renderPolicyValidation();
}

/* ========================================
   PORTFOLIO RENDERING
======================================== */

function renderInsurancePortfolio() {
  const policies = getAllPolicies();

  const assets = getAssets();

  renderInsurancePortfolioView({
    elements,

    policies,

    validationContext: {
      monthlyEmploymentIncome: assets.income.monthlyEmployment,

      annualBonus: assets.income.annualBonus,
    },

    onEditPolicy(policyId) {
      policyModal.openEdit(policyId);
    },

    onDeletePolicy(policy) {
      confirmDeletePolicy(policy);
    },
  });
}

/* ========================================
   DELETE POLICY
======================================== */

function confirmDeletePolicy(policy) {
  const confirmed = window.confirm(
    `Delete "${policy.policyName || "this policy"}"?`,
  );

  if (!confirmed) {
    return;
  }

  handleDeletePolicy(policy.id);
}

function handleDeletePolicy(policyId) {
  const removed = removePolicy(policyId);

  if (!removed) {
    return;
  }

  renderInsurancePortfolio();
}

/* ========================================
   HELPERS
======================================== */

function getLifeAssuredFromBenefits(benefits) {
  if (!Array.isArray(benefits)) {
    return "";
  }

  const benefitWithLifeAssured = benefits.find(function (benefit) {
    return benefit.lifeAssured?.trim();
  });

  return benefitWithLifeAssured?.lifeAssured || "";
}

function scrollToFirstPolicyWithSeverity(severity) {
  const matchingPolicy = elements.policyList?.querySelector(
    `[data-validation-severity="${severity}"]`,
  );

  if (!matchingPolicy) {
    return;
  }

  matchingPolicy.scrollIntoView({
    behavior: "smooth",

    block: "center",
  });

  matchingPolicy.classList.remove("policy-item--highlighted");

  window.requestAnimationFrame(function () {
    matchingPolicy.classList.add("policy-item--highlighted");
  });

  window.setTimeout(
    function () {
      matchingPolicy.classList.remove("policy-item--highlighted");
    },

    1800,
  );
}
