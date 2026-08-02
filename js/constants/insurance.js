"use strict";

export const POLICY_TYPE_LABELS = {
  whole_life: "Whole Life",
  term: "Term",
  endowment: "Endowment",
  retirement: "Retirement",
  ilp_protection: "Investment-Linked (Protection)",
  ilp_accumulation: "Investment-Linked (Accumulation)",
  hospitalisation: "Hospitalisation",
  hospital_cash: "Hospital Cash",
  personal_accident: "Personal Accident",
  disability_income: "Disability Income",
  long_term_care: "Long-Term Care",
  other: "Others",
};

export const POLICY_STATUS_LABELS = {
  active: "Active",
  paid_up: "Active (Paid-up)",
};

export const PREMIUM_FREQUENCY_LABELS = {
  annual: "Annual",
  half_yearly: "Half-Yearly",
  quarterly: "Quarterly",
  monthly: "Monthly",
};

export const BENEFIT_LABELS = {
  death: "Death / Terminal Illness",
  tpd: "Total and Permanent Disability",
  critical_illness: "Critical Illness",
  early_critical_illness: "Early Critical Illness",
  hospitalisation: "Hospitalisation",
  hospital_cash: "Hospital Cash",
  medical_reimbursement: "Medical Reimbursement",
  disability_income: "Disability Income",
  long_term_care_income: "Long-Term Care",
  monthly_benefit: "Monthly Benefit",
  other: "Other",
};

export const PAYOUT_TYPE_LABELS = {
  accelerated: "Accelerated",
  additional: "Additional",
  standalone: "Standalone",
};

export const HOSPITAL_CLASS_LABELS = {
  b2_ward: "B2 Ward",
  b1_ward: "B1 Ward",
  a_ward: "A Ward",
  private: "Private Hospital",
};

/*
 * Benefits automatically created when a policy type is selected.
 */
export const POLICY_TYPE_DEFAULT_BENEFITS = {
  whole_life: ["death", "tpd"],

  term: ["death", "tpd"],

  endowment: ["death"],

  retirement: ["death", "monthly_benefit"],

  ilp_protection: ["death", "tpd"],

  ilp_accumulation: ["death"],

  /*
   * Hospitalisation coverage is generated automatically
   * by policy-form-controller.js.
   */
  hospitalisation: [],

  /*
   * Hospital Cash remains editable because the adviser
   * must enter the daily cash benefit.
   */
  hospital_cash: ["hospital_cash"],

  personal_accident: ["death", "tpd", "medical_reimbursement"],

  disability_income: ["disability_income"],

  long_term_care: [],

  other: [],
};

/*
 * Benefit types shown in the Add Benefit dropdown.
 */
export const POLICY_TYPE_BENEFIT_OPTIONS = {
  whole_life: [
    "death",
    "tpd",
    "critical_illness",
    "early_critical_illness",
    "other",
  ],

  term: ["death", "tpd", "critical_illness", "early_critical_illness", "other"],

  endowment: ["death", "other"],

  retirement: ["death", "monthly_benefit", "other"],

  ilp_protection: [
    "death",
    "tpd",
    "critical_illness",
    "early_critical_illness",
    "other",
  ],

  ilp_accumulation: ["death", "other"],

  hospitalisation: [],

  hospital_cash: ["hospital_cash", "other"],

  personal_accident: ["death", "tpd", "medical_reimbursement", "other"],

  disability_income: ["disability_income", "other"],

  long_term_care: ["long_term_care_income", "other"],

  other: Object.keys(BENEFIT_LABELS),
};

export const LONG_TERM_CARE_BASE_PLANS = {
  eldershield_300: {
    name: "ElderShield 300",

    amount: 300,

    payoutTerm: "limited",

    payoutDuration: 60,

    adlRequirement: 3,
  },

  eldershield_400: {
    name: "ElderShield 400",

    amount: 400,

    payoutTerm: "limited",

    payoutDuration: 72,

    adlRequirement: 3,
  },

  careshield_life: {
    name: "CareShield Life",

    amount: 600,

    payoutTerm: "lifetime",

    payoutDuration: null,

    adlRequirement: 3,
  },
};