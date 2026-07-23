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
  HOSPITAL_CLASS_LABELS,
  PAYOUT_TYPE_LABELS,
  POLICY_STATUS_LABELS,
  POLICY_TYPE_BENEFIT_OPTIONS,
  POLICY_TYPE_DEFAULT_BENEFITS,
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

import {
  createPlanningCard,
  createPlanningCardIcon,
  createPlanningCardDetails,
  createPlanningCardActions,
  createPlanningCardButton,
  renderPlanningEmptyState,
} from "../components/planning-card.js";

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

let elements = {};

let draftBenefits = [];

let editingBenefitId = null;

let editingPolicyId = null;

let previousPolicyType = "";

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
  elements.addPolicyButton?.addEventListener("click", openAddPolicyModal);

  elements.closePolicyModalButton?.addEventListener("click", closePolicyModal);

  elements.cancelPolicyButton?.addEventListener("click", closePolicyModal);

  elements.savePolicyButton?.addEventListener("click", savePolicy);

  elements.insurerSelect?.addEventListener("change", handleInsurerChange);

  elements.policyStatusSelect?.addEventListener("change", updatePremiumFields);

  elements.addBenefitButton?.addEventListener("click", openAddBenefitEditor);

  elements.closeBenefitEditorButton?.addEventListener(
    "click",
    closeBenefitEditor,
  );

  elements.cancelBenefitButton?.addEventListener("click", closeBenefitEditor);

  elements.policyTypeSelect?.addEventListener("change", handlePolicyTypeChange);

  elements.benefitTypeSelect?.addEventListener("change", updateBenefitFields);

  elements.saveBenefitButton?.addEventListener("click", saveBenefit);

  elements.policyLifeAssuredInput?.addEventListener(
    "input",
    syncSuggestedBenefitLifeAssured,
  );

  closeModalOnOverlayClick(elements.policyModal);

  closeModalOnEscape(elements.policyModal);
}

function syncSuggestedBenefitLifeAssured() {
  const lifeAssured = elements.policyLifeAssuredInput.value.trim();

  draftBenefits.forEach(function (benefit) {
    if (benefit.isSuggested) {
      benefit.lifeAssured = lifeAssured;
    }
  });

  renderDraftBenefits();
}

/* ========================================
   POLICY MODAL
======================================== */

