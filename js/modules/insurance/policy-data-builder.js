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

    coverageEndDate: formData.coverageEndDate,

    coverageEndAge: formData.coverageEndAge,

    premiumPaymentEndDate: formData.premiumPaymentEndDate,

    /*
     * Keep the recorded premium even when
     * the policy is paid-up.
     *
     * Paid-up status determines whether the
     * premium affects cashflow. It should not
     * destroy the policy's historical premium.
     */
    premium: {
      amount: formData.premiumAmount,

      frequency: formData.premiumFrequency,
    },

    endowment: formData.endowment,

    accumulation: formData.accumulation,

    retirement: formData.retirement,

    benefits,
  };
}