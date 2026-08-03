"use strict";

import { getPolicies, setPolicies } from "../state/client-plan.js";

import {
  appendItem,
  findItemById,
  removeItemById,
  updateItemById,
} from "../utils/collection-utils.js";

import { cloneBenefits } from "../utils/benefit-utils.js";

import { createPlannerId } from "../utils/client-utils.js";

/* ========================================
   POLICY QUERIES
======================================== */

export function getAllPolicies() {
  return getPolicies();
}

export function getPolicyById(policyId) {
  return findItemById(getPolicies(), policyId);
}

/* ========================================
   POLICY COMMANDS
======================================== */

export function createPolicy(policyData) {
  const newPolicy = createPolicyRecord(policyData);

  setPolicies(appendItem(getPolicies(), newPolicy));

  return newPolicy;
}

export function updatePolicy(policyId, updates) {
  if (!updates || typeof updates !== "object") {
    return null;
  }

  const { items, updatedItem } = updateItemById(
    getPolicies(),
    policyId,
    (policy) => {
      const updatedPolicy = {
        ...policy,
        ...updates,
        id: policy.id,
      };

      if (Object.prototype.hasOwnProperty.call(updates, "premium")) {
        updatedPolicy.premium = clonePolicyPremium(updates.premium);
      }

      if (Object.prototype.hasOwnProperty.call(updates, "hospitalisation")) {
        updatedPolicy.hospitalisation = cloneHospitalisation(
          updates.hospitalisation,
        );
      }

      if (Object.prototype.hasOwnProperty.call(updates, "longTermCare")) {
        updatedPolicy.longTermCare = cloneLongTermCare(updates.longTermCare);
      }

      if (Object.prototype.hasOwnProperty.call(updates, "endowment")) {
        updatedPolicy.endowment = cloneEndowment(updates.endowment);
      }

      if (Object.prototype.hasOwnProperty.call(updates, "retirement")) {
        updatedPolicy.retirement = cloneRetirement(updates.retirement);
      }

      if (Object.prototype.hasOwnProperty.call(updates, "benefits")) {
        updatedPolicy.benefits = cloneBenefits(updates.benefits);
      }

      return updatedPolicy;
    },
  );

  if (!updatedItem) {
    return null;
  }

  setPolicies(items);

  return updatedItem;
}

export function removePolicy(policyId) {
  const { items, removedItem } = removeItemById(getPolicies(), policyId);

  if (!removedItem) {
    return false;
  }

  setPolicies(items);

  return true;
}

export function clearPolicies() {
  setPolicies([]);
}

/* ========================================
   PRIVATE POLICY FACTORY
======================================== */

function createPolicyRecord({
  policyName,
  policyType,
  hospitalisation = null,
  longTermCare = null,
  longTermCareBasePlan = null,
  insurer,
  policyNumber,
  lifeAssured,
  status,
  premiumPaymentEndDate = null,
  premium,
  endowment = null,
  retirement = null,
  benefits = [],
}) {
  return {
    id: createPlannerId(),

    policyName,

    policyType,

    hospitalisation: cloneHospitalisation(hospitalisation),

    longTermCare: cloneLongTermCare(longTermCare),

    longTermCareBasePlan,

    insurer,

    policyNumber,

    lifeAssured,

    status,

    premiumPaymentEndDate,

    premium: clonePolicyPremium(premium),

    endowment: cloneEndowment(endowment),

    retirement: cloneRetirement(retirement),

    benefits: cloneBenefits(benefits),
  };
}

/* ========================================
   PRIVATE COPY HELPERS
======================================== */

function clonePolicyPremium(premium) {
  if (!premium || typeof premium !== "object") {
    return {
      amount: 0,
      frequency: null,
    };
  }

  return {
    amount: Number(premium.amount) || 0,

    frequency: premium.frequency || null,
  };
}

function cloneHospitalisation(hospitalisation) {
  if (!hospitalisation || typeof hospitalisation !== "object") {
    return null;
  }

  const rider = hospitalisation.rider || {};

  const premiumPayment = hospitalisation.premiumPayment || {};

  return {
    wardType: hospitalisation.wardType || "",

    rider: {
      included: rider.included === true,

      type: rider.type || "",

      annualPremium: Number(rider.annualPremium) || 0,
    },

    premiumPayment: {
      medisaveAmount: Number(premiumPayment.medisaveAmount) || 0,

      cashAmount: Number(premiumPayment.cashAmount) || 0,
    },
  };
}

function cloneLongTermCare(longTermCare) {
  if (!longTermCare || typeof longTermCare !== "object") {
    return null;
  }

  const premiumPayment = longTermCare.premiumPayment || {};

  return {
    premiumPayment: {
      medisaveAmount: Number(premiumPayment.medisaveAmount) || 0,

      cashAmount: Number(premiumPayment.cashAmount) || 0,
    },
  };
}

function cloneEndowment(endowment) {
  if (!endowment || typeof endowment !== "object") {
    return null;
  }

  return {
    maturityDate: endowment.maturityDate || "",

    guaranteedMaturityAmount: Number(endowment.guaranteedMaturityAmount) || 0,

    projectedNonGuaranteedAmount:
      Number(endowment.projectedNonGuaranteedAmount) || 0,
  };
}

function cloneRetirement(retirement) {
  if (!retirement || typeof retirement !== "object") {
    return null;
  }

  return {
    payoutStartAge: Number(retirement.payoutStartAge) || 0,

    monthlyIncome: Number(retirement.monthlyIncome) || 0,

    payoutTerm: retirement.payoutTerm || "",

    payoutDurationMonths:
      retirement.payoutTerm === "limited"
        ? Number(retirement.payoutDurationMonths) || 0
        : null,
  };
}