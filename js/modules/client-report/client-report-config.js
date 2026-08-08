"use strict";

/* ========================================
   LABELS
======================================== */

export const EMPLOYMENT_STATUS_LABELS = {
  full_time_employed: "Full-time Employed",
  self_employed: "Self-employed",
  unemployed: "Unemployed",
  retired: "Retired",
  student: "Student",
};

export const MARITAL_STATUS_LABELS = {
  single: "Single",
  married: "Married",
  divorced: "Divorced",
  widowed: "Widowed",
};

export const WEALTH_TYPE_LABELS = {
  accumulation: "Accumulation",
  distribution: "Distribution",
  protection: "Protection",
  preservation: "Preservation",
};

export const RANK_LABELS = [
  "1st Priority",
  "2nd Priority",
  "3rd Priority",
  "4th Priority",
];

/*
 * Abbreviated versions of a subset of BENEFIT_LABELS, used only in the
 * Insurance Portfolio report cards so a policy with several benefits
 * doesn't overflow the card border. Everywhere else in the app keeps
 * the full BENEFIT_LABELS text (e.g. the Add Benefit dropdown), since
 * that's a different context where the full wording helps a user
 * unfamiliar with the product pick the right benefit.
 */
export const BENEFIT_LABELS_SHORT = {
  death: "Death / TI",
  tpd: "TPD",
  critical_illness: "CI",
  early_critical_illness: "ECI",
};
