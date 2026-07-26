"use strict";

import {
  escapeHtml,
  formatCurrency,
} from "../utils/client-utils.js";

import {
  openModal,
  closeModal,
  closeModalOnOverlayClick,
  closeModalOnEscape,
} from "../utils/modal.js";

import { cloneBenefits } from "../utils/benefit-utils.js";

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

import { getAssets, getClientProfile } from "../state/client-plan.js";

import { getAverageGrossMonthlyIncome } from "../services/income-calculator.js";

import {
  getAllPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  removePolicy,
  clearPolicies,
} from "../services/policy-service.js";

import {
  createEmptyBenefit,
  createLongTermCareBaseBenefit,
} from "../factories/benefit-factory.js";

import { readPolicyFormData } from "./insurance/policy-form-data.js";

import { writePolicyFormData } from "./insurance/policy-form-writer.js";

import { readBenefitFormData } from "./insurance/benefit-form-data.js";

import { writeBenefitFormData } from "./insurance/benefit-form-writer.js";

import { validateBenefit } from "./insurance/benefit-validation.js";

import {
  getPolicyValidationItems,
  getCompletePolicyValidationItems,
} from "./insurance/policy-validation.js";

import {
  addDraftBenefit,
  updateDraftBenefit,
  removeDraftBenefit,
} from "./insurance/draft-benefits.js";

import {
  createPlanningCard,
  createPlanningCardIcon,
  createPlanningCardDetails,
  createPlanningCardActions,
  createPlanningCardButton,
  renderPlanningEmptyState,
} from "../components/planning-card.js";

const LONG_TERM_CARE_BASE_PLANS = {
  eldershield_300: {
    name: "ElderShield 300",

    amount: 300,

    payoutTerm: "limited",

    payoutDuration: 60,

    adlRequirement: 3,
  },

  eldershield_400: {
    name: "ElderShield 400",

    amount: 400,

    payoutTerm: "limited",

    payoutDuration: 72,

    adlRequirement: 3,
  },

  careshield_life: {
    name: "CareShield Life",

    amount: 600,

    payoutTerm: "lifetime",

    payoutDuration: null,

    adlRequirement: 3,
  },
};

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

  elements.longTermCareBasePlanSelect?.addEventListener(
    "change",
    handleLongTermCareBasePlanChange,
  );

  elements.benefitPayoutTermSelect?.addEventListener(
    "change",
    updatePayoutDurationField,
  );

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

  writePolicyFormData(
    elements,
    policy,
    getLifeAssuredFromBenefits(policy.benefits),
  );

  previousPolicyType = policy.policyType || "";

  populateBenefitTypeOptions();

  updateLongTermCareBasePlanField();

  draftBenefits = cloneBenefits(policy.benefits);

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

  elements.longTermCareBasePlanSelect.value = "";

  updateLongTermCareBasePlanField();

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
   * Changing the base plan invalidates the previously
   * entered supplementary benefits because their payout
   * options depend on the selected base plan.
   *
   * Keep only untouched suggested benefits.
   */
  draftBenefits = draftBenefits.filter(function (benefit) {
    return benefit.isSuggested && !benefit.isBasePlanBenefit;
  });

  closeBenefitEditor();

  const selectedBasePlan = elements.longTermCareBasePlanSelect.value;

  const basePlan = LONG_TERM_CARE_BASE_PLANS[selectedBasePlan];

  if (basePlan) {
    const lifeAssured =
      elements.policyLifeAssuredInput.value.trim() ||
      getClientProfile().fullName ||
      "";

    draftBenefits.unshift(
      createLongTermCareBaseBenefit(selectedBasePlan, basePlan, lifeAssured),
    );
  }

  renderDraftBenefits();
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

  if (editingPolicyId) {
    updatePolicy(editingPolicyId, {
      policyName: formData.policyName,

      policyType: formData.policyType,

      longTermCareBasePlan: formData.longTermCareBasePlan,

      insurer: formData.insurer,

      policyNumber: formData.policyNumber,

      lifeAssured: formData.lifeAssured,

      status: formData.status,

      premium: getPolicyPremium(formData),

      benefits: draftBenefits,
    });
  } else {
    createPolicy({
      policyName: formData.policyName,

      policyType: formData.policyType,

      longTermCareBasePlan: formData.longTermCareBasePlan,

      insurer: formData.insurer,

      policyNumber: formData.policyNumber,

      lifeAssured: formData.lifeAssured,

      status: formData.status,

      premium: getPolicyPremium(formData),

      benefits: draftBenefits,
    });
  }

  renderInsurancePortfolio();

  closePolicyModal();
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

  const assets = getAssets();

  const firstError = getCompletePolicyValidationItems({
    policyId: editingPolicyId || "",

    policyLifeAssured: formData.lifeAssured,

    benefits: draftBenefits,

    includeDraftBenefits: true,

    context: {
      editingPolicyId: editingPolicyId || "",

      allPolicies: getAllPolicies(),

      monthlyEmploymentIncome: assets.income.monthlyEmployment,

      annualBonus: assets.income.annualBonus,
    },
  }).find(function (item) {
    return item.severity === "error" && !item.valid;
  });

  if (firstError) {
    return firstError.message;
  }

  return "";
}



