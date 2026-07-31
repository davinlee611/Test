"use strict";

/* ========================================
   CPF CONFIGURATION
======================================== */

export const CPF_ORDINARY_WAGE_CEILING = 8000;

export const CPF_ANNUAL_WAGE_CEILING = 102000;

/* ========================================
   CPF CONTRIBUTION RATES

   Rates effective from 1 January 2027.
   Applicable to Singapore Citizens and
   third-year Permanent Residents and above
   earning monthly wages above $750.
======================================== */

export function getCpfContributionRates(age) {
  const safeAge = Number(age);

  if (!Number.isFinite(safeAge) || safeAge < 0) {
    return {
      employeeRate: 0,
      employerRate: 0,
    };
  }

  if (safeAge <= 55) {
    return {
      employeeRate: 0.2,
      employerRate: 0.17,
    };
  }

  if (safeAge <= 60) {
    return {
      employeeRate: 0.19,
      employerRate: 0.165,
    };
  }

  if (safeAge <= 65) {
    return {
      employeeRate: 0.13,
      employerRate: 0.13,
    };
  }

  if (safeAge <= 70) {
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

/* ========================================
   CPF ALLOCATION RATES

   Rates effective from 1 January 2027.

   retirementRate represents:
   - SA allocation for age 55 and below
   - RA allocation for age above 55
======================================== */

export function getCpfAllocationRates(age) {
  const safeAge = Number(age);

  if (!Number.isFinite(safeAge) || safeAge < 0) {
    return {
      oaRate: 0,
      retirementRate: 0,
      maRate: 0,
      retirementAccount: "sa",
    };
  }

  if (safeAge <= 35) {
    return {
      oaRate: 0.6217,
      retirementRate: 0.1621,
      maRate: 0.2162,
      retirementAccount: "sa",
    };
  }

  if (safeAge <= 45) {
    return {
      oaRate: 0.5677,
      retirementRate: 0.1891,
      maRate: 0.2432,
      retirementAccount: "sa",
    };
  }

  if (safeAge <= 50) {
    return {
      oaRate: 0.5136,
      retirementRate: 0.2162,
      maRate: 0.2702,
      retirementAccount: "sa",
    };
  }

  if (safeAge <= 55) {
    return {
      oaRate: 0.4055,
      retirementRate: 0.3108,
      maRate: 0.2837,
      retirementAccount: "sa",
    };
  }

  if (safeAge <= 60) {
    return {
      oaRate: 0.3382,
      retirementRate: 0.3661,
      maRate: 0.2957,
      retirementAccount: "ra",
    };
  }

  if (safeAge <= 65) {
    return {
      oaRate: 0.1347,
      retirementRate: 0.4615,
      maRate: 0.4038,
      retirementAccount: "ra",
    };
  }

  if (safeAge <= 70) {
    return {
      oaRate: 0.0607,
      retirementRate: 0.303,
      maRate: 0.6363,
      retirementAccount: "ra",
    };
  }

  return {
    oaRate: 0.08,
    retirementRate: 0.08,
    maRate: 0.84,
    retirementAccount: "ra",
  };
}