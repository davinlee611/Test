"use strict";

export const LONG_TERM_CARE_MEDISAVE_LIMIT = 600;

export function getAutomaticLongTermCareMedisaveAmount(
  annualSupplementPremium,
) {
  return Math.min(
    getAmount(annualSupplementPremium),
    LONG_TERM_CARE_MEDISAVE_LIMIT,
  );
}

export function calculateLongTermCarePremiumPayment({
  annualSupplementPremium,
  medisaveAmount,
}) {
  const supplementPremium = getAmount(annualSupplementPremium);

  const medisavePayment = Math.min(
    getAmount(medisaveAmount),
    supplementPremium,
    LONG_TERM_CARE_MEDISAVE_LIMIT,
  );

  return {
    annualSupplementPremium: supplementPremium,

    medisaveAmount: medisavePayment,

    cashAmount: Math.max(supplementPremium - medisavePayment, 0),
  };
}

function getAmount(value) {
  const amount = Number(value);

  return Number.isFinite(amount) && amount >= 0 ? Math.trunc(amount) : 0;
}