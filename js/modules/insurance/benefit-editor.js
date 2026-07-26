"use strict";

import { escapeHtml } from "../../utils/client-utils.js";

import {
  BENEFIT_LABELS,
  POLICY_TYPE_BENEFIT_OPTIONS,
} from "../../constants/insurance.js";

import { readBenefitFormData } from "./benefit-form-data.js";

import { writeBenefitFormData } from "./benefit-form-writer.js";

import { validateBenefit } from "./benefit-validation.js";

import {
  addDraftBenefit,
  updateDraftBenefit,
  removeDraftBenefit,
} from "./draft-benefits.js";

export function createBenefitEditor({
  elements,

  getDraftBenefits,
  setDraftBenefits,

  getEditingBenefitId,
  setEditingBenefitId,

  getPolicyType,
  getPolicyLifeAssured,
  getDefaultLifeAssured,
  getLongTermCareBasePlan,

  onBenefitsChanged,
}) {
  function openAdd() {
    setEditingBenefitId(null);

    resetForm();

    populateBenefitTypeOptions();

    elements.benefitLifeAssuredInput.value =
      getPolicyLifeAssured() || getDefaultLifeAssured() || "";

    elements.benefitEditorTitle.textContent = "Add Benefit";

    elements.saveBenefitButton.textContent = "Add Benefit";

    elements.benefitEditor.hidden = false;

    elements.benefitEditor.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    elements.benefitTypeSelect.focus();
  }

  function openEdit(benefitId) {
    const benefit = getDraftBenefits().find(function (item) {
      return item.id === benefitId;
    });

    if (!benefit) {
      return;
    }

    setEditingBenefitId(benefit.id);

    elements.benefitEditorTitle.textContent = "Edit Benefit";

    elements.saveBenefitButton.textContent = "Save Changes";

    populateBenefitTypeOptions(benefit.type);

    writeBenefitFormData(elements, benefit, getPolicyLifeAssured());

    elements.benefitFormMessage.textContent = "";

    updateBenefitFields();

    elements.benefitEditor.hidden = false;

    elements.benefitEditor.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    elements.benefitTypeSelect.focus();
  }

  function close() {
    if (!elements.benefitEditor) {
      return;
    }

    elements.benefitEditor.hidden = true;

    setEditingBenefitId(null);

    elements.benefitEditorTitle.textContent = "Add Benefit";

    elements.saveBenefitButton.textContent = "Add Benefit";

    resetForm();
  }

  function resetForm() {
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
      <option value="">
        Select payout term
      </option>
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

  function populateBenefitTypeOptions(selectedBenefitType = "") {
    const policyType = getPolicyType();

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
    const basePlan = getLongTermCareBasePlan();

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

    const selectedTermIsAvailable = payoutTermOptions.some(
      function (optionData) {
        return optionData.value === selectedPayoutTerm;
      },
    );

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
    const hasLimitedPayout =
      elements.benefitPayoutTermSelect.value === "limited";

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

  function save() {
    const formData = readBenefitFormData(elements);

    const validationMessage = validateBenefit(formData, {
      longTermCareBasePlan: getLongTermCareBasePlan(),
    });

    if (validationMessage) {
      elements.benefitFormMessage.textContent = validationMessage;

      return;
    }

    const currentBenefits = getDraftBenefits();

    const editingBenefitId = getEditingBenefitId();

    let updatedBenefits;

    if (editingBenefitId) {
      updatedBenefits = updateDraftBenefit(
        currentBenefits,
        editingBenefitId,
        formData,
      );
    } else {
      updatedBenefits = addDraftBenefit(currentBenefits, formData);
    }

    setDraftBenefits(updatedBenefits);

    setEditingBenefitId(null);

    onBenefitsChanged();

    close();
  }

  function confirmDelete(benefitId) {
    const confirmed = window.confirm("Delete this benefit?");

    if (!confirmed) {
      return;
    }

    const updatedBenefits = removeDraftBenefit(getDraftBenefits(), benefitId);

    setDraftBenefits(updatedBenefits);

    if (getEditingBenefitId() === benefitId) {
      close();
    }

    onBenefitsChanged();
  }

  return {
    openAdd,
    openEdit,
    close,
    resetForm,
    save,
    confirmDelete,
    populateBenefitTypeOptions,
    updateBenefitFields,
    updateLongTermCarePayoutTermOptions,
    updatePayoutDurationField,
  };
}