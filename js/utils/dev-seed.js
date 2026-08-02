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

    policies: seedPolicies(),
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
  return ["preservation", "accumulation", "protection", "distribution"];
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

      annualNetTradeIncome: 0,

      netPlatformEarnings: 0,

      sepMedisaveOverrideEnabled: false,

      sepMedisaveOverrideAmount: 0,

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

      targetDate: createFutureMonthString(10),
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

      repaymentEndDate: createFutureMonthString(10),

      monthlyRepayment: 850,

      monthlyRepaymentSource: "manual",

      monthlyCpfPayment: 450,
    },
  ];
}

/* ========================================
   INSURANCE POLICIES
======================================== */

export function seedPolicies() {
  const lifeAssured = "John Tan";

  return [
    {
      id: createPlannerId(),

      policyName: "Singlife Shield Plan 1 + Rider",

      policyType: "hospitalisation",

      hospitalisation: {
        wardType: "private",

        rider: {
          included: true,

          type: "private_panel",

          annualPremium: 2000,
        },

        premiumPayment: {
          /*
           * John is currently within the
           * $300 Additional Withdrawal Limit band.
           *
           * MediShield Life premium is excluded.
           */
          medisaveAmount: 300,

          /*
           * $3,700 base
           * + $2,000 rider
           * - $300 MediSave
           * = $5,400 annual cash payment
           */
          cashAmount: 5400,
        },
      },

      longTermCareBasePlan: null,

      insurer: "Singlife",

      policyNumber: "SL-HS-100001",

      lifeAssured,

      status: "active",

      /*
       * The generic premium stores only the
       * base Hospitalisation plan premium.
       */
      premium: {
        amount: 3700,

        frequency: "annual",
      },

      benefits: [
        createSeedBenefit({
          type: "hospitalisation",

          customName: "Hospitalisation Coverage",

          lifeAssured,

          hospitalClass: "private",

          riderType: "private_panel",

          notes: "Integrated Shield Plan with rider.",

          source: "base-plan",

          hasUserInput: false,

          isBasePlanBenefit: true,
        }),
      ],
    },

    {
      id: createPlannerId(),

      policyName: "Participating Whole Life Plan",

      policyType: "whole_life",

      longTermCareBasePlan: null,

      insurer: "Great Eastern",

      policyNumber: "GE-WL-100002",

      lifeAssured,

      status: "active",

      premium: {
        amount: 600,

        frequency: "monthly",
      },

      benefits: [
        createSeedBenefit({
          type: "death",

          lifeAssured,

          amount: 500000,
        }),

        createSeedBenefit({
          type: "tpd",

          lifeAssured,

          amount: 500000,
        }),

        createSeedBenefit({
          type: "critical_illness",

          lifeAssured,

          amount: 200000,

          payoutType: "accelerated",
        }),

        createSeedBenefit({
          type: "early_critical_illness",

          lifeAssured,

          amount: 100000,

          payoutType: "accelerated",
        }),
      ],
    },

    {
      id: createPlannerId(),

      policyName: "Standalone Critical Illness Plan",

      policyType: "term",

      longTermCareBasePlan: null,

      insurer: "AIA",

      policyNumber: "AIA-CI-100003",

      lifeAssured,

      status: "active",

      premium: {
        amount: 900,

        frequency: "quarterly",
      },

      benefits: [
        createSeedBenefit({
          type: "critical_illness",

          lifeAssured,

          amount: 300000,

          payoutType: "standalone",
        }),
      ],
    },

    {
      id: createPlannerId(),

      policyName: "Disability Income Protection",

      policyType: "disability_income",

      longTermCareBasePlan: null,

      insurer: "Aviva",

      policyNumber: "AV-DI-100004",

      lifeAssured,

      status: "active",

      premium: {
        amount: 350,

        frequency: "monthly",
      },

      benefits: [
        createSeedBenefit({
          type: "disability_income",

          lifeAssured,

          amount: 5000,

          payoutTerm: "limited",

          payoutDuration: 60,

          notes: "Monthly disability income benefit.",
        }),
      ],
    },

    {
      id: createPlannerId(),

      policyName: "Personal Accident Plan",

      policyType: "personal_accident",

      longTermCareBasePlan: null,

      insurer: "Income Insurance",

      policyNumber: "NTUC-PA-100005",

      lifeAssured,

      status: "active",

      premium: {
        amount: 1200,

        frequency: "annual",
      },

      benefits: [
        createSeedBenefit({
          type: "death",

          lifeAssured,

          amount: 300000,
        }),

        createSeedBenefit({
          type: "tpd",

          lifeAssured,

          amount: 300000,
        }),

        createSeedBenefit({
          type: "medical_reimbursement",

          lifeAssured,

          amount: 5000,
        }),
      ],
    },

    {
      id: createPlannerId(),

      policyName: "Investment-Linked Protection Plan",

      policyType: "ilp_protection",

      longTermCareBasePlan: null,

      insurer: "Prudential",

      policyNumber: "PRU-ILP-100006",

      lifeAssured,

      status: "active",

      premium: {
        amount: 19200,

        frequency: "annual",
      },

      benefits: [
        createSeedBenefit({
          type: "death",

          lifeAssured,

          amount: 250000,
        }),

        createSeedBenefit({
          type: "tpd",

          lifeAssured,

          amount: 250000,
        }),
      ],
    },

    {
      id: createPlannerId(),

      policyName: "Child Education Endowment",

      policyType: "endowment",

      longTermCareBasePlan: null,

      insurer: "Manulife",

      policyNumber: "MAN-END-100007",

      lifeAssured: "Emily Tan",

      status: "paid_up",

      premium: {
        amount: 0,

        frequency: null,
      },

      benefits: [
        createSeedBenefit({
          type: "death",

          lifeAssured: "Emily Tan",

          amount: 50000,
        }),

        createSeedBenefit({
          type: "other",

          customName: "Maturity Benefit",

          lifeAssured: "Emily Tan",

          amount: 80000,

          notes: "Estimated maturity value for education funding.",
        }),
      ],
    },

    {
      id: createPlannerId(),

      policyName: "Paid-Up Whole Life Plan",

      policyType: "whole_life",

      longTermCareBasePlan: null,

      insurer: "NTUC Income",

      policyNumber: "NTUC-WL-100008",

      lifeAssured,

      status: "paid_up",

      premium: {
        amount: 0,

        frequency: null,
      },

      benefits: [
        createSeedBenefit({
          type: "death",

          lifeAssured,

          amount: 100000,
        }),

        createSeedBenefit({
          type: "tpd",

          lifeAssured,

          amount: 100000,
        }),
      ],
    },
  ];
}

/* ========================================
   INSURANCE BENEFIT FACTORY
======================================== */

function createSeedBenefit({
  type,

  customName = "",

  lifeAssured,

  amount = 0,

  payoutType = null,

  payoutTerm = null,

  payoutDuration = null,

  hospitalClass = "",

  riderType = "",

  adlRequirement = null,

  notes = "",

  source = "user-added",

  hasUserInput = true,

  isSuggested = false,

  isBasePlanBenefit = false,
}) {
  return {
    id: createPlannerId(),

    type,

    customName,

    lifeAssured,

    amount,

    payoutType,

    payoutTerm,

    payoutDuration,

    hospitalClass,

    riderType,

    adlRequirement,

    notes,

    source,

    status: "existing",

    hasUserInput,

    isSuggested,

    isBasePlanBenefit,
  };
}

/* ========================================
   DATE HELPER
======================================== */

function createFutureMonthString(yearsFromNow) {
  const date = new Date();

  date.setFullYear(date.getFullYear() + yearsFromNow);

  return [
    date.getFullYear(),

    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}