function renderPolicyValidation() {
  if (!elements.policyValidationSection || !elements.policyValidationList) {
    return;
  }

  const assets = getAssets();

  const validationItems = getCompletePolicyValidationItems({
    policyId: editingPolicyId || "",

    policyLifeAssured: elements.policyLifeAssuredInput.value.trim(),

    benefits: draftBenefits,

    includeDraftBenefits: true,

    context: {
      editingPolicyId: editingPolicyId || "",

      allPolicies: getAllPolicies(),

      monthlyEmploymentIncome: assets.income.monthlyEmployment,

      annualBonus: assets.income.annualBonus,
    },
  });

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





function getPolicyValidationSummary(policy) {
  const validationItems = getCompletePolicyValidationItems({
    policyId: editingPolicyId || "",
    editingPolicyId: editingPolicyId || "",

    policyLifeAssured: formData.lifeAssured,

    benefits: draftBenefits,

    allPolicies: getAllPolicies(),

    includeDraftBenefits: true,

    monthlyEmploymentIncome: assets.income.monthlyEmployment,

    annualBonus: assets.income.annualBonus,
  }).find(function (item) {
    return item.severity === "error" && !item.valid;
  });

  const errors = validationItems.filter(function (item) {
    return item.severity === "error" && !item.valid;
  });

  const reviews = validationItems.filter(function (item) {
    return item.severity === "review";
  });

  const passes = validationItems.filter(function (item) {
    return item.severity === "pass" && item.valid;
  });

  let highestSeverity = "pass";

  if (errors.length > 0) {
    highestSeverity = "error";
  } else if (reviews.length > 0) {
    highestSeverity = "review";
  }

  return {
    items: validationItems,
    errors,
    reviews,
    passes,
    highestSeverity,
  };
}

function getPortfolioValidationSummary(policies) {
  return policies.reduce(
    function (summary, policy) {
      const policySummary = getPolicyValidationSummary(policy);

      summary.errorCount += policySummary.errors.length;
      summary.reviewCount += policySummary.reviews.length;
      summary.passCount += policySummary.passes.length;

      return summary;
    },
    {
      errorCount: 0,
      reviewCount: 0,
      passCount: 0,
    },
  );
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

      updateLongTermCareBasePlanField();

      renderDraftBenefits();

      return;
    }
  }

  previousPolicyType = policyType;

  draftBenefits = [];

  elements.longTermCareBasePlanSelect.value = "";

  updateLongTermCareBasePlanField();

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

  writeBenefitFormData(
    elements,
    benefit,
    elements.policyLifeAssuredInput.value.trim(),
  );

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

  elements.benefitPayoutTermSelect.disabled = false;

  elements.benefitPayoutTermSelect.innerHTML = `
  <option value="">Select payout term</option>
`;

  elements.benefitPayoutDurationInput.value = "";

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

    case "monthly_benefit":
    case "disability_income":
      showBenefitAmountField("Monthly Benefit");
      break;

    case "long_term_care_income": {
      showBenefitAmountField("Monthly Benefit");

      elements.benefitPayoutTermGroup.hidden = false;
      elements.benefitAdlRequirementGroup.hidden = false;

      const selectedPayoutTerm = elements.benefitPayoutTermSelect.value;

      updateLongTermCarePayoutTermOptions(selectedPayoutTerm);

      break;
    }

    case "other":
      elements.benefitCustomNameGroup.hidden = false;
      showBenefitAmountField("Coverage Amount");
      break;
  }
}

