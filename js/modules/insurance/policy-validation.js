"use strict";

export function getPolicyValidationItems(
  benefits,
  { includeDraftBenefits = false } = {},
) {
  const items = [];

  const benefitsByType = groupBenefitsByType(benefits);

  const deathBenefits = benefitsByType["death"] ?? [];

  const deathBenefit = deathBenefits[0] ?? null;

  if (deathBenefit) {
    const amountIsValid = deathBenefit.amount > 0;

    items.push({
      severity: amountIsValid ? "pass" : "error",

      valid: amountIsValid,

      message: amountIsValid
        ? "Death sum assured is greater than $0."
        : "Death sum assured must be greater than $0.",
    });
  }

  const tpdBenefits = benefitsByType["tpd"] ?? [];

  if (tpdBenefits.length > 0) {
    const hasOneTpdBenefit = tpdBenefits.length === 1;

    items.push({
      severity: hasOneTpdBenefit ? "pass" : "error",

      valid: hasOneTpdBenefit,

      message: hasOneTpdBenefit
        ? "One TPD benefit recorded."
        : "A policy can only contain one TPD benefit.",
    });
  }

  if (tpdBenefits.length === 1 && deathBenefit) {
    const belowDeath = tpdBenefits[0].amount <= deathBenefit.amount;

    items.push({
      severity: belowDeath ? "pass" : "error",

      valid: belowDeath,

      message: belowDeath
        ? "TPD does not exceed the Death sum assured."
        : `TPD exceeds the Death sum assured of ${formatCurrency(
            deathBenefit.amount,
          )}.`,
    });
  }

  if (tpdBenefits.length > 0 && !deathBenefit) {
    items.push({
      severity: "review",

      valid: true,

      message: "TPD benefit exists without a Death benefit.",
    });
  }

  const hospitalCashBenefits = benefitsByType["hospital_cash"] ?? [];

  if (hospitalCashBenefits.length === 1) {
    items.push({
      severity: "pass",
      valid: true,
      message: "One Hospital Cash benefit recorded.",
    });
  }

  if (hospitalCashBenefits.length > 1) {
    items.push({
      severity: "review",
      valid: true,
      message: `Multiple Hospital Cash benefits found (${hospitalCashBenefits.length}). Confirm that the benefits are separate and have not been entered twice.`,
    });
  }

  const medicalBenefits = benefitsByType["medical_reimbursement"] ?? [];

  if (medicalBenefits.length === 1) {
    items.push({
      severity: "pass",
      valid: true,
      message: "One Medical Reimbursement benefit recorded.",
    });
  }

  if (medicalBenefits.length > 1) {
    items.push({
      severity: "review",
      valid: true,
      message: `Multiple Medical Reimbursement benefits found (${medicalBenefits.length}). Confirm that the benefits are separate and have not been entered twice.`,
    });
  }

  const monthlyBenefits = benefitsByType["monthly_benefit"] ?? [];

  if (monthlyBenefits.length > 1) {
    items.push({
      severity: "review",

      valid: true,

      message: `Multiple Monthly Benefits found (${monthlyBenefits.length}).`,
    });
  }

  const criticalIllnessBenefits = benefitsByType["critical_illness"] ?? [];

  const acceleratedCiBenefits = criticalIllnessBenefits.filter(
    function (benefit) {
      return benefit.payoutType === "accelerated";
    },
  );

  const earlyCiBenefits = benefitsByType["early_critical_illness"] ?? [];

  const assets = getAssets();

  const averageGrossMonthlyEmploymentIncome = getAverageGrossMonthlyIncome({
    monthlyEmploymentIncome: assets.income.monthlyEmployment,

    annualBonus: assets.income.annualBonus,
  });

  const disabilityIncomeLimit = averageGrossMonthlyEmploymentIncome * 0.75;

  const disabilityIncomeBenefits = benefitsByType["disability_income"] ?? [];

  let totalDisabilityIncome = getAllPolicies().reduce(function (
    portfolioTotal,
    policy,
  ) {
    const policyDisabilityIncome = (policy.benefits || [])
      .filter(function (benefit) {
        return benefit.type === "disability_income";
      })
      .reduce(function (benefitTotal, benefit) {
        return benefitTotal + (Number(benefit.amount) || 0);
      }, 0);

    return portfolioTotal + policyDisabilityIncome;
  }, 0);

  /*
  Only adjust the saved portfolio total when validating
  the Add/Edit Policy modal.

  Saved policy cards are already included in getAllPolicies(),
  so their benefits must not be added again.
  */
  if (includeDraftBenefits) {
    if (editingPolicyId) {
      const existingPolicy = getPolicyById(editingPolicyId);

      if (existingPolicy) {
        const existingDisabilityIncome = (existingPolicy.benefits || [])
          .filter(function (benefit) {
            return benefit.type === "disability_income";
          })
          .reduce(function (total, benefit) {
            return total + (Number(benefit.amount) || 0);
          }, 0);

        totalDisabilityIncome -= existingDisabilityIncome;
      }
    }

    const draftDisabilityIncome = disabilityIncomeBenefits.reduce(function (
      total,
      benefit,
    ) {
      return total + (Number(benefit.amount) || 0);
    }, 0);

    totalDisabilityIncome += draftDisabilityIncome;
  }

  if (deathBenefits.length > 0) {
    const hasOneDeathBenefit = deathBenefits.length === 1;

    items.push({
      severity: hasOneDeathBenefit ? "pass" : "error",

      valid: hasOneDeathBenefit,

      message: hasOneDeathBenefit
        ? "One Death benefit recorded."
        : "A policy can only contain one Death benefit.",
    });
  }

  acceleratedCiBenefits.forEach(function (ciBenefit) {
    if (!deathBenefit) {
      items.push({
        severity: "error",

        valid: false,

        message: "Accelerated CI requires a Death benefit.",
      });

      return;
    }

    const amountIsValid = ciBenefit.amount <= deathBenefit.amount;

    items.push({
      severity: amountIsValid ? "pass" : "error",

      valid: amountIsValid,

      message: amountIsValid
        ? "Accelerated CI does not exceed the Death sum assured."
        : `Accelerated CI exceeds the Death sum assured of ${formatCurrency(
            deathBenefit.amount,
          )}.`,
    });
  });

  earlyCiBenefits.forEach(function (earlyCiBenefit) {
    // Additional and Standalone Early CI have no dependency.
    if (earlyCiBenefit.payoutType !== "accelerated") {
      items.push({
        severity: "pass",

        valid: true,

        message: `${
          PAYOUT_TYPE_LABELS[earlyCiBenefit.payoutType]
        } Early Critical Illness has no Death or Critical Illness dependency.`,
      });

      return;
    }

    const relatedCiBenefit = findRelatedCriticalIllnessBenefit(
      criticalIllnessBenefits,
    );

    if (!deathBenefit) {
      items.push({
        severity: "error",

        valid: false,

        message: "Accelerated Early Critical Illness requires a Death benefit.",
      });
    }

    if (!relatedCiBenefit) {
      items.push({
        severity: "error",

        valid: false,

        message:
          "Accelerated Early Critical Illness requires a Critical Illness benefit.",
      });
    }

    if (deathBenefit) {
      const belowDeath = earlyCiBenefit.amount <= deathBenefit.amount;

      items.push({
        severity: belowDeath ? "pass" : "error",

        valid: belowDeath,

        message: belowDeath
          ? "Accelerated Early Critical Illness does not exceed the Death sum assured."
          : `Accelerated Early Critical Illness exceeds the Death sum assured of ${formatCurrency(
              deathBenefit.amount,
            )}.`,
      });
    }

    if (relatedCiBenefit) {
      const belowCi = earlyCiBenefit.amount <= relatedCiBenefit.amount;

      items.push({
        severity: belowCi ? "pass" : "error",

        valid: belowCi,

        message: belowCi
          ? "Accelerated Early Critical Illness does not exceed the Critical Illness sum assured."
          : `Accelerated Early Critical Illness exceeds the Critical Illness sum assured of ${formatCurrency(
              relatedCiBenefit.amount,
            )}.`,
      });
    }
  });

  const hasCiOrEarlyCiBenefits =
    criticalIllnessBenefits.length > 0 || earlyCiBenefits.length > 0;

  if (
    hasCiOrEarlyCiBenefits &&
    acceleratedCiBenefits.length === 0 &&
    deathBenefits.length <= 1
  ) {
    items.push({
      severity: "pass",
      valid: true,
      message: "No CI or Early CI conflicts detected.",
    });
  }

  if (disabilityIncomeBenefits.length > 0) {
    if (averageGrossMonthlyEmploymentIncome <= 0) {
      items.push({
        severity: "review",

        valid: true,

        message:
          "Enter the client's monthly gross income before assessing Disability Income coverage.",
      });
    } else {
      const withinLimit = totalDisabilityIncome <= disabilityIncomeLimit;

      const recommendedReduction = Math.max(
        0,
        totalDisabilityIncome - disabilityIncomeLimit,
      );

      items.push({
        severity: withinLimit ? "pass" : "error",

        valid: withinLimit,

        message: withinLimit
          ? `Portfolio Disability Income (${formatCurrency(
              totalDisabilityIncome,
            )}/month) is within the recommended limit of ${formatCurrency(
              disabilityIncomeLimit,
            )}/month.`
          : `Portfolio Disability Income (${formatCurrency(
              totalDisabilityIncome,
            )}/month) exceeds the recommended limit of ${formatCurrency(
              disabilityIncomeLimit,
            )}/month. Recommended reduction: ${formatCurrency(
              recommendedReduction,
            )}/month.`,
      });
    }
  }

  return items;
}

export function getCompletePolicyValidationItems({
  policyId = "",
  policyLifeAssured = "",
  benefits = [],
  allPolicies = [],
  includeDraftBenefits = false,
}) {
  return [
    ...getPolicyValidationItems(benefits, {
      includeDraftBenefits,
    }),

    ...getHospitalisationPolicyValidationItems({
      policyId,
      policyLifeAssured,
      benefits,
      allPolicies,
    }),
  ];
}
