"use strict";

import { createEmptyClientPlan } from "../state/client-plan.js";

import { createPlannerId } from "./client-utils.js";

/**
 * Set this to false when you no longer want the
 * planner to load with demonstration data.
 */
export const DEV_MODE = true;

/* ========================================
   COMPLETE DEMO SCENARIO
======================================== */

export function resetDemoScenario() {
  if (!DEV_MODE) {
    return null;
  }

  const demoPlan = createEmptyClientPlan();

  demoPlan.profile = seedClientProfile();

  demoPlan.priorities = {
    ...demoPlan.priorities,

    selectedWealthTypes: seedSelectedWealthTypes(),

    assets: {
      ...seedAssetsAndIncome(),

      properties: seedProperties(),
    },

    expenses: seedExpenses(),

    commitments: seedCommitments(),

    goals: seedGoals(),

    liabilities: seedLiabilities(),

    /*
     * Insurance will remain empty for now.
     */
    policies: [],
  };

  return demoPlan;
}

/* ========================================
   CLIENT PROFILE
======================================== */

export function seedClientProfile() {
  return {
    fullName: "John Tan",

    dateOfBirth: "1989-06-15",

    gender: "male",

    maritalStatus: "married",

    occupation: "Engineer",

    employmentStatus: "full_time_employed",

    phone: "91234567",

    email: "john.tan@email.com",

    dependants: 2,
  };
}

/* ========================================
   WEALTH TYPES
======================================== */

export function seedSelectedWealthTypes() {
  return ["accumulation", "protection"];
}

/* ========================================
   ASSETS AND INCOME
======================================== */

export function seedAssetsAndIncome() {
  return {
    liquidAssets: {
      cashInBank: 50000,

      fixedDeposits: 20000,

      tBills: 10000,

      investments: 20000,

      others: 0,
    },

    income: {
      monthlyEmployment: 10000,

      annualBonus: 20000,

      otherMonthly: 1,
    },

    cpf: {
      oa: 10000,

      sa: 10000,

      ma: 10000,

      ra: 0,
    },
  };
}

/* ========================================
   PROPERTIES
======================================== */

export function seedProperties() {
  return [
    {
      id: createPlannerId(),

      type: "HDB",

      marketValue: 100000,

      ownershipPercentage: 100,
    },
  ];
}

/* ========================================
   EXPENSES
======================================== */

export function seedExpenses() {
  return {
    household: 1200,

    transport: 400,

    subscriptionsLifestyle: 200,

    parentsDependantsSupport: 500,

    otherRecurringExpenses: 700,
  };
}

/* ========================================
   COMMITMENTS
======================================== */

export function seedCommitments() {
  return {
    /*
     * Insurance will be added later.
     */
    insurancePremiums: 0,
  };
}

/* ========================================
   GOALS
======================================== */

export function seedGoals() {
  return [
    {
      id: createPlannerId(),

      type: "education",

      name: "Children’s Education",

      targetAmount: 50000,

      targetDate: createFutureDateString(10),
    },
  ];
}

/* ========================================
   LIABILITIES
======================================== */

export function seedLiabilities() {
  return [
    {
      id: createPlannerId(),

      type: "property_loan",

      name: "HDB Property Loan",

      outstandingBalance: 90000,

      interestRate: 2.5,

      repaymentEndDate: createFutureDateString(10),

      monthlyRepayment: 850,

      monthlyRepaymentSource: "manual",

      monthlyCpfPayment: 450,
    },
  ];
}

/* ========================================
   DATE HELPER
======================================== */

function createFutureDateString(yearsFromNow) {
  const date = new Date();

  date.setFullYear(date.getFullYear() + yearsFromNow);

  return [
    date.getFullYear(),

    String(date.getMonth() + 1).padStart(2, "0"),

    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}