function updateLongTermCarePayoutTermOptions(selectedPayoutTerm = "") {
  const basePlan = elements.longTermCareBasePlanSelect.value;

  const payoutTermOptions = [];

  if (basePlan === "eldershield_300" || basePlan === "eldershield_400") {
    payoutTermOptions.push(
      {
        value: "extend_10_years",
        label: "Extend Total Payout to 10 Years",
      },
      {
        value: "lifetime",
        label: "Lifetime",
      },
    );
  } else if (basePlan === "careshield_life") {
    payoutTermOptions.push({
      value: "lifetime",
      label: "Lifetime",
    });
  } else {
    payoutTermOptions.push(
      {
        value: "lifetime",
        label: "Lifetime",
      },
      {
        value: "limited",
        label: "Limited Duration",
      },
    );
  }

  elements.benefitPayoutTermSelect.innerHTML = "";

  const placeholderOption = document.createElement("option");

  placeholderOption.value = "";

  placeholderOption.textContent = "Select payout term";

  elements.benefitPayoutTermSelect.appendChild(placeholderOption);

  payoutTermOptions.forEach(function (optionData) {
    const option = document.createElement("option");

    option.value = optionData.value;

    option.textContent = optionData.label;

    elements.benefitPayoutTermSelect.appendChild(option);
  });

  const selectedTermIsAvailable = payoutTermOptions.some(function (optionData) {
    return optionData.value === selectedPayoutTerm;
  });

  if (selectedTermIsAvailable) {
    elements.benefitPayoutTermSelect.value = selectedPayoutTerm;
  } else if (basePlan === "careshield_life") {
    elements.benefitPayoutTermSelect.value = "lifetime";
  } else {
    elements.benefitPayoutTermSelect.value = "";
  }

  elements.benefitPayoutTermSelect.disabled = basePlan === "careshield_life";

  updatePayoutDurationField();
}

function updatePayoutDurationField() {
  const hasLimitedPayout = elements.benefitPayoutTermSelect.value === "limited";

  elements.benefitPayoutDurationGroup.hidden = !hasLimitedPayout;

  elements.benefitPayoutDurationInput.required = hasLimitedPayout;

  if (!hasLimitedPayout) {
    elements.benefitPayoutDurationInput.value = "";
  }
}

function hideBenefitSpecificFields() {
  elements.benefitLifeAssuredGroup.hidden = true;
  elements.benefitCustomNameGroup.hidden = true;
  elements.benefitAmountGroup.hidden = true;
  elements.benefitPayoutTermGroup.hidden = true;
  elements.benefitPayoutDurationGroup.hidden = true;
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
  const formData = readBenefitFormData(elements);

  const validationMessage = validateBenefit(formData, {
    longTermCareBasePlan: elements.longTermCareBasePlanSelect.value,
  });

  if (validationMessage) {
    elements.benefitFormMessage.textContent = validationMessage;

    return;
  }

  if (editingBenefitId) {
    draftBenefits = updateDraftBenefit(
      draftBenefits,
      editingBenefitId,
      formData,
    );
  } else {
    draftBenefits = addDraftBenefit(draftBenefits, formData);
  }

  renderDraftBenefits();

  closeBenefitEditor();
}

/* ========================================
   BENEFIT ACTIONS
======================================== */

