"use strict";

export function getHospitalisationAwl(currentAge) {
  const age = Number(currentAge);

  if (!Number.isFinite(age) || age < 0) {
    return 0;
  }

  const ageNextBirthday = age + 1;

  if (ageNextBirthday <= 40) {
    return 300;
  }

  if (ageNextBirthday <= 70) {
    return 600;
  }

  return 900;
}

export function getAutomaticHospitalisationMedisaveAmount({
  annualBasePremium,
  currentAge,
}) {
  const basePremium = getAmount(annualBasePremium);

  const additionalWithdrawalLimit = getHospitalisationAwl(currentAge);

  /*
   * Only the base plan can use MediSave.
   *
   * The automatic amount must therefore
   * never exceed the annual base premium.
   */
  return Math.min(basePremium, additionalWithdrawalLimit);
}

export function calculateHospitalisationPremiumPayment({
  annualBasePremium,
  annualRiderPremium,
  medisaveAmount,
}) {
  const basePremium = getAmount(annualBasePremium);

  const riderPremium = getAmount(annualRiderPremium);

  /*
   * Rider premiums are fully cash-paid.
   *
   * Therefore, MediSave can never exceed
   * the annual base-plan premium.
   */
  const medisavePayment = Math.min(getAmount(medisaveAmount), basePremium);

  const totalPremium = basePremium + riderPremium;

  return {
    annualBasePremium: basePremium,

    annualRiderPremium: riderPremium,

    totalAnnualPremium: totalPremium,

    medisaveAmount: medisavePayment,

    cashAmount: Math.max(totalPremium - medisavePayment, 0),
  };
}

function getAmount(value) {
  const amount = Number(value);

  return Number.isFinite(amount) && amount >= 0 ? Math.trunc(amount) : 0;
}