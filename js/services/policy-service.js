"use strict";

import { getPolicies, setPolicies } from "../state/client-plan.js";

/* ========================================
   POLICY QUERIES
======================================== */

export function getAllPolicies() {
  return getPolicies();
}

export function getPolicyById(policyId) {
  return getPolicies().find((policy) => policy.id === policyId) ?? null;
}

/* ========================================
   POLICY COMMANDS
======================================== */

export function createPolicy(policy) {
  if (!policy || typeof policy !== "object" || !policy.id) {
    return null;
  }

  setPolicies([...getPolicies(), policy]);

  return policy;
}

export function updatePolicy(policyId, updates) {
  let updatedPolicy = null;

  const policies = getPolicies().map((policy) => {
    if (policy.id !== policyId) {
      return policy;
    }

    updatedPolicy = {
      ...policy,
      ...updates,
    };

    return updatedPolicy;
  });

  if (!updatedPolicy) {
    return null;
  }

  setPolicies(policies);

  return updatedPolicy;
}

export function removePolicy(policyId) {
  const existingPolicy = getPolicyById(policyId);

  if (!existingPolicy) {
    return false;
  }

  setPolicies(getPolicies().filter((policy) => policy.id !== policyId));

  return true;
}

export function clearPolicies() {
  setPolicies([]);
}
