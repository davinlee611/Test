"use strict";

import { getClientProfile } from "../state/client-plan.js";

import { readPolicyFormData } from "./insurance/policy-form-data.js";

import { createPolicyModal } from "./insurance/policy-modal.js";

import { renderDraftBenefitList } from "./insurance/draft-benefit-renderer.js";

import { renderPolicyValidationItems } from "./insurance/validation-renderer.js";

import { createBenefitEditor } from "./insurance/benefit-editor.js";

import { createPolicyFormController } from "./insurance/policy-form-controller.js";

import { renderInsurancePortfolioView } from "./insurance/portfolio-renderer.js";

import { getInsuranceElements } from "./insurance/insurance-elements.js";

import { bindInsuranceEvents } from "./insurance/insurance-event-binder.js";

import { createPolicyWorkflow } from "./insurance/policy-workflow.js";

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

let elements = {};

let policyWorkflow = null;

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

  createInsuranceComponents();

  if (!moduleInitialized) {
    bindModuleEvents();

    moduleInitialized = true;
  }

  renderInsurancePortfolio();
}

/* ========================================
   COMPONENT CREATION
======================================== */

function createInsuranceComponents() {
  createWorkflow();

  createBenefitEditorController();

  createPolicyFormControllerInstance();

  createPolicyModalController();
}

/* ========================================
   POLICY WORKFLOW
======================================== */

function createWorkflow() {
  policyWorkflow = createPolicyWorkflow({
    getDraftBenefits() {
      return draftBenefits;
    },

    getEditingPolicyId() {
      return editingPolicyId;
    },
  });
}

/* ========================================
   BENEFIT EDITOR
======================================== */

function createBenefitEditorController() {
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
}

/* ========================================
   POLICY FORM CONTROLLER
======================================== */

function createPolicyFormControllerInstance() {
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
}

/* ========================================
   POLICY MODAL
======================================== */

function createPolicyModalController() {
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

    updateHospitalisationFields() {
      policyFormController.updateHospitalisationFields();
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
  policyWorkflow?.resetPolicies();

  resetModuleState();

  policyModal?.close();

  renderInsurancePortfolio();
}

function resetModuleState() {
  draftBenefits = [];

  editingBenefitId = null;

  editingPolicyId = null;

  previousPolicyType = "";
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

    onHospitalisationRiderChange() {
      policyFormController.updateHospitalisationRiderFields();

      policyFormController.syncHospitalisationBaseBenefit();

      renderDraftBenefits();
    },

    onHospitalisationRiderTypeChange() {
      policyFormController.syncHospitalisationBaseBenefit();

      renderDraftBenefits();
    },

    onHospitalisationWardTypeChange() {
      policyFormController.syncHospitalisationBaseBenefit();

      renderDraftBenefits();
    },

    onHospitalisationBasePremiumChange() {
      policyFormController.handleHospitalisationBasePremiumInput();
    },

    onHospitalisationPremiumChange() {
      policyFormController.updateHospitalisationPremiumPayment();
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

    onLongTermCarePremiumChange(event) {
      if (event?.currentTarget === elements.longTermCareMedisaveInput) {
        policyFormController.updateLongTermCarePremiumPayment();

        return;
      }

      policyFormController.handleLongTermCarePremiumInput();
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

  policyFormController.syncHospitalisationBaseBenefit();

  const formData = readPolicyFormData(elements);

  const result = policyWorkflow.save({
    formData,

    insurerSelection: elements.insurerSelect.value,
  });

  if (!result.success) {
    showPolicyFormMessage(result.message);

    return;
  }

  renderInsurancePortfolio();

  policyModal.close();
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

  renderDraftPolicyValidation();
}

/* ========================================
   DRAFT POLICY VALIDATION
======================================== */

function renderDraftPolicyValidation() {
  const validationItems = policyWorkflow.getDraftValidationItems({
    lifeAssured: elements.policyLifeAssuredInput.value.trim(),
  });

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
   PORTFOLIO RENDERING
======================================== */

function renderInsurancePortfolio() {
  if (!policyWorkflow) {
    return;
  }

  const {
    policies,

    validationContext,
  } = policyWorkflow.getPortfolioData();

  renderInsurancePortfolioView({
    elements,

    policies,

    validationContext,

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
  const policyName = policy.policyName || "this policy";

  const confirmed = window.confirm(`Delete "${policyName}"?`);

  if (!confirmed) {
    return;
  }

  const removed = policyWorkflow.deletePolicy(policy.id);

  if (!removed) {
    return;
  }

  renderInsurancePortfolio();
}

/* ========================================
   LIFE ASSURED HELPER
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

/* ========================================
   VALIDATION NAVIGATION
======================================== */

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

  highlightPolicy(matchingPolicy);
}

function highlightPolicy(policyElement) {
  policyElement.classList.remove("policy-item--highlighted");

  window.requestAnimationFrame(function () {
    policyElement.classList.add("policy-item--highlighted");
  });

  window.setTimeout(
    function () {
      policyElement.classList.remove("policy-item--highlighted");
    },

    1800,
  );
}