function deleteDraftBenefit(benefitId) {
  draftBenefits = removeDraftBenefit(draftBenefits, benefitId);

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

  if (benefit.isBasePlanBenefit) {
    return actions;
  }

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
    title: benefit.isBasePlanBenefit
      ? benefit.customName || "Long-Term Care Base Plan"
      : benefit.type === "other"
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

  if (benefit.type === "long_term_care_income") {
    if (benefit.payoutTerm === "extend_10_years") {
      parts.push("Extends total payout to 10 years");
    }

    if (benefit.payoutTerm === "lifetime") {
      parts.push("Lifetime payout");
    }

    if (benefit.payoutTerm === "limited" && benefit.payoutDuration > 0) {
      parts.push(
        `${benefit.payoutDuration} ${
          benefit.payoutDuration === 1 ? "month" : "months"
        } payout`,
      );
    }

    if (benefit.adlRequirement) {
      const adlLabel =
        benefit.adlRequirement === 1
          ? "1 ADL"
          : `${benefit.adlRequirement} ADLs`;

      parts.push(`Claim Trigger: ${adlLabel}`);
    }
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
    benefit.isBasePlanBenefit
      ? benefit.customName || "Long-Term Care Base Plan"
      : benefit.type === "other"
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

  if (benefit.type === "long_term_care_income") {
    if (benefit.isBasePlanBenefit) {
      appendMetadataItem(metadata, "Base Plan");
    }

    if (benefit.payoutTerm === "extend_10_years") {
      appendMetadataItem(metadata, "Extends Total Payout to 10 Years");
    }

    if (benefit.payoutTerm === "lifetime") {
      appendMetadataItem(metadata, "Lifetime Payout");
    }

    if (benefit.payoutTerm === "limited" && benefit.payoutDuration > 0) {
      appendMetadataItem(
        metadata,
        `${benefit.payoutDuration} ${
          benefit.payoutDuration === 1 ? "Month" : "Months"
        } Payout`,
      );
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
  const policies = getAllPolicies();

  renderPortfolioValidationSummary(policies);

  renderPolicies(policies);
}

function renderPortfolioValidationSummary(policies) {
  if (!elements.portfolioValidationSummary) {
    return;
  }

  if (policies.length === 0) {
    elements.portfolioValidationSummary.hidden = true;

    return;
  }

  const summary = getPortfolioValidationSummary(policies);

  elements.portfolioErrorCount.textContent = summary.errorCount;

  elements.portfolioReviewCount.textContent = summary.reviewCount;

  elements.portfolioPassCount.textContent = summary.passCount;

  elements.portfolioErrorButton.disabled = summary.errorCount === 0;

  elements.portfolioReviewButton.disabled = summary.reviewCount === 0;

  elements.portfolioValidationSummary.hidden = false;
}

function renderPolicies(policies = getAllPolicies()) {
  if (!elements.policyList) {
    return;
  }

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
  const validationSummary = getPolicyValidationSummary(policy);

  const policyElement = createPlanningCard({
    itemClass: [
      "policy-item",
      `policy-item--${validationSummary.highestSeverity}`,
    ].join(" "),

    icon: createPolicyIcon(),

    details: createPolicyDetails(policy, validationSummary),

    actions: createPolicyActions(policy),
  });

  policyElement.dataset.validationSeverity = validationSummary.highestSeverity;

  policyElement.dataset.policyId = policy.id;

  return policyElement;
}

function createPolicyIcon() {
  return createPlanningCardIcon("fa-solid fa-shield-halved");
}

function createPolicyDetails(policy, validationSummary) {
  const policyName = policy.policyName || "Unnamed Policy";

  const policyType = POLICY_TYPE_LABELS[policy.policyType] || "Other";

  const insurer = policy.insurer || "Insurer not specified";

  return createPlanningCardDetails({
    title: policyName,

    description: `${insurer} · ${policyType}`,

    content: createPolicyCardContent(policy, validationSummary),
  });
}

function createPolicyCardContent(policy, validationSummary) {
  const content = document.createElement("div");

  content.className = "policy-card-content";

  content.appendChild(createPolicyMetadata(policy));

  content.appendChild(createPolicyValidationPreview(validationSummary));

  return content;
}

function createPolicyValidationPreview(validationSummary) {
  const container = document.createElement("div");

  container.className = [
    "policy-card-validation",
    `policy-card-validation--${validationSummary.highestSeverity}`,
  ].join(" ");

  const status = document.createElement("div");

  status.className = "policy-card-validation__status";

  const icon = document.createElement("i");

  icon.setAttribute("aria-hidden", "true");

  const label = document.createElement("strong");

  if (validationSummary.errors.length > 0) {
    icon.className = "fa-solid fa-circle-exclamation";

    label.textContent =
      validationSummary.errors.length === 1
        ? "1 issue requires attention"
        : `${validationSummary.errors.length} issues require attention`;
  } else if (validationSummary.reviews.length > 0) {
    icon.className = "fa-solid fa-triangle-exclamation";

    label.textContent =
      validationSummary.reviews.length === 1
        ? "1 item requires review"
        : `${validationSummary.reviews.length} items require review`;
  } else {
    icon.className = "fa-solid fa-circle-check";

    label.textContent = "No issues detected";
  }

  status.append(icon, label);

  container.appendChild(status);

  const messages = [...validationSummary.errors, ...validationSummary.reviews];

  messages.slice(0, 2).forEach(function (item) {
    const message = document.createElement("p");

    message.className = "policy-card-validation__message";

    message.textContent = item.message;

    container.appendChild(message);
  });

  if (messages.length > 2) {
    const remainingMessage = document.createElement("p");

    remainingMessage.className = "policy-card-validation__remaining";

    remainingMessage.textContent = `+${
      messages.length - 2
    } more item${messages.length - 2 === 1 ? "" : "s"}`;

    container.appendChild(remainingMessage);
  }

  return container;
}

function createPolicyMetadata(policy) {
  const metadata = document.createElement("div");

  metadata.className = "benefit-item-meta";

  appendMetadataItem(
    metadata,
    POLICY_STATUS_LABELS[policy.status] || "Status not specified",
  );

  appendMetadataItem(metadata, getPremiumDescription(policy.premium));

  if (policy.policyType === "long_term_care" && policy.longTermCareBasePlan) {
    const basePlanLabel = getLongTermCareBasePlanLabel(
      policy.longTermCareBasePlan,
    );

    if (basePlanLabel) {
      appendMetadataItem(metadata, `Base Plan: ${basePlanLabel}`);
    }
  }

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

function getLongTermCareBasePlanLabel(basePlanValue) {
  if (basePlanValue === "supplement_only") {
    return "Supplement Only / Other Base Plan";
  }

  return LONG_TERM_CARE_BASE_PLANS[basePlanValue]?.name || "";
}
