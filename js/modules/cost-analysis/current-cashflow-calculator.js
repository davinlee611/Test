"use strict";

import {
  getAssets,
  getClientProfile,
  getExpenses,
  getLiabilities,
} from "../../state/client-plan.js";

import { calculateIncomeSummary } from "../../services/income-calculator.js";

import { getEffectiveMonthlyInsurancePremium } from "../../services/commitment-service.js";

import { getPolicyCashInflow } from "../../services/policy-cashflow-service.js";

import { calculateTotalMonthlyExpenses } from "../expenses/expense-calculator.js";

import { calculateAgeOnDate } from "./cost-analysis-date-utils.js";

import { getNonNegativeNumber } from "./cost-analysis-format-utils.js";

import { calculateMonthlyCashCommitments } from "./commitments-calculator.js";

/* ========================================
   CURRENT MONTHLY CASHFLOW
======================================== */

export function calculateCurrentMonthlyCashflow() {
  const assets = getAssets();

  const profile = getClientProfile();

  const liabilities = getLiabilities();

  const income = assets.income || {};

  const now = new Date();

  const age = calculateAgeOnDate(profile.dateOfBirth, now);

  const incomeSummary = calculateIncomeSummary({
    monthlyEmploymentIncome: income.monthlyEmployment,

    annualBonus: income.annualBonus,

    annualNetTradeIncome: income.annualNetTradeIncome,

    netPlatformEarnings: income.netPlatformEarnings,

    sepMedisaveOverrideEnabled: income.sepMedisaveOverrideEnabled,

    sepMedisaveOverrideAmount: income.sepMedisaveOverrideAmount,

    monthlyOtherIncome: income.otherMonthly,

    employmentStatus: profile.employmentStatus,

    age,

    ageAtStartOfWorkYear: calculateAgeOnDate(
      profile.dateOfBirth,

      new Date(now.getFullYear(), 0, 1),
    ),
  });

  const isSelfEmployed = profile.employmentStatus === "self_employed";

  const employmentIncome = incomeSummary.monthlyEmploymentIncome;

  const annualBonus = getNonNegativeNumber(income.annualBonus);

  const annualNetTradeIncome = incomeSummary.annualNetTradeIncome;

  const otherMonthlyIncome = incomeSummary.monthlyOtherIncome;

  const currentPolicyCashInflow = getPolicyCashInflow({
    projectionDate: now,

    dateOfBirth: profile.dateOfBirth,
  });

  const retirementPolicyIncome = currentPolicyCashInflow.items
    .filter(function (item) {
      return item.policyType === "retirement";
    })
    .reduce(function (total, item) {
      return total + item.amount;
    }, 0);

  const employmentIncomeAfterCpf =
    employmentIncome - incomeSummary.monthlyEmployeeCpf;

  const annualBonusAfterCpf =
    annualBonus - incomeSummary.annualAdditionalWageEmployeeCpf;

  const monthlyBonusAfterCpf = annualBonusAfterCpf / 12;

  const totalMonthlyIncome = isSelfEmployed
    ? incomeSummary.monthlyTakeHomeIncome + retirementPolicyIncome
    : employmentIncomeAfterCpf +
      monthlyBonusAfterCpf +
      otherMonthlyIncome +
      retirementPolicyIncome;

  const monthlyExpenses = calculateTotalMonthlyExpenses(getExpenses());

  const monthlyCashCommitments = calculateMonthlyCashCommitments(liabilities);

  const monthlyInsurancePremiums = getEffectiveMonthlyInsurancePremium();

  const monthlyCommitments = monthlyCashCommitments + monthlyInsurancePremiums;

  const remainingSurplus =
    totalMonthlyIncome - monthlyExpenses - monthlyCommitments;

  return {
    employmentIncome,

    annualBonus,

    annualNetTradeIncome,

    otherMonthlyIncome,

    retirementPolicyIncome,

    isSelfEmployed,

    monthlyNetTradeIncome: incomeSummary.monthlyNetTradeIncome,

    annualSepMedisaveContribution: incomeSummary.annualSepMedisaveContribution,

    monthlySepMedisaveContribution:
      incomeSummary.monthlySepMedisaveContribution,

    employmentIncomeAfterCpf,

    annualBonusAfterCpf,

    monthlyBonusAfterCpf,

    totalMonthlyIncome,

    monthlyExpenses,

    monthlyCommitments,

    remainingSurplus,
  };
}
