"use strict";

/**
 * Enable or disable development data.
 */
export const DEV_MODE = true;

/* ========================================
   CLIENT PROFILE
======================================== */

export function seedClientProfile() {
  if (!DEV_MODE) {
    return null;
  }

  return {
    fullName: "John Tan",

    dateOfBirth: "1989-06-15",

    gender: "male",

    maritalStatus: "married",

    occupation: "Engineer",

    employmentStatus: "full_time_employed",

    phoneNumber: "91234567",

    email: "john.tan@email.com",

    dependants: 2,
  };
}

/* ========================================
   ASSETS & INCOME
======================================== */

export function seedAssetsAndIncome() {
  if (!DEV_MODE) {
    return null;
  }

  return {
    withdrawableAssets: 100000,

    monthlyEmploymentIncome: 10000,

    annualBonus: 20000,

    monthlyOtherIncome: 1,

    cpf: {
      ordinaryAccount: 10000,
      specialAccount: 10000,
      medisaveAccount: 10000,
    },
  };
}

/* ========================================
   PROPERTY
======================================== */

export function seedProperties() {
  if (!DEV_MODE) {
    return [];
  }

  return [
    {
      type: "hdb",

      name: "4-Room HDB",

      marketValue: 100000,

      outstandingLoan: 90000,

      ownershipPercentage: 100,
    },
  ];
}

/* ========================================
   LIABILITIES
======================================== */

export function seedLiabilities() {
  if (!DEV_MODE) {
    return [];
  }

  return [
    {
      type: "property_loan",

      name: "HDB Property Loan",

      outstandingBalance: 90000,

      interestRate: 2.5,

      repaymentEndDate: "2036-07-31",

      monthlyRepayment: 850,

      monthlyRepaymentSource: "manual",

      monthlyCpfPayment: 450,
    },
  ];
}

/* ========================================
   GOALS
======================================== */

export function seedGoals() {
  if (!DEV_MODE) {
    return [];
  }

  return [
    {
      category: "education",

      name: "Children's Education",

      targetAmount: 50000,

      targetDate: "2036-07-01",
    },
  ];
}

/* ========================================
   EXPENSES
======================================== */

export function seedExpenses() {
  if (!DEV_MODE) {
    return {
      categories: [],
    };
  }

  return {
    categories: [
      {
        name: "Household & Utilities",
        monthlyAmount: 1200,
      },
      {
        name: "Food & Groceries",
        monthlyAmount: 700,
      },
      {
        name: "Transport",
        monthlyAmount: 400,
      },
      {
        name: "Family Support",
        monthlyAmount: 500,
      },
      {
        name: "Lifestyle",
        monthlyAmount: 200,
      },
    ],
  };
}

/* ========================================
   COMMITMENTS
======================================== */

export function seedCommitments() {
  if (!DEV_MODE) {
    return null;
  }

  return {
    insurancePremiums: 0,
  };
}
