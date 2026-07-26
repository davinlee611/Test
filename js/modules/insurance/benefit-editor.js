"use strict";

import { readBenefitFormData } from "./benefit-form-data.js";
import { writeBenefitFormData } from "./benefit-form-writer.js";
import { validateBenefit } from "./benefit-validation.js";

import { addDraftBenefit, updateDraftBenefit } from "./draft-benefits.js";

export function openAddBenefitEditor({
  elements,
  populateBenefitTypeOptions,
  updateBenefitFields,
}) {
  elements.benefitEditorTitle.textContent = "Add Benefit";

  elements.saveBenefitButton.textContent = "Add Benefit";

  populateBenefitTypeOptions();

  elements.benefitEditor.hidden = false;

  updateBenefitFields();

  elements.benefitTypeSelect.focus();
}

export function openEditBenefitEditor({
  benefit,
  elements,
  policyLifeAssured,
  populateBenefitTypeOptions,
  updateBenefitFields,
}) {
  elements.benefitEditorTitle.textContent = "Edit Benefit";

  elements.saveBenefitButton.textContent = "Save Changes";

  populateBenefitTypeOptions(benefit.type);

  writeBenefitFormData(elements, benefit, policyLifeAssured);

  elements.benefitFormMessage.textContent = "";

  updateBenefitFields();

  elements.benefitEditor.hidden = false;

  elements.benefitEditor.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  elements.benefitTypeSelect.focus();
}

export function closeBenefitEditor({ elements, resetBenefitForm }) {
  elements.benefitEditor.hidden = true;

  elements.benefitEditorTitle.textContent = "Add Benefit";

  elements.saveBenefitButton.textContent = "Add Benefit";

  resetBenefitForm();
}

export function saveBenefit({
  elements,
  draftBenefits,
  editingBenefitId,
  longTermCareBasePlan,
  renderDraftBenefits,
  closeBenefitEditor,
}) {
  const formData = readBenefitFormData(elements);

  const validationMessage = validateBenefit(formData, {
    longTermCareBasePlan,
  });

  if (validationMessage) {
    elements.benefitFormMessage.textContent = validationMessage;

    return {
      draftBenefits,
      editingBenefitId,
    };
  }

  let updatedBenefits;

  if (editingBenefitId) {
    updatedBenefits = updateDraftBenefit(
      draftBenefits,
      editingBenefitId,
      formData,
    );
  } else {
    updatedBenefits = addDraftBenefit(draftBenefits, formData);
  }

  renderDraftBenefits();

  closeBenefitEditor();

  return {
    draftBenefits: updatedBenefits,
    editingBenefitId: null,
  };
}