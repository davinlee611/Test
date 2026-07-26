"use strict";

import { readBenefitFormData } from "./benefit-form-data.js";

import { validateBenefit } from "./benefit-validation.js";

import { addDraftBenefit, updateDraftBenefit } from "./draft-benefits.js";

export function saveBenefit({
  elements,
  draftBenefits,
  editingBenefitId,
  longTermCareBasePlan,
}) {
  const formData = readBenefitFormData(elements);

  const validationMessage = validateBenefit(formData, {
    longTermCareBasePlan,
  });

  if (validationMessage) {
    elements.benefitFormMessage.textContent = validationMessage;

    return {
      saved: false,
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

  return {
    saved: true,
    draftBenefits: updatedBenefits,
    editingBenefitId: null,
  };
}