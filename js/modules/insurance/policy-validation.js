"use strict";

import { getAverageGrossMonthlyIncome } from "../../services/income-calculator.js";

export function getPolicyValidationItems(
  benefits,
  {
    includeDraftBenefits = false,

    context = {},
  } = {},
) {
  const {
    allPolicies = [],
    editingPolicyId = "",
    monthlyEmploymentIncome = 0,
    annualBonus = 0,
  } = context;

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

  const averageGrossMonthlyEmploymentIncome = getAverageGrossMonthlyIncome({
    monthlyEmploymentIncome,
    annualBonus,
  });

  const disabilityIncomeLimit = averageGrossMonthlyEmploymentIncome * 0.75;

  const disabilityIncomeBenefits = benefitsByType["disability_income"] ?? [];

  let totalDisabilityIncome = allPolicies.reduce(function (
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
      const existingPolicy = allPolicies.find(function (policy) {
        return policy.id === editingPolicyId;
      });

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

function getUniqueLifeAssuredNames(benefits) {
  const namesByNormalizedValue = new Map();

  benefits.forEach(function (benefit) {
    const displayName = String(benefit.lifeAssured || "").trim();
    const normalizedName = normalizeLifeAssuredName(displayName);

    if (!normalizedName) {
      return;
    }

    if (!namesByNormalizedValue.has(normalizedName)) {
      namesByNormalizedValue.set(normalizedName, displayName);
    }
  });

  return Array.from(namesByNormalizedValue.entries()).map(function ([
    normalizedName,
    displayName,
  ]) {
    return {
      normalizedName,
      displayName,
    };
  });
}

function getHospitalisationPolicyValidationItems({
  policyId = "",
  policyLifeAssured = "",
  benefits = [],
  allPolicies = [],
}) {
  const validationItems = [];

  const hospitalisationBenefits = benefits.filter(function (benefit) {
    return benefit.type === "hospitalisation";
  });

  if (hospitalisationBenefits.length === 0) {
    return validationItems;
  }

  const hospitalisationLifeAssuredNames = getUniqueLifeAssuredNames(
    hospitalisationBenefits,
  );

  /*
   * Include both the policy-level Life Assured and all benefit-level
   * Life Assured names.
   *
   * This catches cases where the policy says "Davin Lee" but a
   * benefit says "Jane Lee".
   */
  const allPolicyLifeAssuredNames = getUniqueLifeAssuredNames([
    {
      lifeAssured: policyLifeAssured,
    },
    ...benefits,
  ]);

  /*
   * Rule 1:
   * Only one Hospitalisation benefit is allowed per policy.
   */
  const hasOneHospitalisationBenefit = hospitalisationBenefits.length === 1;

  validationItems.push({
    severity: hasOneHospitalisationBenefit ? "pass" : "error",
    valid: hasOneHospitalisationBenefit,
    message: hasOneHospitalisationBenefit
      ? "One Hospitalisation benefit recorded."
      : "Only one Hospitalisation benefit is allowed per policy.",
  });

  /*
   * Rule 4:
   * Multiple Hospitalisation benefits for different life assureds
   * cannot be placed under the same policy.
   */
  if (hospitalisationBenefits.length > 1) {
    const hasOneHospitalisationLifeAssured =
      hospitalisationLifeAssuredNames.length === 1;

    validationItems.push({
      severity: hasOneHospitalisationLifeAssured ? "pass" : "error",
      valid: hasOneHospitalisationLifeAssured,
      message: hasOneHospitalisationLifeAssured
        ? "All Hospitalisation benefits belong to the same life assured."
        : "Hospitalisation benefits for different life assureds must be entered as separate policies because each policy has its own policy number and premium.",
    });
  }

  /*
   * Rule 3:
   * A policy containing Hospitalisation coverage must belong to
   * only one life assured.
   */
  const hasOnePolicyLifeAssured = allPolicyLifeAssuredNames.length === 1;

  validationItems.push({
    severity: hasOnePolicyLifeAssured ? "pass" : "error",
    valid: hasOnePolicyLifeAssured,
    message: hasOnePolicyLifeAssured
      ? "The Hospitalisation policy and all its benefits belong to one life assured."
      : "A Hospitalisation policy can only cover one life assured. The policy and all its benefits must have the same life assured.",
  });

  /*
   * Rule 2:
   * The same life assured cannot have another Hospitalisation policy
   * elsewhere in the portfolio.
   */
  hospitalisationLifeAssuredNames.forEach(function ({
    normalizedName,
    displayName,
  }) {
    const matchingPolicy = allPolicies.find(function (savedPolicy) {
      /*
       * Exclude the policy currently being edited or validated.
       */
      if (policyId && String(savedPolicy.id) === String(policyId)) {
        return false;
      }

      const savedHospitalisationBenefits = (savedPolicy.benefits || []).filter(
        function (benefit) {
          return benefit.type === "hospitalisation";
        },
      );

      if (savedHospitalisationBenefits.length === 0) {
        return false;
      }

      const savedPolicyLifeAssured = normalizeLifeAssuredName(
        savedPolicy.lifeAssured,
      );

      const policyLevelMatches = savedPolicyLifeAssured === normalizedName;

      const benefitLevelMatches = savedHospitalisationBenefits.some(
        function (benefit) {
          return (
            normalizeLifeAssuredName(benefit.lifeAssured) === normalizedName
          );
        },
      );

      return policyLevelMatches || benefitLevelMatches;
    });

    if (matchingPolicy) {
      validationItems.push({
        severity: "error",
        valid: false,
        message:
          `${displayName} already has a Hospitalisation policy ` +
          "in the portfolio. Only one Hospitalisation policy is " +
          "allowed per life assured.",
      });
    } else {
      validationItems.push({
        severity: "pass",
        valid: true,
        message:
          `${displayName} does not have another ` +
          "Hospitalisation policy in the portfolio.",
      });
    }
  });

  return validationItems;
}

export function getCompletePolicyValidationItems({
  policyId = "",
  policyLifeAssured = "",
  benefits = [],
  includeDraftBenefits = false,

  context = {},
}) {
  const { allPolicies = [] } = context;

  return [
    ...getPolicyValidationItems(benefits, {
      includeDraftBenefits,
      context,
    }),

    ...getHospitalisationPolicyValidationItems({
      policyId,
      policyLifeAssured,
      benefits,
      allPolicies,
    }),
  ];
}

/* ========================================
   BENEFIT GROUPING
======================================== */

function groupBenefitsByType(benefits) {
  return (benefits || []).reduce(
    function (groups, benefit) {
      const benefitType = benefit.type;

      if (!groups[benefitType]) {
        groups[benefitType] = [];
      }

      groups[benefitType].push(
        benefit,
      );

      return groups;
    },
    {},
  );
}