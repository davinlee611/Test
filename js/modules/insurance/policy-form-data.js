"use strict";

import { getWholeNumber } from "../../utils/client-utils.js";

import { calculateHospitalisationPremiumPayment } from "./hospitalisation-premium.js";

import { calculateLongTermCarePremiumPayment } from "./long-term-care-premium.js";

/* ========================================
   POLICY FORM DATA
======================================== */

export function readPolicyFormData(elements) {
  const selectedInsurer = elements.insurerSelect.value;

  const insurer =
    selectedInsurer === "other"
      ? elements.otherInsurerInput.value.trim()
      : selectedInsurer;

  const policyType = elements.policyTypeSelect.value;

  const isHospitalisation = policyType === "hospitalisation";

  const isLongTermCare = policyType === "long_term_care";

  const usesFixedAnnualPremium = isHospitalisation || isLongTermCare;

  const premiumAmount = getWholeNumber(elements.premiumInput.value);

  const riderIncluded =
    isHospitalisation && elements.hospitalisationRiderCheckbox.checked;

  const riderAnnualPremium = riderIncluded
    ? getWholeNumber(elements.hospitalisationRiderPremiumInput.value)
    : 0;

  const hospitalisationPayment = calculateHospitalisationPremiumPayment({
    annualBasePremium: premiumAmount,

    annualRiderPremium: riderAnnualPremium,

    medisaveAmount: elements.hospitalisationMedisaveInput.value,
  });

  const longTermCarePayment = calculateLongTermCarePremiumPayment({
    annualSupplementPremium: premiumAmount,

    medisaveAmount: elements.longTermCareMedisaveInput.value,
  });

  return {
    policyName: elements.policyNameInput.value.trim(),

    policyType,

    longTermCareBasePlan: isLongTermCare
      ? elements.longTermCareBasePlanSelect.value
      : null,

    longTermCare: isLongTermCare
      ? {
          premiumPayment: {
            medisaveAmount: longTermCarePayment.medisaveAmount,

            cashAmount: longTermCarePayment.cashAmount,
          },
        }
      : null,

    lifeAssured: elements.policyLifeAssuredInput.value.trim(),

    insurer,

    policyNumber: elements.policyNumberInput.value.trim(),

    status: usesFixedAnnualPremium
      ? "active"
      : elements.policyStatusSelect.value,

    premiumAmount,

    premiumPaymentEndDate:
      !usesFixedAnnualPremium &&
      elements.policyStatusSelect.value === "limited_pay"
        ? elements.premiumPaymentEndDateInput.value
        : null,

    premiumFrequency: usesFixedAnnualPremium
      ? "annual"
      : elements.premiumFrequencySelect.value,

    hospitalisation: isHospitalisation
      ? {
          wardType: elements.hospitalisationWardTypeSelect.value,

          rider: {
            included: riderIncluded,

            type: riderIncluded
              ? elements.hospitalisationRiderTypeSelect.value
              : "",

            annualPremium: riderAnnualPremium,
          },

          premiumPayment: {
            medisaveAmount: hospitalisationPayment.medisaveAmount,

            cashAmount: hospitalisationPayment.cashAmount,
          },
        }
      : null,

    endowment:
      policyType === "endowment"
        ? {
            maturityDate: elements.endowmentMaturityDateInput.value,

            guaranteedMaturityAmount: getWholeNumber(
              elements.endowmentGuaranteedAmountInput.value,
            ),

            projectedNonGuaranteedAmount: getWholeNumber(
              elements.endowmentNonGuaranteedAmountInput.value,
            ),
          }
        : null,

    retirement:
      policyType === "retirement"
        ? {
            payoutStartAge: getWholeNumber(
              elements.retirementPayoutStartAgeInput.value,
            ),

            monthlyIncome: getWholeNumber(
              elements.retirementMonthlyIncomeInput.value,
            ),

            payoutTerm: elements.retirementPayoutTermSelect.value,

            payoutDurationMonths:
              elements.retirementPayoutTermSelect.value === "limited"
                ? getWholeNumber(elements.retirementPayoutDurationInput.value) *
                  12
                : null,
          }
        : null,
  };
}