"use strict";

import {
  CPF_ORDINARY_WAGE_CEILING,
  CPF_ANNUAL_WAGE_CEILING,
  getCpfContributionRates,
} from "./cpf-service.js";

/* ========================================
   INCOME CALCULATION SERVICE
======================================== */

export function calculateIncomeSummary({
  monthlyEmploymentIncome = 0,
  annualBonus = 0,
  monthlyOtherIncome = 0,
  employmentStatus = "",
  age = null,
}) {
  const safeMonthlyEmploymentIncome = toNonNegativeNumber(
    monthlyEmploymentIncome,
  );

  const safeAnnualBonus = toNonNegativeNumber(annualBonus);

  const safeMonthlyOtherIncome = toNonNegativeNumber(monthlyOtherIncome);

  const cpfApplies = employmentStatus === "full_time_employed" && age !== null;

  const cpfRates = getCpfContributionRates(age);

  const employeeCpfRate = cpfApplies ? cpfRates.employeeRate : 0;

  const employerCpfRate = cpfApplies ? cpfRates.employerRate : 0;

  const monthlyCpfOrdinaryWage = cpfApplies
    ? Math.min(safeMonthlyEmploymentIncome, CPF_ORDINARY_WAGE_CEILING)
    : 0;

  const monthlyIncomeNotSubjectToCpf = cpfApplies
    ? Math.max(0, safeMonthlyEmploymentIncome - monthlyCpfOrdinaryWage)
    : safeMonthlyEmploymentIncome;

  const annualCpfOrdinaryWage = monthlyCpfOrdinaryWage * 12;

  const additionalWageCeiling = cpfApplies
    ? Math.max(0, CPF_ANNUAL_WAGE_CEILING - annualCpfOrdinaryWage)
    : 0;

  const cpfAdditionalWage = cpfApplies
    ? Math.min(safeAnnualBonus, additionalWageCeiling)
    : 0;

  const bonusNotSubjectToCpf = cpfApplies
    ? Math.max(0, safeAnnualBonus - cpfAdditionalWage)
    : safeAnnualBonus;

  const monthlyEmployeeCpf = cpfApplies
    ? Math.round(monthlyCpfOrdinaryWage * employeeCpfRate)
    : 0;

  const monthlyEmployerCpf = cpfApplies
    ? Math.round(monthlyCpfOrdinaryWage * employerCpfRate)
    : 0;

  const annualOrdinaryWageEmployeeCpf = monthlyEmployeeCpf * 12;

  const annualOrdinaryWageEmployerCpf = monthlyEmployerCpf * 12;

  const annualAdditionalWageEmployeeCpf = cpfApplies
    ? Math.round(cpfAdditionalWage * employeeCpfRate)
    : 0;

  const annualAdditionalWageEmployerCpf = cpfApplies
    ? Math.round(cpfAdditionalWage * employerCpfRate)
    : 0;

  const annualEmployeeCpf =
    annualOrdinaryWageEmployeeCpf + annualAdditionalWageEmployeeCpf;

  const annualEmployerCpf =
    annualOrdinaryWageEmployerCpf + annualAdditionalWageEmployerCpf;

  const annualEmploymentIncome =
    safeMonthlyEmploymentIncome * 12 + safeAnnualBonus;

  const annualOtherIncome = safeMonthlyOtherIncome * 12;

  const totalMonthlyIncome =
    safeMonthlyEmploymentIncome + safeMonthlyOtherIncome;

  const totalAnnualIncome = annualEmploymentIncome + annualOtherIncome;

  const monthlyTakeHomeIncome =
    safeMonthlyEmploymentIncome - monthlyEmployeeCpf + safeMonthlyOtherIncome;

  const annualTakeHomeIncome =
    annualEmploymentIncome - annualEmployeeCpf + annualOtherIncome;

  return {
    cpfApplies,

    employeeCpfRate,
    employerCpfRate,

    monthlyCpfOrdinaryWage,
    monthlyIncomeNotSubjectToCpf,
    annualCpfOrdinaryWage,
    additionalWageCeiling,
    cpfAdditionalWage,
    bonusNotSubjectToCpf,

    monthlyEmployeeCpf,
    monthlyEmployerCpf,

    annualOrdinaryWageEmployeeCpf,
    annualOrdinaryWageEmployerCpf,

    annualAdditionalWageEmployeeCpf,
    annualAdditionalWageEmployerCpf,

    annualEmployeeCpf,
    annualEmployerCpf,

    monthlyEmploymentIncome: safeMonthlyEmploymentIncome,

    annualEmploymentIncome,
    monthlyOtherIncome: safeMonthlyOtherIncome,
    annualOtherIncome,

    totalMonthlyIncome,
    totalAnnualIncome,

    monthlyTakeHomeIncome,
    annualTakeHomeIncome,
  };
}

/* ========================================
   INTERNAL HELPERS
======================================== */

function toNonNegativeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return number;
}

/* ========================================
   PUBLIC HELPERS
======================================== */

export function getAverageGrossMonthlyIncome({
  monthlyEmploymentIncome = 0,
  annualBonus = 0,
}) {
  return (
    toNonNegativeNumber(monthlyEmploymentIncome) +
    toNonNegativeNumber(annualBonus) / 12
  );
}