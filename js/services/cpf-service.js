"use strict";


/* ========================================
   CPF CONFIGURATION
======================================== */

export const CPF_ORDINARY_WAGE_CEILING =
    8000;

export const CPF_ANNUAL_WAGE_CEILING =
    102000;


/* ========================================
   CPF CONTRIBUTION RATES
======================================== */

export function getCpfContributionRates(
    age,
) {
    if (age === null || age < 0) {
        return {
            employeeRate: 0,
            employerRate: 0,
        };
    }

    if (age <= 55) {
        return {
            employeeRate: 0.20,
            employerRate: 0.17,
        };
    }

    if (age <= 60) {
        return {
            employeeRate: 0.18,
            employerRate: 0.16,
        };
    }

    if (age <= 65) {
        return {
            employeeRate: 0.125,
            employerRate: 0.125,
        };
    }

    if (age <= 70) {
        return {
            employeeRate: 0.075,
            employerRate: 0.09,
        };
    }

    return {
        employeeRate: 0.05,
        employerRate: 0.075,
    };
}