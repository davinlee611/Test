"use strict";

import {
  getAssets,
  getClientProfile,
  getExpenses,
  getGoals,
  getLiabilities,
  getPriorities,
  getProperties,
  getProtection,
} from "../../state/client-plan.js";

import { getClientAge } from "../client-profile.js";

import { getAllPolicies } from "../../services/policy-service.js";

import { getEffectiveMonthlyInsurancePremium } from "../../services/commitment-service.js";

import {
  calculateCpfBalanceTotal,
  calculateLiquidAssetTotal,
} from "../assets-income/assets-income-calculator.js";

import { calculateTotalMonthlyExpenses } from "../expenses/expense-calculator.js";

import { EXPENSE_FIELDS } from "../expenses/expense-config.js";

import {
  getGrossRetirementGoalSummary,
  getProjectedCohortFrs,
} from "../cost-of-wants/cost-of-wants-service.js";

import { getProjectedCohortBasicHealthcareSum } from "../../services/cpf-healthcare-service.js";

import {
  getLatestCurrentCashflow,
  getLatestYourNextStepsResult,
  getLatestYourPathProjectedPosition,
} from "../cost-analysis.js";

import { getCoverageNeededBreakdown } from "../protection-analysis.js";

import {
  calculateCoverageGap,
  calculateExistingCriticalIllnessCoverage,
} from "../../services/protection-coverage-calculator.js";

import {
  getInjuryCheckResult,
  getWaitTimeCheckResult,
} from "../sbmi-analysis.js";

import {
  EMPLOYMENT_STATUS_LABELS,
  MARITAL_STATUS_LABELS,
} from "./client-report-config.js";

/* ========================================
   COST OF WANTS ANALYSIS GATE

   Mirrors hasProtectionAnalysisContent() below: "complete enough to
   report on" means the adviser has actually entered the Cost of Wants
   inputs needed to produce a retirement goal, not just that the app
   can compute a ($0) target for a client who never opened the page.
======================================== */

export function hasCostOfWantsContent() {
  return getGrossRetirementGoalSummary().isValid;
}

/* ========================================
   PROTECTION ANALYSIS GATE

   "Complete enough to report on" means the adviser has actually gone
   through Protection Analysis, not just that the app can compute a
   ($0) gap for a client who never opened the page.
======================================== */

export function hasProtectionAnalysisContent() {
  const protection = getProtection();

  return (
    Number(protection.waitTimeImportance) > 0 ||
    protection.activeExerciseInjuryProne !== null ||
    (protection.selectedExpenseKeys || []).length > 0 ||
    (protection.selectedLiabilityIds || []).length > 0
  );
}

/* ========================================
   DATA AGGREGATION

   Reuses the same selectors/services/cached results already used
   elsewhere in the app rather than recalculating anything
   independently.
======================================== */

export function buildClientReportData() {
  const profile = getClientProfile();

  const assets = getAssets();

  const age = getClientAge();

  const currentCashflow = getLatestCurrentCashflow();

  const position = getLatestYourPathProjectedPosition();

  const nextSteps = getLatestYourNextStepsResult();

  const goal = getGrossRetirementGoalSummary();

  const frs = getProjectedCohortFrs();

  const bhs = getProjectedCohortBasicHealthcareSum({
    dateOfBirth: profile.dateOfBirth,
  });

  const policies = getAllPolicies();

  const priorities = getPriorities();

  const wealthTypes = priorities.selectedWealthTypes || [];

  const protection = getProtection();

  const coverageNeeded = getCoverageNeededBreakdown(protection);

  const existingCoverage = calculateExistingCriticalIllnessCoverage();

  const coverageGap = calculateCoverageGap(
    coverageNeeded.totalNeeded,
    existingCoverage.totalAmount,
  );

  return {
    generatedAt: new Date(),

    wealthTypes,

    profile: {
      fullName: profile.fullName || "Client Report",

      age,

      maritalStatusLabel: MARITAL_STATUS_LABELS[profile.maritalStatus] || "",

      employmentStatusLabel:
        EMPLOYMENT_STATUS_LABELS[profile.employmentStatus] || "",

      occupation: profile.occupation || "",

      dependants: Number(profile.dependants) || 0,
    },

    currentCashflow,

    expenses: {
      total: calculateTotalMonthlyExpenses(getExpenses()),

      breakdown: buildExpenseBreakdown(getExpenses()),
    },

    cpf: {
      oa: Number(assets?.cpf?.oa) || 0,
      sa: Number(assets?.cpf?.sa) || 0,
      ma: Number(assets?.cpf?.ma) || 0,
      ra: Number(assets?.cpf?.ra) || 0,
      total: calculateCpfBalanceTotal(assets?.cpf, age),
    },

    liquidAssetsTotal: calculateLiquidAssetTotal(assets?.liquidAssets),

    properties: getProperties() || [],

    goals: getGoals() || [],

    liabilities: getLiabilities() || [],

    policies,

    totalMonthlyPremium: getEffectiveMonthlyInsurancePremium(),

    goal,

    position,

    nextSteps,

    cpfAssumptions: { frs, bhs },

    hasRetirementPlan: Boolean(goal?.isValid && position?.isValid),

    hasProtectionAnalysis: hasProtectionAnalysisContent(),

    protectionAnalysis: {
      coverageNeeded,
      existingCoverage,
      coverageGap,
      waitTimeCheck: getWaitTimeCheckResult(),
      injuryCheck: getInjuryCheckResult(),
    },
  };
}

function buildExpenseBreakdown(expenses) {
  return EXPENSE_FIELDS.map(function (field) {
    return {
      label: field.label,

      amount: Number(expenses?.[field.key]) || 0,
    };
  }).filter(function (item) {
    return item.amount > 0;
  });
}
