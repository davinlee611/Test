"use strict";

import {
  getCpfContributionRates,
  CPF_ORDINARY_WAGE_CEILING,
  CPF_ANNUAL_WAGE_CEILING,
} from "./cpf-service.js";

import { calculateSelfEmployedMedisave } from "./self-employed-medisave-calculator.js";

/* ========================================
   INCOME CALCULATION SERVICE
======================================== */

export function calculateIncomeSummary({
  monthlyEmploymentIncome = 0,
  annualBonus = 0,

  annualNetTradeIncome = 0,
  netPlatformEarnings = 0,
  sepMedisaveOverrideEnabled = false,
  sepMedisaveOverrideAmount = 0,

  monthlyOtherIncome = 0,

  employmentStatus = "",

  age = null,

  ageAtStartOfWorkYear = null,
}) {
  const safeMonthlyEmploymentIncome = toNonNegativeNumber(
    monthlyEmploymentIncome,
  );

  const safeAnnualBonus = toNonNegativeNumber(annualBonus);

  const safeAnnualNetTradeIncome = toNonNegativeNumber(annualNetTradeIncome);

  const safeMonthlyOtherIncome = toNonNegativeNumber(monthlyOtherIncome);

  const annualOtherIncome = safeMonthlyOtherIncome * 12;

  const isSelfEmployed = employmentStatus === "self_employed";

  const sepMedisave = calculateSelfEmployedMedisave({
    annualNetTradeIncome: safeAnnualNetTradeIncome,

    netPlatformEarnings,

    ageAtStartOfWorkYear,

    overrideEnabled: sepMedisaveOverrideEnabled,

    overrideAnnualAmount: sepMedisaveOverrideAmount,
  });

  if (isSelfEmployed) {
    return calculateSelfEmployedIncome({
      annualNetTradeIncome: safeAnnualNetTradeIncome,

      monthlyOtherIncome: safeMonthlyOtherIncome,

      annualOtherIncome,

      sepMedisave,
    });
  }

  return calculateEmployeeIncome({
    monthlyEmploymentIncome: safeMonthlyEmploymentIncome,

    annualBonus: safeAnnualBonus,

    monthlyOtherIncome: safeMonthlyOtherIncome,

    annualOtherIncome,

    employmentStatus,

    age,

    sepMedisave,
  });
}

/* ========================================
   SELF-EMPLOYED INCOME
======================================== */

function calculateSelfEmployedIncome({
  annualNetTradeIncome,

  monthlyOtherIncome,

  annualOtherIncome,

  sepMedisave,
}) {
  const monthlyNetTradeIncome = annualNetTradeIncome / 12;

  const monthlyTakeHomeIncome =
    monthlyNetTradeIncome -
    sepMedisave.monthlyContribution +
    monthlyOtherIncome;

  const annualTakeHomeIncome =
    annualNetTradeIncome - sepMedisave.annualContribution + annualOtherIncome;

  return {
    cpfApplies: false,

    isSelfEmployed: true,

    employeeCpfRate: 0,
    employerCpfRate: 0,

    monthlyCpfOrdinaryWage: 0,
    monthlyIncomeNotSubjectToCpf: 0,

    annualCpfOrdinaryWage: 0,
    additionalWageCeiling: 0,

    cpfAdditionalWage: 0,
    bonusNotSubjectToCpf: 0,

    monthlyEmployeeCpf: 0,
    monthlyEmployerCpf: 0,

    annualOrdinaryWageEmployeeCpf: 0,
    annualOrdinaryWageEmployerCpf: 0,

    annualAdditionalWageEmployeeCpf: 0,
    annualAdditionalWageEmployerCpf: 0,

    annualEmployeeCpf: 0,
    annualEmployerCpf: 0,

    monthlyEmploymentIncome: 0,
    annualEmploymentIncome: 0,

    annualNetTradeIncome,

    monthlyNetTradeIncome,

    monthlyOtherIncome,

    annualOtherIncome,

    totalMonthlyIncome: monthlyNetTradeIncome + monthlyOtherIncome,

    totalAnnualIncome: annualNetTradeIncome + annualOtherIncome,

    monthlyTakeHomeIncome,

    annualTakeHomeIncome,

    sepMedisave,

    annualSepMedisaveContribution: sepMedisave.annualContribution,

    monthlySepMedisaveContribution: sepMedisave.monthlyContribution,
  };
}

/* ========================================
   EMPLOYEE INCOME
======================================== */

