"use strict";

import {
  closeModalOnOverlayClick,
  closeModalOnEscape,
} from "../utils/modal.js";

import { getAssets, getClientProfile } from "../state/client-plan.js";

import {
  getAllPolicies,
  createPolicy,
  updatePolicy,
  removePolicy,
  clearPolicies,
} from "../services/policy-service.js";

import { readPolicyFormData } from "./insurance/policy-form-data.js";

import { createPolicyModal } from "./insurance/policy-modal.js";

import { getCompletePolicyValidationItems } from "./insurance/policy-validation.js";

import { renderDraftBenefitList } from "./insurance/draft-benefit-renderer.js";

import { renderPolicyValidationItems } from "./insurance/validation-renderer.js";

import { createBenefitEditor } from "./insurance/benefit-editor.js";

import { createPolicyFormController } from "./insurance/policy-form-controller.js";

import { renderInsurancePortfolioView } from "./insurance/portfolio-renderer.js";

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
  cacheInsuranceElements();

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

  if (!moduleInitialized) {
    bindInsuranceEvents();

    moduleInitialized = true;
  }

  renderInsurancePortfolio();
}

/* ========================================
   RESET
======================================== */

export function resetInsurancePortfolio() {
  clearPolicies();

  draftBenefits = [];

  editingBenefitId = null;
  editingPolicyId = null;

  policyModal?.close();

  renderInsurancePortfolio();
}

/* ========================================
   CACHE ELEMENTS
======================================== */

function cacheInsuranceElements() {
  elements = {
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
  };
}

/* ========================================
   EVENT BINDING
======================================== */

function bindInsuranceEvents() {
  elements.portfolioErrorButton?.addEventListener("click", function () {
    scrollToFirstPolicyWithSeverity("error");
  });

  elements.portfolioReviewButton?.addEventListener("click", function () {
    scrollToFirstPolicyWithSeverity("review");
  });

  elements.addPolicyButton?.addEventListener("click", function () {
    policyModal.openAdd();
  });

  elements.closePolicyModalButton?.addEventListener("click", function () {
    policyModal.close();
  });

  elements.cancelPolicyButton?.addEventListener("click", function () {
    policyModal.close();
  });

  elements.savePolicyButton?.addEventListener("click", savePolicy);

  elements.insurerSelect?.addEventListener("change", function () {
    policyFormController.handleInsurerChange();
  });

  elements.policyStatusSelect?.addEventListener("change", function () {
    policyFormController.updatePremiumFields();
  });

  elements.addBenefitButton?.addEventListener("click", function () {
    benefitEditor.openAdd();
  });

  elements.closeBenefitEditorButton?.addEventListener("click", function () {
    benefitEditor.close();
  });

  elements.cancelBenefitButton?.addEventListener("click", function () {
    benefitEditor.close();
  });

  elements.policyTypeSelect?.addEventListener("change", function () {
    policyFormController.handlePolicyTypeChange();
  });

  elements.longTermCareBasePlanSelect?.addEventListener("change", function () {
    policyFormController.handleLongTermCareBasePlanChange();
  });

  elements.benefitPayoutTermSelect?.addEventListener("change", function () {
    benefitEditor.updatePayoutDurationField();
  });

  elements.benefitTypeSelect?.addEventListener("change", function () {
    benefitEditor.updateBenefitFields();
  });

  elements.saveBenefitButton?.addEventListener("click", function () {
    benefitEditor.save();
  });

  elements.policyLifeAssuredInput?.addEventListener("input", function () {
    policyFormController.syncSuggestedBenefitLifeAssured();
  });

  closeModalOnOverlayClick(elements.policyModal);

  closeModalOnEscape(elements.policyModal);
}

/* ========================================
   SAVE POLICY
======================================== */

function savePolicy() {
  clearPolicyFormMessage();

  const formData = readPolicyFormData(elements);

  const validationMessage = validatePolicyForm(formData);

  if (validationMessage) {
    showPolicyFormMessage(validationMessage);

    return;
  }

  const policyData = {
    policyName: formData.policyName,

    policyType: formData.policyType,

    longTermCareBasePlan: formData.longTermCareBasePlan,

    insurer: formData.insurer,

    policyNumber: formData.policyNumber,

    lifeAssured: formData.lifeAssured,

    status: formData.status,

    premium: getPolicyPremium(formData),

    benefits: draftBenefits,
  };

  if (editingPolicyId) {
    updatePolicy(editingPolicyId, policyData);
  } else {
    createPolicy(policyData);
  }

  renderInsurancePortfolio();

  policyModal.close();
}

function validatePolicyForm(formData) {
  if (!formData.policyName) {
    return "Enter the policy name.";
  }

  if (!formData.policyType) {
    return "Select a policy type.";
  }

  if (
    formData.policyType === "long_term_care" &&
    !formData.longTermCareBasePlan
  ) {
    return "Select the Long-Term Care base plan.";
  }

  if (!formData.lifeAssured) {
    return "Enter the life assured.";
  }

  if (!elements.insurerSelect.value) {
    return "Select an insurer.";
  }

  if (elements.insurerSelect.value === "other" && !formData.insurer) {
    return "Enter the insurer name.";
  }

  if (!formData.status) {
    return "Select the policy status.";
  }

  if (formData.status === "active") {
    if (formData.premiumAmount <= 0) {
      return "Enter the policy premium.";
    }

    if (!formData.premiumFrequency) {
      return "Select the premium frequency.";
    }
  }

  if (draftBenefits.length === 0) {
    return "Add at least one benefit to the policy.";
  }

  const firstError = getCurrentDraftPolicyValidationItems({
    lifeAssured: formData.lifeAssured,
  }).find(function (item) {
    return item.severity === "error" && !item.valid;
  });

  if (firstError) {
    return firstError.message;
  }

  return "";
}

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

function getPolicyPremium(formData) {
  if (formData.status === "paid_up") {
    return {
      amount: 0,
      frequency: null,
    };
  }

  return {
    amount: formData.premiumAmount,
    frequency: formData.premiumFrequency,
  };
}

function showPolicyFormMessage(message) {
  elements.policyFormMessage.textContent = message;

  elements.policyFormMessage.scrollIntoView({
    behavior: "smooth",

    block: "nearest",
  });
}

function clearPolicyFormMessage() {
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
   POLICY LIST RENDERING
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

  window.setTimeout(function () {
    matchingPolicy.classList.remove("policy-item--highlighted");
  }, 1800);
}