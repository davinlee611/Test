"use strict";

import { getPolicies, setPolicies } from "../state/client-plan.js";

import {
  appendItem,
  findItemById,
  removeItemById,
  updateItemById,
} from "../utils/collection-utils.js";

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

export function createPolicy(policy) {
  if (!policy || typeof policy !== "object" || !policy.id) {
    return null;
  }

  setPolicies(appendItem(getPolicies(), policy));

  return policy;
}

export function updatePolicy(policyId, updates) {
  if (!updates || typeof updates !== "object") {
    return null;
  }

  const { items, updatedItem } = updateItemById(
    getPolicies(),
    policyId,
    (policy) => ({
      ...policy,
      ...updates,
      id: policy.id,
    }),
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