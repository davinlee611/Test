"use strict";

import {
  createUniqueId,
  escapeHtml,
  formatCurrency,
  getWholeNumber,
} from "../utils/client-utils.js";

import {
  openModal,
  closeModal,
  closeModalOnOverlayClick,
  closeModalOnEscape,
} from "../utils/modal.js";

import {
  BENEFIT_LABELS,
  PAYOUT_TYPE_LABELS,
  POLICY_STATUS_LABELS,
  POLICY_TYPE_LABELS,
  PREMIUM_FREQUENCY_LABELS,
} from "../constants/insurance.js";

import { getClientProfile } from "../state/client-plan.js";

import {
  getAllPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  removePolicy,
  clearPolicies,
} from "../services/policy-service.js";

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

let elements = {};

let draftBenefits = [];

let editingBenefitId = null;

let editingPolicyId = null;

/* ========================================
   BENEFIT CONFIGURATION
======================================== */

/* ========================================
   INITIALIZATION
======================================== */

export function initializeInsurancePortfolio() {
  cacheInsuranceElements();

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

  closePolicyModal();

  renderInsurancePortfolio();
}

/* ========================================
   CACHE ELEMENTS
======================================== */

function cacheInsuranceElements() {
  elements = {
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

    insurerSelect: document.getElementById("insurerSelect"),

    otherInsurerGroup: document.getElementById("otherInsurerGroup"),

    otherInsurerInput: document.getElementById("otherInsurerInput"),

    policyNumberInput: document.getElementById("policyNumberInput"),

    policyOwnerInput: document.getElementById("policyOwnerInput"),

    policyStatusSelect: document.getElementById("policyStatusSelect"),

    premiumInput: document.getElementById("premiumInput"),

    premiumFrequencySelect: document.getElementById("premiumFrequencySelect"),

    policyFormMessage: document.getElementById("policyFormMessage"),

    addBenefitButton: document.getElementById("addBenefitButton"),

    benefitEditor: document.getElementById("benefitEditor"),

    benefitEditorTitle: document.getElementById("benefitEditorTitle"),

    benefitPayoutInfo: document.getElementById("benefitPayoutInfo"),

    closeBenefitEditorButton: document.getElementById(
      "closeBenefitEditorButton",
    ),

    benefitTypeSelect: document.getElementById("benefitTypeSelect"),

    benefitLifeAssuredInput: document.getElementById("benefitLifeAssuredInput"),

    benefitAmountGroup: document.getElementById("benefitAmountGroup"),

    benefitAmountLabel: document.getElementById("benefitAmountLabel"),

    benefitAmountInput: document.getElementById("benefitAmountInput"),

    benefitPayoutTypeGroup: document.getElementById("benefitPayoutTypeGroup"),

    benefitPayoutTypeSelect: document.getElementById("benefitPayoutTypeSelect"),

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
  elements.addPolicyButton?.addEventListener("click", openAddPolicyModal);

  elements.closePolicyModalButton?.addEventListener("click", closePolicyModal);

  elements.cancelPolicyButton?.addEventListener("click", closePolicyModal);

  elements.savePolicyButton?.addEventListener("click", savePolicy);

  elements.insurerSelect?.addEventListener("change", handleInsurerChange);

  elements.addBenefitButton?.addEventListener("click", openAddBenefitEditor);

  elements.closeBenefitEditorButton?.addEventListener(
    "click",
    closeBenefitEditor,
  );

  elements.cancelBenefitButton?.addEventListener("click", closeBenefitEditor);

  elements.policyTypeSelect?.addEventListener("change", updateBenefitFields);

  elements.benefitTypeSelect?.addEventListener("change", updateBenefitFields);

  elements.saveBenefitButton?.addEventListener("click", saveBenefit);

  elements.policyBenefitList?.addEventListener("click", handleBenefitListClick);

  elements.policyList?.addEventListener("click", handlePolicyListClick);

  closeModalOnOverlayClick(elements.policyModal);

  closeModalOnEscape(elements.policyModal);
}

/* ========================================
   POLICY MODAL
======================================== */

function openAddPolicyModal() {
  editingPolicyId = null;

  resetPolicyForm();

  handleInsurerChange();

  elements.policyModalTitle.textContent = "Add Policy";

  elements.savePolicyButton.textContent = "Save Policy";

  elements.policyOwnerInput.value = getClientProfile().fullName || "";

  openModal(elements.policyModal);
}

function openEditPolicyModal(policyId) {
  const policy = getPolicyById(policyId);

  if (!policy) {
    return;
  }

  editingPolicyId = policy.id;

  resetPolicyForm();

  elements.policyModalTitle.textContent = "Edit Policy";

  elements.savePolicyButton.textContent = "Save Changes";

  elements.policyNameInput.value = policy.policyName || "";

  elements.policyTypeSelect.value = policy.policyType || "";

  populateInsurerFields(policy.insurer);

  elements.policyNumberInput.value = policy.policyNumber || "";

  elements.policyOwnerInput.value = policy.policyOwner || "";

  elements.policyStatusSelect.value = policy.status || "";

  elements.premiumInput.value = policy.premium?.amount || "";

  elements.premiumFrequencySelect.value = policy.premium?.frequency || "annual";

  draftBenefits = cloneBenefits(policy.benefits || []);

  renderDraftBenefits();

  openModal(elements.policyModal);
}

function closePolicyModal() {
  closeBenefitEditor();

  editingPolicyId = null;

  closeModal(elements.policyModal);
}

function resetPolicyForm() {
  elements.policyNameInput.value = "";

  elements.policyTypeSelect.value = "";

  elements.insurerSelect.value = "";

  elements.otherInsurerInput.value = "";

  elements.otherInsurerGroup.hidden = true;

  elements.policyNumberInput.value = "";

  elements.policyOwnerInput.value = "";

  elements.policyStatusSelect.value = "";

  elements.premiumInput.value = "";

  elements.premiumFrequencySelect.value = "annual";

  elements.policyFormMessage.textContent = "";

  draftBenefits = [];

  editingBenefitId = null;

  closeBenefitEditor();

  renderDraftBenefits();
}

function handleInsurerChange() {
  const isOtherSelected = elements.insurerSelect.value === "other";

  elements.otherInsurerGroup.hidden = !isOtherSelected;

  elements.otherInsurerInput.required = isOtherSelected;

  if (!isOtherSelected) {
    elements.otherInsurerInput.value = "";
  }
}

function populateInsurerFields(insurer) {
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

  handleInsurerChange();

  if (elements.insurerSelect.value === "other") {
    elements.otherInsurerInput.value = savedInsurer;
  }
}

/* ========================================
   SAVE POLICY
======================================== */

function savePolicy() {
  clearPolicyFormMessage();

  const formData = getPolicyFormData();

  const validationMessage = validatePolicyForm(formData);

  if (validationMessage) {
    showPolicyFormMessage(validationMessage);

    return;
  }

  if (editingPolicyId) {
    updatePolicy(editingPolicyId, {
      policyName: formData.policyName,

      policyType: formData.policyType,

      insurer: formData.insurer,

      policyNumber: formData.policyNumber,

      policyOwner: formData.policyOwner,

      status: formData.status,

      premium: {
        amount: formData.premiumAmount,

        frequency: formData.premiumFrequency,
      },

      benefits: cloneBenefits(draftBenefits),
    });
  } else {
    createPolicy(createPolicyObject(formData));
  }

  renderInsurancePortfolio();

  closePolicyModal();
}

function getPolicyFormData() {
  const selectedInsurer = elements.insurerSelect.value;

  const insurer =
    selectedInsurer === "other"
      ? elements.otherInsurerInput.value.trim()
      : selectedInsurer;

  return {
    policyName: elements.policyNameInput.value.trim(),

    policyType: elements.policyTypeSelect.value,

    insurer,

    policyNumber: elements.policyNumberInput.value.trim(),

    policyOwner: elements.policyOwnerInput.value.trim(),

    status: elements.policyStatusSelect.value,

    premiumAmount: getWholeNumber(elements.premiumInput.value),

    premiumFrequency: elements.premiumFrequencySelect.value,
  };
}

function validatePolicyForm(formData) {
  if (!formData.policyName) {
    return "Enter the policy name.";
  }

  if (!formData.policyType) {
    return "Select a policy type.";
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

  if (elements.premiumInput.value !== "" && formData.premiumAmount <= 0) {
    return "Enter a premium greater than zero, or leave the premium blank.";
  }

  if (draftBenefits.length === 0) {
    return "Add at least one benefit to the policy.";
  }

  const benefitErrors = validatePolicyBenefits(draftBenefits);

  if (benefitErrors.length > 0) {
    return benefitErrors[0];
  }

  return "";
}

function validatePolicyBenefits(benefits) {
  const errors = [];

  const deathBenefits = benefits.filter(function (benefit) {
    return benefit.type === "death";
  });

  const deathBenefit = deathBenefits[0] ?? null;

  const criticalIllnessBenefits = benefits.filter(function (benefit) {
    return benefit.type === "critical_illness";
  });

  const acceleratedCiBenefits = criticalIllnessBenefits.filter(
    function (benefit) {
      return benefit.payoutType === "accelerated";
    },
  );

  const earlyCiBenefits = benefits.filter(function (benefit) {
    return benefit.type === "early_critical_illness";
  });

  if (deathBenefits.length > 1) {
    errors.push("A policy can only contain one Death benefit.");
  }

  acceleratedCiBenefits.forEach(function (ciBenefit) {
    if (!deathBenefit) {
      errors.push(
        "Accelerated Critical Illness requires a Death benefit in the same policy.",
      );

      return;
    }

    if (ciBenefit.amount > deathBenefit.amount) {
      errors.push(
        `Accelerated Critical Illness cannot exceed the Death sum assured of ${formatCurrency(
          deathBenefit.amount,
        )}.`,
      );
    }
  });

  earlyCiBenefits.forEach(function (earlyCiBenefit) {
    const relatedCiBenefit = findRelatedCriticalIllnessBenefit(
      criticalIllnessBenefits,
    );

    if (!deathBenefit) {
      errors.push(
        "Early Critical Illness requires a Death benefit in the same policy.",
      );
    }

    if (!relatedCiBenefit) {
      errors.push(
        "Early Critical Illness requires a Critical Illness benefit in the same policy.",
      );
    }

    if (deathBenefit && earlyCiBenefit.amount > deathBenefit.amount) {
      errors.push(
        `Early Critical Illness cannot exceed the Death sum assured of ${formatCurrency(
          deathBenefit.amount,
        )}.`,
      );
    }

    if (relatedCiBenefit && earlyCiBenefit.amount > relatedCiBenefit.amount) {
      errors.push(
        `Early Critical Illness cannot exceed the Critical Illness sum assured of ${formatCurrency(
          relatedCiBenefit.amount,
        )}.`,
      );
    }
  });

  return [...new Set(errors)];
}

function findRelatedCriticalIllnessBenefit(criticalIllnessBenefits) {
  if (criticalIllnessBenefits.length === 0) {
    return null;
  }

  const acceleratedCiBenefit = criticalIllnessBenefits.find(function (benefit) {
    return benefit.payoutType === "accelerated";
  });

  return acceleratedCiBenefit ?? criticalIllnessBenefits[0];
}

function renderPolicyValidation() {
  if (!elements.policyValidationSection || !elements.policyValidationList) {
    return;
  }

  elements.policyValidationList.innerHTML = "";

  if (draftBenefits.length === 0) {
    elements.policyValidationSection.hidden = true;

    return;
  }

  elements.policyValidationSection.hidden = false;

  const validationItems = getPolicyValidationItems();

  validationItems.forEach(function (item) {
    const validationItem = document.createElement("div");

    validationItem.className = item.valid
      ? "policy-validation-item policy-validation-item--valid"
      : "policy-validation-item policy-validation-item--invalid";

    const iconClass = item.valid
      ? "fa-solid fa-circle-check"
      : "fa-solid fa-circle-exclamation";

    validationItem.innerHTML = `
                <i
                    class="${iconClass}"
                    aria-hidden="true"
                ></i>

                <span>
                    ${escapeHtml(item.message)}
                </span>
            `;

    elements.policyValidationList.appendChild(validationItem);
  });
}

function getPolicyValidationItems() {
  const items = [];

  const deathBenefits = draftBenefits.filter(function (benefit) {
    return benefit.type === "death";
  });

  const deathBenefit = deathBenefits[0] ?? null;

  const criticalIllnessBenefits = draftBenefits.filter(function (benefit) {
    return benefit.type === "critical_illness";
  });

  const acceleratedCiBenefits = criticalIllnessBenefits.filter(
    function (benefit) {
      return benefit.payoutType === "accelerated";
    },
  );

  const earlyCiBenefits = draftBenefits.filter(function (benefit) {
    return benefit.type === "early_critical_illness";
  });

  if (deathBenefits.length > 0) {
    items.push({
      valid: deathBenefits.length === 1,

      message:
        deathBenefits.length === 1
          ? "One Death benefit recorded."
          : "A policy can only contain one Death benefit.",
    });
  }

  acceleratedCiBenefits.forEach(function (ciBenefit) {
    if (!deathBenefit) {
      items.push({
        valid: false,

        message: "Accelerated CI requires a Death benefit.",
      });

      return;
    }

    const amountIsValid = ciBenefit.amount <= deathBenefit.amount;

    items.push({
      valid: amountIsValid,

      message: amountIsValid
        ? "Accelerated CI does not exceed the Death sum assured."
        : `Accelerated CI exceeds the Death sum assured of ${formatCurrency(
            deathBenefit.amount,
          )}.`,
    });
  });

  earlyCiBenefits.forEach(function (earlyCiBenefit) {
    const relatedCiBenefit = findRelatedCriticalIllnessBenefit(
      criticalIllnessBenefits,
    );

    if (!deathBenefit) {
      items.push({
        valid: false,

        message: "Early CI requires a Death benefit.",
      });
    }

    if (!relatedCiBenefit) {
      items.push({
        valid: false,

        message: "Early CI requires a Critical Illness benefit.",
      });
    }

    if (deathBenefit) {
      const belowDeath = earlyCiBenefit.amount <= deathBenefit.amount;

      items.push({
        valid: belowDeath,

        message: belowDeath
          ? "Early CI does not exceed the Death sum assured."
          : `Early CI exceeds the Death sum assured of ${formatCurrency(
              deathBenefit.amount,
            )}.`,
      });
    }

    if (relatedCiBenefit) {
      const belowCi = earlyCiBenefit.amount <= relatedCiBenefit.amount;

      items.push({
        valid: belowCi,

        message: belowCi
          ? "Early CI does not exceed the Critical Illness sum assured."
          : `Early CI exceeds the Critical Illness sum assured of ${formatCurrency(
              relatedCiBenefit.amount,
            )}.`,
      });
    }
  });

  if (
    acceleratedCiBenefits.length === 0 &&
    earlyCiBenefits.length === 0 &&
    deathBenefits.length <= 1
  ) {
    items.push({
      valid: true,

      message: "No CI or Early CI conflicts detected.",
    });
  }

  return items;
}

function createPolicyObject(formData) {
  return {
    id: createUniqueId(),

    policyName: formData.policyName,

    policyType: formData.policyType,

    insurer: formData.insurer,

    policyNumber: formData.policyNumber,

    policyOwner: formData.policyOwner,

    status: formData.status,

    premium: {
      amount: formData.premiumAmount,

      frequency: formData.premiumFrequency,
    },

    benefits: cloneBenefits(draftBenefits),
  };
}

function cloneBenefits(benefits) {
  return benefits.map(function (benefit) {
    return {
      ...benefit,
    };
  });
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
   BENEFIT EDITOR
======================================== */

function openAddBenefitEditor() {
  editingBenefitId = null;

  resetBenefitForm();

  elements.benefitLifeAssuredInput.value = getClientProfile().fullName || "";

  elements.benefitEditorTitle.textContent = "Add Benefit";

  elements.saveBenefitButton.textContent = "Add Benefit";

  elements.benefitEditor.hidden = false;

  elements.benefitEditor.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  elements.benefitTypeSelect.focus();
}

function openEditBenefitEditor(benefitId) {
  const benefit = draftBenefits.find(function (item) {
    return item.id === benefitId;
  });

  if (!benefit) {
    return;
  }

  editingBenefitId = benefit.id;

  elements.benefitEditorTitle.textContent = "Edit Benefit";

  elements.saveBenefitButton.textContent = "Save Changes";

  elements.benefitTypeSelect.value = benefit.type;

  elements.benefitLifeAssuredInput.value = benefit.lifeAssured;

  elements.benefitAmountInput.value = benefit.amount;

  elements.benefitPayoutTypeSelect.value = benefit.payoutType ?? "";

  elements.benefitNotesInput.value = benefit.notes;

  elements.benefitFormMessage.textContent = "";

  updateBenefitFields();

  elements.benefitEditor.hidden = false;

  elements.benefitEditor.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  elements.benefitTypeSelect.focus();
}

function closeBenefitEditor() {
  if (!elements.benefitEditor) {
    return;
  }

  elements.benefitEditor.hidden = true;

  editingBenefitId = null;

  elements.benefitEditorTitle.textContent = "Add Benefit";

  elements.saveBenefitButton.textContent = "Add Benefit";

  resetBenefitForm();
}

function resetBenefitForm() {
  if (!elements.benefitTypeSelect) {
    return;
  }

  elements.benefitTypeSelect.value = "";

  elements.benefitLifeAssuredInput.value = "";

  elements.benefitAmountInput.value = "";

  elements.benefitPayoutTypeSelect.value = "";

  elements.benefitNotesInput.value = "";

  elements.benefitFormMessage.textContent = "";

  updateBenefitFields();
}

function updateBenefitFields() {
  const benefitType = elements.benefitTypeSelect.value;

  const policyType = elements.policyTypeSelect.value;

  const isWholeLifeTpd = policyType === "whole_life" && benefitType === "tpd";

  const requiresPayoutType =
    benefitType === "critical_illness" ||
    benefitType === "early_critical_illness";

  /*
   * CI and ECI:
   * Show the payout type dropdown.
   *
   * Whole Life TPD:
   * Hide the dropdown because it is
   * always accelerated.
   */
  elements.benefitPayoutTypeGroup.hidden =
    !requiresPayoutType || isWholeLifeTpd;

  /*
   * Only show the information message
   * for Whole Life TPD.
   */
  elements.benefitPayoutInfo.hidden = !isWholeLifeTpd;

  if (isWholeLifeTpd) {
    elements.benefitPayoutTypeSelect.value = "accelerated";
  } else if (!requiresPayoutType) {
    elements.benefitPayoutTypeSelect.value = "";
  }

  elements.benefitAmountLabel.innerHTML = getBenefitAmountLabel(benefitType);
}

function getBenefitAmountLabel(benefitType) {
  switch (benefitType) {
    case "hospital_cash":
      return `
                Daily Cash Benefit
                <span class="required-label">*</span>
            `;

    case "disability_income":
      return `
                Monthly Benefit
                <span class="required-label">*</span>
            `;

    case "hospitalisation":
      return `
                Coverage Amount
                <span class="optional-label">
                    (Optional)
                </span>
            `;

    default:
      return `
                Coverage Amount
                <span class="required-label">*</span>
            `;
  }
}

/* ========================================
   SAVE BENEFIT
======================================== */

function saveBenefit() {
  const formData = getBenefitFormData();

  const validationMessage = validateBenefit(formData);

  if (validationMessage) {
    elements.benefitFormMessage.textContent = validationMessage;

    return;
  }

  if (editingBenefitId) {
    updateDraftBenefit(formData);
  } else {
    addDraftBenefit(formData);
  }

  renderDraftBenefits();

  closeBenefitEditor();
}

function getBenefitFormData() {
  const benefitType = elements.benefitTypeSelect.value;

  const policyType = elements.policyTypeSelect.value;

  let payoutType = elements.benefitPayoutTypeSelect.value || null;

  if (policyType === "whole_life" && benefitType === "tpd") {
    payoutType = "accelerated";
  }

  return {
    type: benefitType,

    lifeAssured: elements.benefitLifeAssuredInput.value.trim(),

    amount: getWholeNumber(elements.benefitAmountInput.value),

    payoutType,

    notes: elements.benefitNotesInput.value.trim(),
  };
}

function validateBenefit(formData) {
  if (!formData.type) {
    return "Select a benefit type.";
  }

  const amountIsOptional = formData.type === "hospitalisation";

  if (!amountIsOptional && formData.amount <= 0) {
    return "Enter a coverage amount greater than zero.";
  }

  const requiresPayoutType =
    formData.type === "critical_illness" ||
    formData.type === "early_critical_illness";

  if (requiresPayoutType && !formData.payoutType) {
    return "Select whether the payout is accelerated, additional or standalone.";
  }

  return "";
}

function addDraftBenefit(formData) {
  draftBenefits.push({
    id: createUniqueId(),

    type: formData.type,

    lifeAssured: formData.lifeAssured,

    amount: formData.amount,

    payoutType: formData.payoutType,

    notes: formData.notes,
  });
}

function updateDraftBenefit(formData) {
  const benefitIndex = draftBenefits.findIndex(function (benefit) {
    return benefit.id === editingBenefitId;
  });

  if (benefitIndex === -1) {
    return;
  }

  draftBenefits[benefitIndex] = {
    ...draftBenefits[benefitIndex],

    type: formData.type,

    lifeAssured: formData.lifeAssured,

    amount: formData.amount,

    payoutType: formData.payoutType,

    notes: formData.notes,
  };
}

/* ========================================
   BENEFIT ACTIONS
======================================== */

function handleBenefitListClick(event) {
  const actionButton = event.target.closest("[data-benefit-action]");

  if (!actionButton) {
    return;
  }

  const benefitId = actionButton.dataset.benefitId;

  const action = actionButton.dataset.benefitAction;

  if (!benefitId) {
    return;
  }

  if (action === "edit") {
    openEditBenefitEditor(benefitId);

    return;
  }

  if (action === "delete") {
    if (!window.confirm("Delete this benefit?")) {
      return;
    }

    deleteDraftBenefit(benefitId);
  }
}

function deleteDraftBenefit(benefitId) {
  draftBenefits = draftBenefits.filter(function (benefit) {
    return benefit.id !== benefitId;
  });

  if (editingBenefitId === benefitId) {
    closeBenefitEditor();
  }

  renderDraftBenefits();
}

/* ========================================
   DRAFT BENEFIT RENDERING
======================================== */

function renderDraftBenefits() {
  if (!elements.policyBenefitList) {
    return;
  }

  elements.policyBenefitList.innerHTML = "";

  if (draftBenefits.length === 0) {
    renderEmptyBenefitMessage();

    renderPolicyValidation();

    return;
  }

  draftBenefits.forEach(function (benefit) {
    elements.policyBenefitList.appendChild(createBenefitElement(benefit));
  });

  renderPolicyValidation();
}

function renderEmptyBenefitMessage() {
  const message = document.createElement("p");

  message.id = "emptyPolicyBenefitMessage";

  message.className = "empty-state-message";

  message.textContent = "No benefits added yet.";

  elements.emptyPolicyBenefitMessage = message;

  elements.policyBenefitList.appendChild(message);
}

function createBenefitElement(benefit) {
  const item = document.createElement("article");

  item.className = "planning-card-item benefit-item";

  const benefitLabel = BENEFIT_LABELS[benefit.type] ?? "Insurance Benefit";

  const amountLabel = getBenefitAmountDescription(benefit);

  const lifeAssuredText = benefit.lifeAssured
    ? `
                <span>
                    Life Assured:
                    ${escapeHtml(benefit.lifeAssured)}
                </span>
            `
    : "";

  item.innerHTML = `
        <div class="planning-card-content">

            <div class="planning-card-icon">
                <i class="fa-solid fa-shield-heart"></i>
            </div>

            <div class="planning-card-details">

    <div class="benefit-title-row">

        <h4>
            ${escapeHtml(benefitLabel)}
        </h4>

        ${createBenefitBadge(benefit)}

    </div>

    <p>
        ${escapeHtml(amountLabel)}
    </p>

    ${
      lifeAssuredText
        ? `
                <div class="benefit-item-meta">
                    ${lifeAssuredText}
                </div>
            `
        : ""
    }

</div>

        </div>

        <div class="planning-card-actions">

    <button
    type="button"
    class="planning-card-action"
    data-benefit-action="edit"
    data-benefit-id="${escapeHtml(benefit.id)}"
    aria-label="Edit Benefit"
    title="Edit Benefit"
>
    <i
        class="fa-solid fa-pen"
        aria-hidden="true"
    ></i>
</button>

<button
    type="button"
    class="planning-card-action delete"
    data-benefit-action="delete"
    data-benefit-id="${escapeHtml(benefit.id)}"
    aria-label="Delete Benefit"
    title="Delete Benefit"
>
    <i
        class="fa-solid fa-trash"
        aria-hidden="true"
    ></i>
</button>

</div>
    `;

  return item;
}

function getBenefitAmountDescription(benefit) {
  if (benefit.type === "hospitalisation" && benefit.amount <= 0) {
    return "Hospitalisation coverage";
  }

  const formattedAmount = formatCurrency(benefit.amount);

  switch (benefit.type) {
    case "hospital_cash":
      return `${formattedAmount} per day`;

    case "disability_income":
      return `${formattedAmount} per month`;

    default:
      return formattedAmount;
  }
}

function createBenefitBadge(benefit) {
  if (benefit.type === "critical_illness") {
    if (benefit.payoutType === "accelerated") {
      return `
                <span class="benefit-badge badge-accelerated">
                    Accelerated
                </span>
            `;
    }

    if (benefit.payoutType === "additional") {
      return `
                <span class="benefit-badge badge-additional">
                    Additional
                </span>
            `;
    }

    return `
            <span class="benefit-badge badge-standalone">
                Standalone
            </span>
        `;
  }

  if (benefit.type === "early_critical_illness") {
    return `
            <span class="benefit-badge badge-eci">
                Early CI
            </span>
        `;
  }

  return "";
}

/* ========================================
   POLICY LIST RENDERING
======================================== */

function renderInsurancePortfolio() {
  renderPolicies();
}

function renderPolicies() {
  if (!elements.policyList) {
    return;
  }

  const policies = getAllPolicies();

  elements.policyList.innerHTML = "";

  if (policies.length === 0) {
    renderEmptyPolicyMessage();

    return;
  }

  policies.forEach(function (policy) {
    elements.policyList.appendChild(createPolicyElement(policy));
  });
}

function renderEmptyPolicyMessage() {
  const message = document.createElement("p");

  message.id = "emptyPolicyMessage";

  message.className = "empty-state-message";

  message.textContent = "No policies added yet.";

  elements.emptyPolicyMessage = message;

  elements.policyList.appendChild(message);
}

function createPolicyElement(policy) {
  const item = document.createElement("article");

  item.className = "planning-card-item policy-item";

  const policyName = policy.policyName || "Unnamed Policy";

  const policyType = POLICY_TYPE_LABELS[policy.policyType] || "Other";

  const insurer = policy.insurer || "Insurer not specified";

  const status = POLICY_STATUS_LABELS[policy.status] || "Status not specified";

  const premiumDescription = getPremiumDescription(policy.premium);

  const benefitCount = Array.isArray(policy.benefits)
    ? policy.benefits.length
    : 0;

  const benefitText =
    benefitCount === 1 ? "1 benefit" : `${benefitCount} benefits`;

  const policyNumberText = policy.policyNumber
    ? `
                <span>
                    Policy No:
                    ${escapeHtml(policy.policyNumber)}
                </span>
            `
    : "";

  const policyOwnerText = policy.policyOwner
    ? `
                <span>
                    Owner:
                    ${escapeHtml(policy.policyOwner)}
                </span>
            `
    : "";

  item.innerHTML = `
    <div class="planning-card-content">

        <div class="planning-card-icon">
            <i
                class="fa-solid fa-shield-halved"
                aria-hidden="true"
            ></i>
        </div>

        <div class="planning-card-details">

            <h4>
                ${escapeHtml(policyName)}
            </h4>

            <p>
                ${escapeHtml(insurer)}
                ·
                ${escapeHtml(policyType)}
            </p>

            <div class="benefit-item-meta">

                <span>
                    ${escapeHtml(status)}
                </span>

                <span>
                    ${escapeHtml(premiumDescription)}
                </span>

                <span>
                    ${escapeHtml(benefitText)}
                </span>

                ${policyNumberText}

                ${policyOwnerText}

            </div>

        </div>

    </div>

    <div class="planning-card-actions">

        <button
            type="button"
            class="planning-card-action"
            data-policy-action="edit"
            data-policy-id="${escapeHtml(policy.id)}"
            aria-label="Edit policy"
            title="Edit policy"
        >
            <i
                class="fa-solid fa-pen"
                aria-hidden="true"
            ></i>
        </button>

        <button
    type="button"
    class="planning-card-action delete"
    data-policy-action="delete"
    data-policy-id="${escapeHtml(policy.id)}"
    aria-label="Delete policy"
    title="Delete policy"
>
    <i
        class="fa-solid fa-trash"
        aria-hidden="true"
    ></i>
</button>

    </div>
`;

  return item;
}

function handlePolicyListClick(event) {
  const actionButton = event.target.closest("[data-policy-action]");

  if (!actionButton) {
    return;
  }

  const policyId = actionButton.dataset.policyId;

  const action = actionButton.dataset.policyAction;

  if (action === "edit") {
    openEditPolicyModal(policyId);

    return;
  }

  if (action === "delete") {
    const policy = getPolicyById(policyId);

    const confirmed = window.confirm(
      `Delete "${policy?.policyName || "this policy"}"?`,
    );

    if (!confirmed) {
      return;
    }

    handleDeletePolicy(policyId);
    return;
  }
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

function getPremiumDescription(premium) {
  if (!premium || premium.amount <= 0) {
    return "Premium not provided";
  }

  const frequencyLabel =
    PREMIUM_FREQUENCY_LABELS[premium.frequency] || "Premium";

  return [formatCurrency(premium.amount), frequencyLabel].join(" · ");
}
