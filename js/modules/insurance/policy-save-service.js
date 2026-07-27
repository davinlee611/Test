"use strict";

import { buildPolicyData } from "./policy-data-builder.js";

/* ========================================
   POLICY SAVE
======================================== */

export function savePolicyDraft({
  formData,

  draftBenefits,

  editingPolicyId,

  validate,

  createPolicy,

  updatePolicy,
}) {
  /*
   * Validation must use the same cleaned
   * benefit array that will be saved.
   */
  const validationMessage = validate({
    benefits: draftBenefits,
  });

  if (validationMessage) {
    return {
      success: false,

      message: validationMessage,
    };
  }

  const policyData = buildPolicyData({
    formData,

    benefits: draftBenefits,
  });

  if (editingPolicyId) {
    updatePolicy(editingPolicyId, policyData);
  } else {
    createPolicy(policyData);
  }

  return {
    success: true,
  };
}