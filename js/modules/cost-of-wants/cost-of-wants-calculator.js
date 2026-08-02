"use strict";

/* ========================================
   CPF RETIREMENT CONFIGURATION
======================================== */

export const DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE = 3.5;

export const LATEST_OFFICIAL_RETIREMENT_SUM_YEAR = 2027;

/*
 * CPF Retirement Sums applicable when the member turns 55.
 *
 * ERS:
 * - 2022 to 2024: 1.5 times FRS
 * - 2025 onwards: 2 times FRS
 */
const OFFICIAL_RETIREMENT_SUMS = Object.freeze({
  2022: Object.freeze({
    brs: 96000,
    frs: 192000,
    ers: 288000,
  }),

  2023: Object.freeze({
    brs: 99400,
    frs: 198800,
    ers: 298200,
  }),

  2024: Object.freeze({
    brs: 102900,
    frs: 205800,
    ers: 308700,
  }),

  2025: Object.freeze({
    brs: 106500,
    frs: 213000,
    ers: 426000,
  }),

  2026: Object.freeze({
    brs: 110200,
    frs: 220400,
    ers: 440800,
  }),

  2027: Object.freeze({
    brs: 114100,
    frs: 228200,
    ers: 456400,
  }),
});

const LATEST_OFFICIAL_FRS =
  OFFICIAL_RETIREMENT_SUMS[LATEST_OFFICIAL_RETIREMENT_SUM_YEAR].frs;

/*
 * Published CPF LIFE payout figures for the available cohorts.
 */
const OFFICIAL_CPF_LIFE_PAYOUTS = Object.freeze({
  2022: Object.freeze({
    male: Object.freeze({
      brs: 720,
      frs: 1320,
      ers: 1940,
    }),

    female: Object.freeze({
      brs: 670,
      frs: 1230,
      ers: 1810,
    }),
  }),

  2023: Object.freeze({
    male: Object.freeze({
      brs: 750,
      frs: 1420,
      ers: 2100,
    }),

    female: Object.freeze({
      brs: 700,
      frs: 1330,
      ers: 1950,
    }),
  }),

  2024: Object.freeze({
    male: Object.freeze({
      brs: 820,
      frs: 1520,
      ers: 2250,
    }),

    female: Object.freeze({
      brs: 770,
      frs: 1420,
      ers: 2100,
    }),
  }),

  2025: Object.freeze({
    male: Object.freeze({
      brs: 880,
      frs: 1650,
      ers: 3210,
    }),

    female: Object.freeze({
      brs: 820,
      frs: 1540,
      ers: 2990,
    }),
  }),

  2026: Object.freeze({
    male: Object.freeze({
      brs: 930,
      frs: 1750,
      ers: 3410,
    }),

    female: Object.freeze({
      brs: 890,
      frs: 1640,
      ers: 3180,
    }),
  }),
});

/*
 * Locked future CPF LIFE payout model.
 *
 * Male:
 * monthly payout = 100 + RA at 65 × 0.00507067220929381
 *
 * Female:
 * monthly payout = 120 + RA at 65 × 0.004685336151938148
 */
export const CPF_LIFE_PAYOUT_MODEL = Object.freeze({
  basisYear: 2026,

  male: Object.freeze({
    fixedAmount: 100,
    raFactor: 0.00507067220929381,
  }),

  female: Object.freeze({
    fixedAmount: 120,
    raFactor: 0.004685336151938148,
  }),

  roundingIncrement: 10,
});

export const CPF_RA_INTEREST_RATE = 4;

export const CPF_RA_COMPOUNDING_YEARS = 10;

/* ========================================
   CPF RETIREMENT PROJECTION
======================================== */

