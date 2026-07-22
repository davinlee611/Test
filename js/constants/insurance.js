"use strict";

export const POLICY_TYPE_LABELS = {
  whole_life: "Whole Life",
  term: "Term",
  endowment: "Endowment",
  retirement: "Retirement",
  ilp_protection: "Investment-Linked (Protection)",
  ilp_accumulation: "Investment-Linked (Accumulation)",
  hospitalisation: "Hospitalisation",
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
  long_term_care_income: "Long-Term Care Income",
  survival_benefit: "Survival Benefit",
  other: "Other",
};

export const PAYOUT_TYPE_LABELS = {
  accelerated: "Accelerated",
  additional: "Additional",
  standalone: "Standalone",
};

export const HOSPITAL_CLASS_LABELS = {
  b_ward: "B Ward",
  a_ward: "A Ward",
  private: "Private Hospital",
};

export const POLICY_TYPE_DEFAULT_BENEFITS = {
  whole_life: ["death", "tpd"],

  term: ["death", "tpd"],

  endowment: ["death", "survival_benefit"],

  retirement: ["survival_benefit"],

  ilp_protection: ["death", "tpd"],

  ilp_accumulation: ["survival_benefit"],

  hospitalisation: ["hospitalisation"],

  personal_accident: ["death", "tpd", "medical_reimbursement"],

  disability_income: ["disability_income"],

  long_term_care: ["long_term_care_income"],

  other: [],
};
