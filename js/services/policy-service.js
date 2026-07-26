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

export function createPolicy({
  policyName,
  policyType,
  longTermCareBasePlan = null,
  insurer,
  policyNumber,
  lifeAssured,
  status,
  premium,
  benefits = [],
}) {
  const newPolicy = {
    id: createPlannerId(),
    policyName,
    policyType,
    longTermCareBasePlan,
    insurer,
    policyNumber,
    lifeAssured,
    status,

    premium: clonePolicyPremium(premium),

    benefits: cloneBenefits(benefits),
  };

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