function calculateEmployeeIncome({
  monthlyEmploymentIncome,

  annualBonus,

  monthlyOtherIncome,

  annualOtherIncome,

  employmentStatus,

  age,

  sepMedisave,
}) {
  const cpfApplies = employmentStatus === "full_time_employed" && age !== null;

  const cpfRates = getCpfContributionRates(age);

  const employeeCpfRate = cpfApplies ? cpfRates.employeeRate : 0;

  const employerCpfRate = cpfApplies ? cpfRates.employerRate : 0;

  const monthlyCpfOrdinaryWage = cpfApplies
    ? Math.min(monthlyEmploymentIncome, CPF_ORDINARY_WAGE_CEILING)
    : 0;

  const monthlyIncomeNotSubjectToCpf = cpfApplies
    ? Math.max(0, monthlyEmploymentIncome - monthlyCpfOrdinaryWage)
    : monthlyEmploymentIncome;

  const annualCpfOrdinaryWage = monthlyCpfOrdinaryWage * 12;

  const additionalWageCeiling = cpfApplies
    ? Math.max(0, CPF_ANNUAL_WAGE_CEILING - annualCpfOrdinaryWage)
    : 0;

  const cpfAdditionalWage = cpfApplies
    ? Math.min(annualBonus, additionalWageCeiling)
    : 0;

  const bonusNotSubjectToCpf = cpfApplies
    ? Math.max(0, annualBonus - cpfAdditionalWage)
    : annualBonus;

    const monthlyOrdinaryWageCpf = cpfApplies
      ? calculateCpfContributionSplit({
          wages: monthlyCpfOrdinaryWage,
          employeeRate: employeeCpfRate,
          employerRate: employerCpfRate,
        })
      : {
          employeeContribution: 0,
          employerContribution: 0,
        };

    const monthlyEmployeeCpf = monthlyOrdinaryWageCpf.employeeContribution;

    const monthlyEmployerCpf = monthlyOrdinaryWageCpf.employerContribution;

    const annualOrdinaryWageEmployeeCpf = monthlyEmployeeCpf * 12;

    const annualOrdinaryWageEmployerCpf = monthlyEmployerCpf * 12;

    const additionalWageCpf = cpfApplies
      ? calculateCpfContributionSplit({
          wages: cpfAdditionalWage,
          employeeRate: employeeCpfRate,
          employerRate: employerCpfRate,
        })
      : {
          employeeContribution: 0,
          employerContribution: 0,
        };

    const annualAdditionalWageEmployeeCpf =
      additionalWageCpf.employeeContribution;

    const annualAdditionalWageEmployerCpf =
      additionalWageCpf.employerContribution;

  const annualEmployeeCpf =
    annualOrdinaryWageEmployeeCpf + annualAdditionalWageEmployeeCpf;

  const annualEmployerCpf =
    annualOrdinaryWageEmployerCpf + annualAdditionalWageEmployerCpf;

  const annualEmploymentIncome = monthlyEmploymentIncome * 12 + annualBonus;

  const totalMonthlyIncome = monthlyEmploymentIncome + monthlyOtherIncome;

  const totalAnnualIncome = annualEmploymentIncome + annualOtherIncome;

  const monthlyTakeHomeIncome =
    monthlyEmploymentIncome - monthlyEmployeeCpf + monthlyOtherIncome;

  const annualTakeHomeIncome =
    annualEmploymentIncome - annualEmployeeCpf + annualOtherIncome;

  return {
    cpfApplies,

    isSelfEmployed: false,

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

    monthlyEmploymentIncome,

    annualEmploymentIncome,

    annualNetTradeIncome: 0,
    monthlyNetTradeIncome: 0,

    monthlyOtherIncome,
    annualOtherIncome,

    totalMonthlyIncome,
    totalAnnualIncome,

    monthlyTakeHomeIncome,
    annualTakeHomeIncome,

    sepMedisave,

    annualSepMedisaveContribution: 0,
    monthlySepMedisaveContribution: 0,
  };
}

/* ========================================
   INTERNAL HELPERS
======================================== */

function calculateCpfContributionSplit({
  wages,
  employeeRate,
  employerRate,
}) {
  const safeWages = toNonNegativeNumber(wages);

  const safeEmployeeRate =
    toNonNegativeNumber(employeeRate);

  const safeEmployerRate =
    toNonNegativeNumber(employerRate);

  if (safeWages <= 0) {
    return {
      employeeContribution: 0,
      employerContribution: 0,
    };
  }

  /*
   * CPF Board rounding:
   *
   * 1. Total CPF contribution is rounded
   *    to the nearest dollar.
   *
   * 2. Employee CPF cents are dropped.
   *
   * 3. Employer CPF is the difference
   *    between total CPF and employee CPF.
   */
  const totalContribution = Math.round(
    safeWages *
      (safeEmployeeRate + safeEmployerRate),
  );

  const employeeContribution = Math.floor(
    safeWages * safeEmployeeRate,
  );

  const employerContribution = Math.max(
    totalContribution - employeeContribution,
    0,
  );

  return {
    employeeContribution,
    employerContribution,
  };
}

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

/* ========================================
   DISABILITY INCOME COVERAGE BASIS

   Employed clients are assessed against average gross monthly
   employment income. Self-employed clients have no employer-verified
   salary, so the basis is monthly Net Trade Income instead, at a
   lower coverage ratio reflecting income volatility.
======================================== */

const DISABILITY_INCOME_COVERAGE_RATIO = {
  full_time_employed: 0.75,

  self_employed: 0.65,
};

const DEFAULT_DISABILITY_INCOME_COVERAGE_RATIO = 0.75;

export function getDisabilityIncomeCoverageLimit({
  employmentStatus = "",

  monthlyEmploymentIncome = 0,

  annualBonus = 0,

  annualNetTradeIncome = 0,
}) {
  const isSelfEmployed = employmentStatus === "self_employed";

  const monthlyIncomeBasis = isSelfEmployed
    ? toNonNegativeNumber(annualNetTradeIncome) / 12
    : getAverageGrossMonthlyIncome({ monthlyEmploymentIncome, annualBonus });

  const coverageRatio =
    DISABILITY_INCOME_COVERAGE_RATIO[employmentStatus] ??
    DEFAULT_DISABILITY_INCOME_COVERAGE_RATIO;

  return {
    isSelfEmployed,

    incomeBasisLabel: isSelfEmployed
      ? "monthly Net Trade Income"
      : "average gross monthly employment income",

    monthlyIncomeBasis,

    coverageRatio,

    disabilityIncomeLimit: monthlyIncomeBasis * coverageRatio,
  };
}