function openAddPolicyModal() {
  editingPolicyId = null;

  resetPolicyForm();

  previousPolicyType = "";

  handleInsurerChange();

  elements.policyModalTitle.textContent = "Add Policy";

  elements.savePolicyButton.textContent = "Save Policy";

  elements.policyLifeAssuredInput.value = getClientProfile().fullName || "";

  updatePremiumFields();

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

  previousPolicyType = policy.policyType || "";

  populateInsurerFields(policy.insurer);

  elements.policyNumberInput.value = policy.policyNumber || "";

  elements.policyLifeAssuredInput.value =
    policy.lifeAssured || getLifeAssuredFromBenefits(policy.benefits) || "";

  elements.policyStatusSelect.value = policy.status || "";

  elements.premiumInput.value = policy.premium?.amount || "";

  elements.premiumFrequencySelect.value = policy.premium?.frequency || "annual";

  draftBenefits = cloneBenefits(policy.benefits || []);

  updatePremiumFields();

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

  elements.policyLifeAssuredInput.value = "";

  elements.policyStatusSelect.value = "";

  elements.premiumInput.value = "";

  elements.premiumFrequencySelect.value = "";

  elements.policyFormMessage.textContent = "";

  draftBenefits = [];

  editingBenefitId = null;

  previousPolicyType = "";

  updatePremiumFields();

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

      lifeAssured: formData.lifeAssured,

      status: formData.status,

      premium: getPolicyPremium(formData),

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

    lifeAssured: elements.policyLifeAssuredInput.value.trim(),

    insurer,

    policyNumber: elements.policyNumberInput.value.trim(),

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

  const firstError = getPolicyValidationItems(draftBenefits).find(
    function (item) {
      return item.severity === "error" && !item.valid;
    },
  );

  if (firstError) {
    return firstError.message;
  }

  return "";
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

  const validationItems = getPolicyValidationItems(draftBenefits);

  const hasErrors = validationItems.some(function (item) {
    return item.severity === "error" && !item.valid;
  });

  if (!hasErrors) {
    elements.policyFormMessage.textContent = "";
  }

  elements.policyValidationList.innerHTML = "";

  if (draftBenefits.length === 0) {
    elements.policyValidationSection.hidden = true;

    return;
  }

  elements.policyValidationSection.hidden = false;

  validationItems.forEach(function (item) {
    const validationItem = document.createElement("div");

    let stateClass = "policy-validation-item--valid";

    let iconClass = "fa-solid fa-circle-check";

    if (item.severity === "error") {
      stateClass = "policy-validation-item--invalid";

      iconClass = "fa-solid fa-circle-exclamation";
    } else if (item.severity === "review") {
      stateClass = "policy-validation-item--review";

      iconClass = "fa-solid fa-triangle-exclamation";
    }

    validationItem.className = `policy-validation-item ${stateClass}`;

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

function getPolicyValidationItems(benefits) {
  const items = [];

  const deathBenefits = benefits.filter(function (benefit) {
    return benefit.type === "death";
  });

  const deathBenefit = deathBenefits[0] ?? null;

  if (deathBenefit) {
    const amountIsValid = deathBenefit.amount > 0;

    items.push({
      severity: amountIsValid ? "pass" : "error",

      valid: amountIsValid,

      message: amountIsValid
        ? "Death sum assured is greater than $0."
        : "Death sum assured must be greater than $0.",
    });
  }

  const tpdBenefits = benefits.filter(function (benefit) {
    return benefit.type === "tpd";
  });

  if (tpdBenefits.length > 0) {
    const hasOneTpdBenefit = tpdBenefits.length === 1;

    items.push({
      severity: hasOneTpdBenefit ? "pass" : "error",

      valid: hasOneTpdBenefit,

      message: hasOneTpdBenefit
        ? "One TPD benefit recorded."
        : "A policy can only contain one TPD benefit.",
    });
  }

  if (tpdBenefits.length === 1 && deathBenefit) {
    const belowDeath = tpdBenefits[0].amount <= deathBenefit.amount;

    items.push({
      severity: belowDeath ? "pass" : "error",

      valid: belowDeath,

      message: belowDeath
        ? "TPD does not exceed the Death sum assured."
        : `TPD exceeds the Death sum assured of ${formatCurrency(
            deathBenefit.amount,
          )}.`,
    });
  }

  if (tpdBenefits.length > 0 && !deathBenefit) {
    items.push({
      severity: "review",

      valid: true,

      message: "TPD benefit exists without a Death benefit.",
    });
  }

  const hospitalisationBenefits = benefits.filter(function (benefit) {
    return benefit.type === "hospitalisation";
  });

  if (hospitalisationBenefits.length > 0) {
    const hasOneHospitalisationBenefit = hospitalisationBenefits.length === 1;

    items.push({
      severity: hasOneHospitalisationBenefit ? "pass" : "error",

      valid: hasOneHospitalisationBenefit,

      message: hasOneHospitalisationBenefit
        ? "One Hospitalisation benefit recorded."
        : "A policy can only contain one Hospitalisation benefit.",
    });
  }

  const hospitalCashBenefits = benefits.filter(function (benefit) {
    return benefit.type === "hospital_cash";
  });

  if (hospitalCashBenefits.length > 1) {
    items.push({
      severity: "review",

      valid: true,

      message: `Multiple Hospital Cash benefits found (${hospitalCashBenefits.length}).`,
    });
  }

  const medicalBenefits = benefits.filter(function (benefit) {
    return benefit.type === "medical_reimbursement";
  });

  if (medicalBenefits.length > 1) {
    items.push({
      severity: "review",

      valid: true,

      message: `Multiple Medical Reimbursement benefits found (${medicalBenefits.length}).`,
    });
  }

  const longTermCareBenefits = benefits.filter(function (benefit) {
    return benefit.type === "long_term_care_income";
  });

  if (longTermCareBenefits.length > 1) {
    items.push({
      severity: "review",

      valid: true,

      message: `Multiple Long-Term Care benefits found (${longTermCareBenefits.length}).`,
    });
  }

  const monthlyBenefits = benefits.filter(function (benefit) {
    return benefit.type === "monthly_benefit";
  });

  if (monthlyBenefits.length > 1) {
    items.push({
      severity: "review",

      valid: true,

      message: `Multiple Monthly Benefits found (${monthlyBenefits.length}).`,
    });
  }

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

  if (deathBenefits.length > 0) {
    const hasOneDeathBenefit = deathBenefits.length === 1;

    items.push({
      severity: hasOneDeathBenefit ? "pass" : "error",

      valid: hasOneDeathBenefit,

      message: hasOneDeathBenefit
        ? "One Death benefit recorded."
        : "A policy can only contain one Death benefit.",
    });
  }

  acceleratedCiBenefits.forEach(function (ciBenefit) {
    if (!deathBenefit) {
      items.push({
        severity: "error",

        valid: false,

        message: "Accelerated CI requires a Death benefit.",
      });

      return;
    }

    const amountIsValid = ciBenefit.amount <= deathBenefit.amount;

    items.push({
      severity: amountIsValid ? "pass" : "error",

      valid: amountIsValid,

      message: amountIsValid
        ? "Accelerated CI does not exceed the Death sum assured."
        : `Accelerated CI exceeds the Death sum assured of ${formatCurrency(
            deathBenefit.amount,
          )}.`,
    });
  });

  earlyCiBenefits.forEach(function (earlyCiBenefit) {
    // Additional and Standalone Early CI have no dependency.
    if (earlyCiBenefit.payoutType !== "accelerated") {
      items.push({
        severity: "pass",

        valid: true,

        message: `${
          PAYOUT_TYPE_LABELS[earlyCiBenefit.payoutType]
        } Early Critical Illness has no Death or Critical Illness dependency.`,
      });

      return;
    }

    const relatedCiBenefit = findRelatedCriticalIllnessBenefit(
      criticalIllnessBenefits,
    );

    if (!deathBenefit) {
      items.push({
        severity: "error",

        valid: false,

        message: "Accelerated Early Critical Illness requires a Death benefit.",
      });
    }

    if (!relatedCiBenefit) {
      items.push({
        severity: "error",

        valid: false,

        message:
          "Accelerated Early Critical Illness requires a Critical Illness benefit.",
      });
    }

    if (deathBenefit) {
      const belowDeath = earlyCiBenefit.amount <= deathBenefit.amount;

      items.push({
        severity: belowDeath ? "pass" : "error",

        valid: belowDeath,

        message: belowDeath
          ? "Accelerated Early Critical Illness does not exceed the Death sum assured."
          : `Accelerated Early Critical Illness exceeds the Death sum assured of ${formatCurrency(
              deathBenefit.amount,
            )}.`,
      });
    }

    if (relatedCiBenefit) {
      const belowCi = earlyCiBenefit.amount <= relatedCiBenefit.amount;

      items.push({
        severity: belowCi ? "pass" : "error",

        valid: belowCi,

        message: belowCi
          ? "Accelerated Early Critical Illness does not exceed the Critical Illness sum assured."
          : `Accelerated Early Critical Illness exceeds the Critical Illness sum assured of ${formatCurrency(
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
      severity: "pass",

      valid: true,

      message: "No CI or Early CI conflicts detected.",
    });
  }

  return items;
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

function createPolicyObject(formData) {
  return {
    id: createUniqueId(),

    policyName: formData.policyName,

    policyType: formData.policyType,

    insurer: formData.insurer,

    policyNumber: formData.policyNumber,

    lifeAssured: formData.lifeAssured,

    status: formData.status,

    premium: getPolicyPremium(formData),

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

function hasOnlySuggestedBenefits() {
  if (draftBenefits.length === 0) {
    return true;
  }

  return draftBenefits.every(function (benefit) {
    return benefit.isSuggested;
  });
}

function handlePolicyTypeChange() {
  const policyType = elements.policyTypeSelect.value;

  populateBenefitTypeOptions();

  closeBenefitEditor();

  if (!hasOnlySuggestedBenefits()) {
    const confirmed = window.confirm(
      "Changing the policy type will replace the current benefits. Continue?",
    );

    if (!confirmed) {
      elements.policyTypeSelect.value = previousPolicyType;

      populateBenefitTypeOptions();

      renderDraftBenefits();

      return;
    }
  }

  previousPolicyType = policyType;

  draftBenefits = [];

  const defaultBenefitTypes = POLICY_TYPE_DEFAULT_BENEFITS[policyType] ?? [];

  const lifeAssured =
    elements.policyLifeAssuredInput.value.trim() ||
    getClientProfile().fullName ||
    "";

  draftBenefits = defaultBenefitTypes.map(function (benefitType) {
    return createEmptyBenefit(benefitType, lifeAssured);
  });

  renderDraftBenefits();
}

function createEmptyBenefit(benefitType, lifeAssured) {
  return {
    id: createUniqueId(),

    isSuggested: true,

    type: benefitType,

    customName: "",

    lifeAssured,

    amount: 0,

    payoutType: null,

    hospitalClass: "",

    riderType: "",

    adlRequirement: null,

    notes: "",
  };
}

function populateBenefitTypeOptions(selectedBenefitType = "") {
  const policyType = elements.policyTypeSelect.value;

  const allowedBenefitTypes = POLICY_TYPE_BENEFIT_OPTIONS[policyType] ?? [];

  elements.benefitTypeSelect.innerHTML = "";

  const placeholderOption = document.createElement("option");

  placeholderOption.value = "";
  placeholderOption.textContent = policyType
    ? "Select benefit type"
    : "Select a policy type first";

  elements.benefitTypeSelect.appendChild(placeholderOption);

  allowedBenefitTypes.forEach(function (benefitType) {
    const option = document.createElement("option");

    option.value = benefitType;
    option.textContent = BENEFIT_LABELS[benefitType] || "Other Benefit";

    elements.benefitTypeSelect.appendChild(option);
  });

  const selectedTypeIsAllowed =
    allowedBenefitTypes.includes(selectedBenefitType);

  elements.benefitTypeSelect.value = selectedTypeIsAllowed
    ? selectedBenefitType
    : "";

  elements.benefitTypeSelect.disabled = !policyType;
}

function openAddBenefitEditor() {
  editingBenefitId = null;

  resetBenefitForm();

  populateBenefitTypeOptions();

  elements.benefitLifeAssuredInput.value =
    elements.policyLifeAssuredInput.value.trim() ||
    getClientProfile().fullName ||
    "";

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

  populateBenefitTypeOptions(benefit.type);

  elements.benefitTypeSelect.value = benefit.type || "";

  elements.benefitLifeAssuredInput.value =
    benefit.lifeAssured || elements.policyLifeAssuredInput.value.trim();

  elements.benefitCustomNameInput.value = benefit.customName || "";

  elements.benefitAmountInput.value = benefit.amount > 0 ? benefit.amount : "";

  elements.benefitPayoutTypeSelect.value = benefit.payoutType || "";

  elements.benefitHospitalClassSelect.value = benefit.hospitalClass || "";

  elements.benefitHospitalRiderSelect.value =
    benefit.riderType ||
    (benefit.hasRider === true
      ? "yes"
      : benefit.hasRider === false
        ? "no"
        : "");

  elements.benefitAdlRequirementSelect.value =
    benefit.adlRequirement != null ? String(benefit.adlRequirement) : "";

  elements.benefitNotesInput.value = benefit.notes || "";

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

  populateBenefitTypeOptions();

  elements.benefitTypeSelect.value = "";

  elements.benefitLifeAssuredInput.value = "";

  elements.benefitCustomNameInput.value = "";

  elements.benefitAmountInput.value = "";

  elements.benefitPayoutTypeSelect.value = "";

  elements.benefitHospitalClassSelect.value = "";

  elements.benefitHospitalRiderSelect.value = "";

  elements.benefitAdlRequirementSelect.value = "";

  elements.benefitNotesInput.value = "";

  elements.benefitFormMessage.textContent = "";

  updateBenefitFields();
}

function updateBenefitFields() {
  const benefitType = elements.benefitTypeSelect.value;

  hideBenefitSpecificFields();

  elements.benefitLifeAssuredGroup.hidden = !benefitType;

  switch (benefitType) {
    case "death":
    case "tpd":
      showBenefitAmountField("Coverage Amount");
      break;

    case "critical_illness":
    case "early_critical_illness":
      showBenefitAmountField("Coverage Amount");
      elements.benefitPayoutTypeGroup.hidden = false;
      break;

    case "hospitalisation":
      elements.benefitHospitalClassGroup.hidden = false;
      elements.benefitHospitalRiderGroup.hidden = false;
      break;

    case "hospital_cash":
      showBenefitAmountField("Daily Cash Benefit");
      break;

    case "medical_reimbursement":
      showBenefitAmountField("Medical Reimbursement per Event");
      break;

    case "disability_income":
      showBenefitAmountField("Monthly Benefit");
      break;

    case "long_term_care_income":
      showBenefitAmountField("Monthly Benefit");
      elements.benefitAdlRequirementGroup.hidden = false;
      break;

    case "other":
      elements.benefitCustomNameGroup.hidden = false;
      showBenefitAmountField("Coverage Amount");
      break;
  }
}

function hideBenefitSpecificFields() {
  elements.benefitLifeAssuredGroup.hidden = true;
  elements.benefitCustomNameGroup.hidden = true;
  elements.benefitAmountGroup.hidden = true;
  elements.benefitPayoutTypeGroup.hidden = true;
  elements.benefitHospitalClassGroup.hidden = true;
  elements.benefitHospitalRiderGroup.hidden = true;
  elements.benefitAdlRequirementGroup.hidden = true;
}

function showBenefitAmountField(label) {
  elements.benefitAmountGroup.hidden = false;

  elements.benefitAmountLabel.innerHTML = `
    ${escapeHtml(label)}
    <span class="required-label">*</span>
  `;
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
  return {
    type: elements.benefitTypeSelect.value,

    customName: elements.benefitCustomNameInput.value.trim(),

    lifeAssured: elements.benefitLifeAssuredInput.value.trim(),

    amount: getWholeNumber(elements.benefitAmountInput.value),

    payoutType: elements.benefitPayoutTypeSelect.value || null,

    hospitalClass: elements.benefitHospitalClassSelect.value,

    riderType: elements.benefitHospitalRiderSelect.value,

    adlRequirement: elements.benefitAdlRequirementSelect.value
      ? Number(elements.benefitAdlRequirementSelect.value)
      : null,

    notes: elements.benefitNotesInput.value.trim(),
  };
}

function validateBenefit(formData) {
  if (!formData.type) {
    return "Select a benefit type.";
  }

  if (!formData.lifeAssured) {
    return "Enter the life assured.";
  }

  if (formData.type === "other" && !formData.customName) {
    return "Enter the benefit name.";
  }

  if (formData.type === "hospitalisation") {
    if (!formData.hospitalClass) {
      return "Select the hospital class.";
    }

    if (!formData.riderType) {
      return "Select the rider status.";
    }

    return "";
  }

  if (formData.type === "long_term_care_income" && !formData.adlRequirement) {
    return "Select the Claim Trigger (ADLs).";
  }

  if (formData.amount <= 0) {
    return getBenefitAmountValidationMessage(formData.type);
  }

  const requiresPayoutType =
    formData.type === "critical_illness" ||
    formData.type === "early_critical_illness";

  if (requiresPayoutType && !formData.payoutType) {
    return "Select whether the payout is accelerated or additional.";
  }

  return "";
}

function getBenefitAmountValidationMessage(benefitType) {
  switch (benefitType) {
    case "hospital_cash":
      return "Enter the daily cash benefit.";

    case "medical_reimbursement":
      return "Enter the medical reimbursement amount per event.";

    case "disability_income":
    case "long_term_care_income":
    case "monthly_benefit":
      return "Enter the monthly benefit.";

    default:
      return "Enter a coverage amount greater than zero.";
  }
}

function addDraftBenefit(formData) {
  draftBenefits.push({
    id: createUniqueId(),

    isSuggested: false,

    ...formData,
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

    ...formData,

    isSuggested: false,
  };
}

/* ========================================
   BENEFIT ACTIONS
======================================== */

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
  return createPlanningCard({
    itemClass: "benefit-item",

    icon: createBenefitIcon(),

    details: createBenefitDetails(benefit),

    actions: createBenefitActions(benefit),
  });
}

function createBenefitActions(benefit) {
  const actions = createPlanningCardActions();

  actions.append(
    createBenefitEditButton(benefit),
    createBenefitDeleteButton(benefit),
  );

  return actions;
}

function createBenefitIcon() {
  return createPlanningCardIcon("fa-solid fa-shield-heart");
}

function createBenefitDetails(benefit) {
  return createPlanningCardDetails({
    title:
      benefit.type === "other"
        ? benefit.customName || "Other Benefit"
        : BENEFIT_LABELS[benefit.type] || "Benefit",

    description: getBenefitSummary(benefit),

    content: createBenefitMetadata(benefit),
  });
}

function getBenefitAmountDescription(benefit) {
  if (benefit.type === "hospitalisation") {
    return (
      HOSPITAL_CLASS_LABELS[benefit.hospitalClass] ||
      "Hospital class not provided"
    );
  }

  const formattedAmount = formatCurrency(benefit.amount);

  switch (benefit.type) {
    case "hospital_cash":
      return `${formattedAmount} per day`;

    case "medical_reimbursement":
      return `${formattedAmount} per event`;

    case "disability_income":
    case "long_term_care_income":
    case "monthly_benefit":
      return `${formattedAmount} per month`;

    default:
      return formattedAmount;
  }
}

function createBenefitEditButton(benefit) {
  return createPlanningCardButton({
    iconClass: "fa-solid fa-pen",

    label: `Edit ${BENEFIT_LABELS[benefit.type]}`,

    onClick() {
      openEditBenefitEditor(benefit.id);
    },
  });
}

function createBenefitDeleteButton(benefit) {
  return createPlanningCardButton({
    iconClass: "fa-solid fa-trash",

    variant: "delete",

    label: `Delete ${BENEFIT_LABELS[benefit.type]}`,

    onClick() {
      if (!window.confirm("Delete this benefit?")) {
        return;
      }

      deleteDraftBenefit(benefit.id);
    },
  });
}

function getBenefitSummary(benefit) {
  const parts = [];

  parts.push(getBenefitAmountDescription(benefit));

  if (benefit.type === "hospitalisation") {
    const riderLabel = getHospitalRiderLabel(
      benefit.riderType ||
        (benefit.hasRider === true
          ? "yes"
          : benefit.hasRider === false
            ? "no"
            : ""),
    );

    if (riderLabel) {
      parts.push(`Rider: ${riderLabel}`);
    }
  }

  if (benefit.type === "long_term_care_income" && benefit.adlRequirement) {
    const adlLabel =
      benefit.adlRequirement === 1 ? "1 ADL" : `${benefit.adlRequirement} ADLs`;

    parts.push(`Claim Trigger: ${adlLabel}`);
  }

  if (benefit.lifeAssured) {
    parts.push(benefit.lifeAssured);
  }

  return parts.join(" · ");
}

function createBenefitMetadata(benefit) {
  const metadata = document.createElement("div");

  metadata.className = "benefit-item-meta";

  appendMetadataItem(
    metadata,
    benefit.type === "other"
      ? benefit.customName || "Other Benefit"
      : BENEFIT_LABELS[benefit.type] || "Benefit",
  );

  if (benefit.payoutType) {
    appendMetadataItem(metadata, PAYOUT_TYPE_LABELS[benefit.payoutType]);
  }

  if (benefit.type === "hospitalisation") {
    const riderLabel = getHospitalRiderLabel(
      benefit.riderType ||
        (benefit.hasRider === true
          ? "yes"
          : benefit.hasRider === false
            ? "no"
            : ""),
    );

    if (riderLabel) {
      appendMetadataItem(metadata, `Rider: ${riderLabel}`);
    }
  }

  if (benefit.type === "long_term_care_income" && benefit.adlRequirement) {
    const adlLabel =
      benefit.adlRequirement === 1 ? "1 ADL" : `${benefit.adlRequirement} ADLs`;

    appendMetadataItem(metadata, `Claim Trigger: ${adlLabel}`);
  }

  if (benefit.notes) {
    appendMetadataItem(metadata, benefit.notes);
  }

  return metadata;
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
    renderPlanningEmptyState(
      elements.policyList,
      "No policies added yet.",
      elements.emptyPolicyMessage,
    );

    return;
  }

  policies.forEach(function (policy) {
    elements.policyList.appendChild(createPolicyElement(policy));
  });
}

function createPolicyElement(policy) {
  return createPlanningCard({
    itemClass: "policy-item",

    icon: createPolicyIcon(),

    details: createPolicyDetails(policy),

    actions: createPolicyActions(policy),
  });
}

function createPolicyIcon() {
  return createPlanningCardIcon("fa-solid fa-shield-halved");
}

function createPolicyDetails(policy) {
  const policyName = policy.policyName || "Unnamed Policy";

  const policyType = POLICY_TYPE_LABELS[policy.policyType] || "Other";

  const insurer = policy.insurer || "Insurer not specified";

  return createPlanningCardDetails({
    title: policyName,

    description: `${insurer} · ${policyType}`,

    content: createPolicyMetadata(policy),
  });
}

function createPolicyMetadata(policy) {
  const metadata = document.createElement("div");

  metadata.className = "benefit-item-meta";

  appendMetadataItem(
    metadata,
    POLICY_STATUS_LABELS[policy.status] || "Status not specified",
  );

  appendMetadataItem(metadata, getPremiumDescription(policy.premium));

  const benefitCount = Array.isArray(policy.benefits)
    ? policy.benefits.length
    : 0;

  appendMetadataItem(
    metadata,
    benefitCount === 1 ? "1 benefit" : `${benefitCount} benefits`,
  );

  if (policy.policyNumber) {
    appendMetadataItem(metadata, `Policy No: ${policy.policyNumber}`);
  }

  return metadata;
}

function createPolicyActions(policy) {
  const actions = createPlanningCardActions();

  actions.append(
    createPolicyEditButton(policy),
    createPolicyDeleteButton(policy),
  );

  return actions;
}

function createPolicyEditButton(policy) {
  return createPlanningCardButton({
    iconClass: "fa-solid fa-pen",

    label: `Edit ${policy.policyName || "policy"}`,

    onClick() {
      openEditPolicyModal(policy.id);
    },
  });
}

function createPolicyDeleteButton(policy) {
  return createPlanningCardButton({
    iconClass: "fa-solid fa-trash",

    variant: "delete",

    label: `Delete ${policy.policyName || "policy"}`,

    onClick() {
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

function getPremiumDescription(premium) {
  if (!premium) {
    return "Premium not provided";
  }

  if (premium.amount <= 0) {
    return "Paid-up";
  }

  const frequencyLabel =
    PREMIUM_FREQUENCY_LABELS[premium.frequency] || "Premium";

  return [formatCurrency(premium.amount), frequencyLabel].join(" · ");
}

function appendMetadataItem(container, text) {
  const item = document.createElement("span");

  item.textContent = text;

  container.appendChild(item);
}

function getLifeAssuredFromBenefits(benefits) {
  if (!Array.isArray(benefits)) {
    return "";
  }

  const benefitWithLifeAssured = benefits.find(function (benefit) {
    return benefit.lifeAssured?.trim();
  });

  return benefitWithLifeAssured?.lifeAssured || "";
}

function getHospitalRiderLabel(riderType) {
  switch (riderType) {
    case "panel_only":
      return "Yes (Panel Only)";

    case "yes":
      return "Yes";

    case "no":
      return "No";

    default:
      return "";
  }
}