export function calculateClientCpfRetirementProjection({
  currentAge,
  gender,
  dateOfBirth,
  annualGrowthRate = DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE,
}) {
  if (!Number.isFinite(currentAge)) {
    return {
      isValid: false,
      message:
        "Complete the client's date of birth to calculate the projection.",
    };
  }

  if (gender !== "male" && gender !== "female") {
    return {
      isValid: false,
      message:
        "Select the client's gender to calculate the estimated CPF LIFE payout.",
    };
  }

  const yearTurning55 = calculateYearTurningAge(dateOfBirth, 55);

  if (!yearTurning55) {
    return {
      isValid: false,
      message: "Unable to determine the year the client turns 55.",
    };
  }

  const earliestOfficialRetirementSumYear =
    getEarliestOfficialRetirementSumYear();

  if (yearTurning55 < earliestOfficialRetirementSumYear) {
    return {
      isValid: false,
      message: [
        `The client turned 55 in ${yearTurning55}.`,
        `CPF Retirement Sum data is currently available from`,
        `${earliestOfficialRetirementSumYear} onwards.`,
      ].join(" "),
    };
  }

  const safeAnnualGrowthRate = normalizeGrowthRate(annualGrowthRate);

  const calculatedRetirementSums = calculateCpfRetirementSums({
    yearTurning55,
    annualGrowthRate: safeAnnualGrowthRate,
  });

  if (
    !Number.isFinite(calculatedRetirementSums.frs) ||
    calculatedRetirementSums.frs <= 0
  ) {
    return {
      isValid: false,
      message: "Unable to calculate the CPF Retirement Sums.",
    };
  }

  const retirementSums = {
    brs: roundCpfProjectionAmount(calculatedRetirementSums.brs),

    frs: roundCpfProjectionAmount(calculatedRetirementSums.frs),

    ers: roundCpfProjectionAmount(calculatedRetirementSums.ers),
  };

  const raAt65 = {
    brs: calculateCpfRaAt65(retirementSums.brs),

    frs: calculateCpfRaAt65(retirementSums.frs),

    ers: calculateCpfRaAt65(retirementSums.ers),
  };

  const cpfLifeProjection = calculateCpfLifePayouts({
    yearTurning55,
    gender,
    raAt65,
  });

  return {
    isValid: true,
    yearTurning55,
    gender,
    annualGrowthRate: safeAnnualGrowthRate,
    retirementSumBasis: calculatedRetirementSums.basis,
    payoutBasis: cpfLifeProjection.basis,
    retirementSums,
    raAt65,
    monthlyPayouts: cpfLifeProjection.monthlyPayouts,
  };
}

export function calculateCpfRetirementSums({
  yearTurning55,
  annualGrowthRate,
}) {
  const officialRetirementSums = OFFICIAL_RETIREMENT_SUMS[yearTurning55];

  if (officialRetirementSums) {
    return {
      brs: officialRetirementSums.brs,
      frs: officialRetirementSums.frs,
      ers: officialRetirementSums.ers,
      basis: "official",
    };
  }

  if (yearTurning55 < LATEST_OFFICIAL_RETIREMENT_SUM_YEAR) {
    return {
      brs: 0,
      frs: 0,
      ers: 0,
      basis: "unavailable",
    };
  }

  const projectionYears = yearTurning55 - LATEST_OFFICIAL_RETIREMENT_SUM_YEAR;

  const decimalGrowthRate = normalizeGrowthRate(annualGrowthRate) / 100;

  const projectedFrs =
    LATEST_OFFICIAL_FRS * Math.pow(1 + decimalGrowthRate, projectionYears);

  return {
    brs: projectedFrs / 2,
    frs: projectedFrs,
    ers: projectedFrs * 2,
    basis: "projected",
  };
}

export function calculateCpfRaAt65(retirementSumAt55) {
  if (!Number.isFinite(retirementSumAt55) || retirementSumAt55 <= 0) {
    return 0;
  }

  const decimalInterestRate = CPF_RA_INTEREST_RATE / 100;

  return (
    retirementSumAt55 *
    Math.pow(1 + decimalInterestRate, CPF_RA_COMPOUNDING_YEARS)
  );
}

export function calculateCpfLifePayouts({ yearTurning55, gender, raAt65 }) {
  const officialPayouts = OFFICIAL_CPF_LIFE_PAYOUTS[yearTurning55]?.[gender];

  if (officialPayouts) {
    return {
      basis: "official",

      monthlyPayouts: {
        brs: officialPayouts.brs,
        frs: officialPayouts.frs,
        ers: officialPayouts.ers,
      },
    };
  }

  return {
    basis: "projected",

    monthlyPayouts: {
      brs: calculateProjectedCpfLifePayout({
        raAt65: raAt65?.brs,
        gender,
      }),

      frs: calculateProjectedCpfLifePayout({
        raAt65: raAt65?.frs,
        gender,
      }),

      ers: calculateProjectedCpfLifePayout({
        raAt65: raAt65?.ers,
        gender,
      }),
    },
  };
}

export function calculateProjectedCpfLifePayout({
  raAt65,
  cpfLifePremium,
  gender,
}) {
  const model = CPF_LIFE_PAYOUT_MODEL[gender];

  /*
   * Keep raAt65 supported for the existing
   * Cost of Wants CPF projection.
   *
   * Analyse Commitments passes cpfLifePremium
   * because the actual amount may be below the
   * target amount.
   */
  const premiumAmount = Number.isFinite(cpfLifePremium)
    ? cpfLifePremium
    : raAt65;

  if (!model || !Number.isFinite(premiumAmount) || premiumAmount <= 0) {
    return 0;
  }

  const unroundedMonthlyPayout =
    model.fixedAmount + premiumAmount * model.raFactor;

  return roundCpfLifePayout(unroundedMonthlyPayout);
}

export function roundCpfLifePayout(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const increment = CPF_LIFE_PAYOUT_MODEL.roundingIncrement;

  return Math.round(value / increment) * increment;
}

export function roundCpfProjectionAmount(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value / 100) * 100;
}

/* ========================================
   FYBC PROJECTION
======================================== */

