"use strict";

/*
 * CPF Board's non-pensioner Self-Employed Scheme
 * MediSave contribution rates applicable for work year 2026.
 *
 * Until a newer table is added, later projection years deliberately
 * continue using this table as a planning assumption.
 */
export const SEP_MEDISAVE_RATE_YEAR = 2026;

export function calculateSelfEmployedMedisave({
  annualNetTradeIncome = 0,
  netPlatformEarnings = 0,
  ageAtStartOfWorkYear = null,
  overrideEnabled = false,
  overrideAnnualAmount = 0,
}) {
  const totalNti = toNonNegativeNumber(annualNetTradeIncome);

  const excludedPlatformEarnings = Math.min(
    totalNti,
    toNonNegativeNumber(netPlatformEarnings),
  );

  const applicableNti = Math.max(totalNti - excludedPlatformEarnings, 0);

  const calculatedAnnualContribution = calculateContributionFrom2026Rates({
    applicableNti,
    ageAtStartOfWorkYear,
  });

  const usesOverride = Boolean(overrideEnabled);

  const annualContribution = usesOverride
    ? toNonNegativeNumber(overrideAnnualAmount)
    : calculatedAnnualContribution;

  return {
    rateYear: SEP_MEDISAVE_RATE_YEAR,

    totalNti,
    excludedPlatformEarnings,
    applicableNti,

    ageAtStartOfWorkYear,

    isAgeAvailable: Number.isFinite(Number(ageAtStartOfWorkYear)),

    calculatedAnnualContribution,
    annualContribution,

    monthlyContribution: annualContribution / 12,

    effectiveRate: applicableNti > 0 ? annualContribution / applicableNti : 0,

    usesOverride,
  };
}

function calculateContributionFrom2026Rates({
  applicableNti,
  ageAtStartOfWorkYear,
}) {
  const age = Number(ageAtStartOfWorkYear);

  if (!Number.isFinite(age) || applicableNti <= 6000) {
    return 0;
  }

  const band = getContributionBand(age);

  if (applicableNti <= 12000) {
    return Math.round(applicableNti * band.lowerRate);
  }

  if (applicableNti <= 18000) {
    return Math.round(
      band.phasedStartAmount +
        band.phasedIncrementRate * (applicableNti - 12000),
    );
  }

  return Math.round(
    Math.min(applicableNti * band.fullRate, band.annualMaximum),
  );
}

function getContributionBand(age) {
  if (age < 35) {
    return {
      lowerRate: 0.04,
      phasedStartAmount: 480,
      phasedIncrementRate: 0.16,
      fullRate: 0.08,
      annualMaximum: 7680,
    };
  }

  if (age < 45) {
    return {
      lowerRate: 0.045,
      phasedStartAmount: 540,
      phasedIncrementRate: 0.18,
      fullRate: 0.09,
      annualMaximum: 8640,
    };
  }

  if (age < 50) {
    return {
      lowerRate: 0.05,
      phasedStartAmount: 600,
      phasedIncrementRate: 0.2,
      fullRate: 0.1,
      annualMaximum: 9600,
    };
  }

  return {
    lowerRate: 0.0525,
    phasedStartAmount: 630,
    phasedIncrementRate: 0.21,
    fullRate: 0.105,
    annualMaximum: 10080,
  };
}

function toNonNegativeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return 0;
  }

  return number;
}