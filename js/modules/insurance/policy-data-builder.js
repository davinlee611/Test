"use strict";

/* ========================================
   POLICY DATA
======================================== */

export function buildPolicyData({ formData, benefits }) {
  return {
    policyName: formData.policyName,

    policyType: formData.policyType,

    hospitalisation: formData.hospitalisation,

    longTermCare: formData.longTermCare,

    longTermCareBasePlan: formData.longTermCareBasePlan,

    insurer: formData.insurer,

    policyNumber: formData.policyNumber,

    lifeAssured: formData.lifeAssured,

    status: formData.status,

    premium: getPolicyPremium(formData),

    benefits,
  };
}

/* ========================================
   PREMIUM
======================================== */

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