export function calculateFybcProjection({
  currentAge,
  desiredFybcAge,
  mortalityAge,
  inflationRatePercent,
  monthlyPassiveIncome,
  cpfLifePayout,
}) {
  if (
    !Number.isFinite(currentAge) ||
    !Number.isFinite(desiredFybcAge) ||
    !Number.isFinite(mortalityAge)
  ) {
    return {
      isValid: false,
    };
  }

  if (
    !Number.isFinite(monthlyPassiveIncome) ||
    monthlyPassiveIncome <= 0 ||
    desiredFybcAge <= currentAge ||
    mortalityAge <= 65
  ) {
    return {
      isValid: false,
    };
  }

  const safeInflationRatePercent = getNonNegativeNumber(inflationRatePercent);

  const inflationRate = safeInflationRatePercent / 100;

  const safeCpfLifePayout = getNonNegativeNumber(cpfLifePayout);

  const yearsRemaining = desiredFybcAge - currentAge;

  const monthlyIncomeAtFybc =
    monthlyPassiveIncome * Math.pow(1 + inflationRate, yearsRemaining);

  const yearsUntilAge65 = Math.max(0, 65 - currentAge);

  const monthlyIncomeAt65 =
    monthlyPassiveIncome * Math.pow(1 + inflationRate, yearsUntilAge65);

  /*
   * Retained for backwards compatibility with the
   * current Cost of Wants renderer.
   *
   * This represents the projected FYBC income less
   * the selected CPF LIFE payout.
   */
  const monthlyIncomeAfterCpf = Math.max(
    0,
    monthlyIncomeAtFybc - safeCpfLifePayout,
  );

  const totalCapitalRequired = calculateTotalCapitalRequired({
    monthlyIncomeAtFybc,
    desiredFybcAge,
    mortalityAge,
    inflationRate,
    cpfLifePayout: safeCpfLifePayout,
  });

  return {
    isValid: true,

    currentAge,
    desiredFybcAge,
    mortalityAge,
    yearsRemaining,
    
    monthlyPassiveIncome,
    monthlyIncomeAtFybc,
    monthlyIncomeAt65,
    cpfLifePayout: safeCpfLifePayout,
    monthlyIncomeAfterCpf,
    totalCapitalRequired,
    inflationRate,
  };
}

export function calculateTotalCapitalRequired({
  monthlyIncomeAtFybc,
  desiredFybcAge,
  mortalityAge,
  inflationRate,
  cpfLifePayout,
}) {
  if (
    !Number.isFinite(monthlyIncomeAtFybc) ||
    monthlyIncomeAtFybc <= 0 ||
    !Number.isFinite(desiredFybcAge) ||
    !Number.isFinite(mortalityAge) ||
    mortalityAge <= desiredFybcAge
  ) {
    return 0;
  }

  const safeInflationRate = getNonNegativeNumber(inflationRate);

  const safeCpfLifePayout = getNonNegativeNumber(cpfLifePayout);

  let totalCapitalRequired = 0;

  for (let age = desiredFybcAge; age < mortalityAge; age += 1) {
    const yearsSinceFybc = age - desiredFybcAge;

    const monthlyIncomeRequired =
      monthlyIncomeAtFybc * Math.pow(1 + safeInflationRate, yearsSinceFybc);

    const monthlyCpfLifeIncome = age >= 65 ? safeCpfLifePayout : 0;

    const monthlyCapitalRequired = Math.max(
      0,
      monthlyIncomeRequired - monthlyCpfLifeIncome,
    );

    totalCapitalRequired += monthlyCapitalRequired * 12;
  }

  return totalCapitalRequired;
}

/* ========================================
   DATE HELPERS
======================================== */

export function calculateYearTurningAge(dateOfBirth, targetAge) {
  if (
    typeof dateOfBirth !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
  ) {
    return null;
  }

  const birthYear = Number(dateOfBirth.slice(0, 4));

  if (!Number.isInteger(birthYear) || birthYear <= 0) {
    return null;
  }

  if (!Number.isInteger(targetAge) || targetAge < 0) {
    return null;
  }

  return birthYear + targetAge;
}

export function getCpfCohortAgeText(
  yearTurning55,
  currentYear = new Date().getFullYear(),
) {
  if (!Number.isInteger(yearTurning55)) {
    return "";
  }

  if (yearTurning55 < currentYear) {
    return `Client turned 55 in ${yearTurning55}.`;
  }

  if (yearTurning55 === currentYear) {
    return `Client turns 55 in ${yearTurning55}.`;
  }

  return `Client will turn 55 in ${yearTurning55}.`;
}

/* ========================================
   INTERNAL HELPERS
======================================== */

function getEarliestOfficialRetirementSumYear() {
  return Math.min(...Object.keys(OFFICIAL_RETIREMENT_SUMS).map(Number));
}

function normalizeGrowthRate(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE;
  }

  return Math.min(Math.max(numericValue, 0), 10);
}

function getNonNegativeNumber(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, numericValue);
}