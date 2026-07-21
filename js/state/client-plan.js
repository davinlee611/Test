"use strict";

/* ========================================
   PLAN FACTORY
======================================== */

export function createEmptyClientPlan() {
  return {
    id: null,
    ownerId: null,

    profile: {
      fullName: "",
      dateOfBirth: "",
      gender: "",
      maritalStatus: "",
      occupation: "",
      employmentStatus: "",
      phone: "",
      email: "",
      dependants: 0,
    },

    priorities: {
      selectedWealthTypes: [],

      assets: {
        liquidAssets: {
          cashInBank: 0,
          fixedDeposits: 0,
          tBills: 0,
          investments: 0,
          others: 0,
        },

        income: {
          monthlyEmployment: 0,
          annualBonus: 0,
          otherMonthly: 0,
        },

        cpf: {
          oa: 0,
          sa: 0,
          ma: 0,
          ra: 0,
        },

        properties: [],
      },

      goals: [],
      liabilities: [],
      policies: [],
    },

    costOfWants: {
      education: [],
      retirement: {},
      legacy: {},
      emergencyFund: {},
      debtClearance: {},
      customGoals: [],
    },

    summary: {},

    metadata: {
      createdAt: null,
      updatedAt: null,
    },
  };
}

/* ========================================
   PRIVATE STATE
======================================== */

let clientPlan = createEmptyClientPlan();

export { clientPlan };

/* ========================================
   STATE ACCESS
======================================== */

export function getClientPlan() {
  return clientPlan;
}

export function getClientProfile() {
  return clientPlan.profile;
}

export function getPriorities() {
  return clientPlan.priorities;
}

export function getAssets() {
  return clientPlan.priorities.assets;
}

export function getGoals() {
  return clientPlan.priorities.goals;
}

export function getProperties() {
  return clientPlan.priorities.assets.properties;
}

export function getLiabilities() {
  return clientPlan.priorities.liabilities;
}

export function getPolicies() {
  return clientPlan.priorities.policies;
}

/* ========================================
   STATE REPLACEMENT
======================================== */

export function replaceClientPlan(plan) {
  clientPlan = normalizeClientPlan(plan);
  touchClientPlan();

  return clientPlan;
}

export function resetClientPlan() {
  clientPlan = createEmptyClientPlan();

  return clientPlan;
}

/* ========================================
   STATE UPDATES
======================================== */

export function updateClientProfile(updates) {
  clientPlan.profile = {
    ...clientPlan.profile,
    ...updates,
  };

  touchClientPlan();

  return clientPlan.profile;
}

export function updatePriorities(updates) {
  clientPlan.priorities = {
    ...clientPlan.priorities,
    ...updates,
  };

  touchClientPlan();

  return clientPlan.priorities;
}

export function updateAssets(updates) {
  clientPlan.priorities.assets = {
    ...clientPlan.priorities.assets,
    ...updates,
  };

  touchClientPlan();

  return clientPlan.priorities.assets;
}

export function setGoals(goals) {
  clientPlan.priorities.goals = Array.isArray(goals) ? [...goals] : [];

  touchClientPlan();

  return clientPlan.priorities.goals;
}

export function setProperties(properties) {
  clientPlan.priorities.assets.properties = Array.isArray(properties)
    ? [...properties]
    : [];

  touchClientPlan();

  return clientPlan.priorities.assets.properties;
}

export function setLiabilities(liabilities) {
  clientPlan.priorities.liabilities = Array.isArray(liabilities)
    ? [...liabilities]
    : [];

  touchClientPlan();

  return clientPlan.priorities.liabilities;
}

export function setPolicies(policies) {
  clientPlan.priorities.policies = Array.isArray(policies) ? [...policies] : [];

  touchClientPlan();

  return clientPlan.priorities.policies;
}

/* ========================================
   INTERNAL HELPERS
======================================== */

function touchClientPlan() {
  const now = new Date().toISOString();

  if (!clientPlan.metadata.createdAt) {
    clientPlan.metadata.createdAt = now;
  }

  clientPlan.metadata.updatedAt = now;
}

function normalizeClientPlan(plan) {
  const emptyPlan = createEmptyClientPlan();

  if (!plan || typeof plan !== "object") {
    return emptyPlan;
  }

  return {
    ...emptyPlan,
    ...plan,

    profile: {
      ...emptyPlan.profile,
      ...plan.profile,
    },

    priorities: {
      ...emptyPlan.priorities,
      ...plan.priorities,

      assets: {
        ...emptyPlan.priorities.assets,
        ...plan.priorities?.assets,

        liquidAssets: {
          ...emptyPlan.priorities.assets.liquidAssets,
          ...plan.priorities?.assets?.liquidAssets,
        },

        income: {
          ...emptyPlan.priorities.assets.income,
          ...plan.priorities?.assets?.income,
        },

        cpf: {
          ...emptyPlan.priorities.assets.cpf,
          ...plan.priorities?.assets?.cpf,
        },

        properties: Array.isArray(plan.priorities?.assets?.properties)
          ? plan.priorities.assets.properties
          : [],
      },

      goals: Array.isArray(plan.priorities?.goals) ? plan.priorities.goals : [],

      liabilities: Array.isArray(plan.priorities?.liabilities)
        ? plan.priorities.liabilities
        : [],

      policies: Array.isArray(plan.priorities?.policies)
        ? plan.priorities.policies
        : [],
    },

    costOfWants: {
      ...emptyPlan.costOfWants,
      ...plan.costOfWants,
    },

    summary: {
      ...emptyPlan.summary,
      ...plan.summary,
    },

    metadata: {
      ...emptyPlan.metadata,
      ...plan.metadata,
    },
  };
}
