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
    monthlyEmploymentIncome,
    annualBonus,
    otherMonthlyIncome,
    employmentStatus,
    age,
}) {

    const employeeRate =
        employmentStatus === "Full-time"
            ? getCpfContributionRates(age).employeeRate
            : 0;

    const employerRate =
        employmentStatus === "Full-time"
            ? getCpfContributionRates(age).employerRate
            : 0;

    // Remaining calculation logic goes here

    return {
        monthlyTakeHome,
        annualTakeHome,
        annualGrossEmploymentIncome,
        monthlyEmployeeCpf,
        monthlyEmployerCpf,
        annualEmployeeCpf,
        annualEmployerCpf,
        totalMonthlyIncome,
        totalAnnualIncome,
    };
}