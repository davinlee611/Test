"use strict";

import { openModal, closeModal } from "../../utils/modal.js";

import { cloneBenefits } from "../../utils/benefit-utils.js";

import { getClientProfile } from "../../state/client-plan.js";

import { getPolicyById } from "../../services/policy-service.js";

import { writePolicyFormData } from "./policy-form-writer.js";

import { markBenefitsAsExisting } from "./benefit-lifecycle.js";

export function createPolicyModal({
  elements,

  setDraftBenefits,
  setEditingBenefitId,
  setEditingPolicyId,
  setPreviousPolicyType,

  populateBenefitTypeOptions,
  updateLongTermCareBasePlanField,
  updatePremiumFields,
  handleInsurerChange,

  closeBenefitEditor,
  renderDraftBenefits,
  getLifeAssuredFromBenefits,
}) {
  function openAdd() {
    setEditingPolicyId(null);

    reset();

    setPreviousPolicyType("");

    handleInsurerChange();

    elements.policyModalTitle.textContent = "Add Policy";

    elements.savePolicyButton.textContent = "Save Policy";

    elements.policyLifeAssuredInput.value = getClientProfile().fullName || "";

    updatePremiumFields();

    openModal(elements.policyModal);
  }

  function openEdit(policyId) {
    const policy = getPolicyById(policyId);

    if (!policy) {
      return;
    }

    setEditingPolicyId(policy.id);

    reset();

    /*
     * reset() does not clear editingPolicyId,
     * so the policy remains in edit mode.
     */

    elements.policyModalTitle.textContent = "Edit Policy";

    elements.savePolicyButton.textContent = "Save Changes";

    writePolicyFormData(
      elements,
      policy,
      getLifeAssuredFromBenefits(policy.benefits),
    );

    setPreviousPolicyType(policy.policyType || "");

    populateBenefitTypeOptions();

    updateLongTermCareBasePlanField();

    setDraftBenefits(markBenefitsAsExisting(cloneBenefits(policy.benefits)));

    updatePremiumFields();

    renderDraftBenefits();

    openModal(elements.policyModal);
  }

  function close() {
    closeBenefitEditor();

    setEditingPolicyId(null);

    closeModal(elements.policyModal);
  }

  function reset() {
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

    setDraftBenefits([]);

    setEditingBenefitId(null);

    setPreviousPolicyType("");

    updatePremiumFields();

    closeBenefitEditor();

    renderDraftBenefits();
  }

  return {
    openAdd,
    openEdit,
    close,
    reset,
  };
}
