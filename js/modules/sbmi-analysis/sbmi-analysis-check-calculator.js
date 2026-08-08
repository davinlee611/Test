"use strict";

import { getProtection } from "../../state/client-plan.js";

import {
  getBestRecordedHospitalisationWardClass,
  getPersonalAccidentCoverageSummary,
} from "../../services/protection-coverage-calculator.js";

import { HOSPITAL_CLASS_LABELS } from "../../constants/insurance.js";

/* ========================================
   MEDICAL PROTECTION CHECK

   How high a Step 1 "importance of not waiting for treatment" answer
   must be before it's treated as a preference for Private ward class.
   A fixed threshold for now, not a calculated recommendation.
======================================== */

export const HIGH_WAIT_TIME_IMPORTANCE_THRESHOLD = 4;

/*
 * Pure result for the Treatment Wait-Time Preference check, shared by
 * the SBMI Analysis page and the Client Report.
 */
export function getWaitTimeCheckResult() {
  const protection = getProtection();

  const importance = Number(protection.waitTimeImportance) || 0;

  const wardType = getBestRecordedHospitalisationWardClass();

  const isHighImportance = importance >= HIGH_WAIT_TIME_IMPORTANCE_THRESHOLD;

  let flag = null;

  if (isHighImportance) {
    flag =
      wardType === "private"
        ? {
            variant: "success",
            icon: "✅",
            title: "Matches Preference",
            detail: "The recorded plan is already Private ward class.",
          }
        : {
            variant: "warning",
            icon: "⚠️",
            title: "Consider Private Ward",
            detail: wardType
              ? `High importance on avoiding treatment delays, but the recorded plan is ${
                  HOSPITAL_CLASS_LABELS[wardType] || wardType
                } — not Private.`
              : "High importance on avoiding treatment delays, but no Hospitalisation plan is recorded.",
          };
  }

  return {
    importance,
    importanceLabel: importance > 0 ? getImportanceLabel(importance) : null,
    wardType,
    wardLabel: wardType ? HOSPITAL_CLASS_LABELS[wardType] || wardType : null,
    flag,
  };
}

function getImportanceLabel(importance) {
  if (importance >= HIGH_WAIT_TIME_IMPORTANCE_THRESHOLD) {
    return "High Importance";
  }

  if (importance === 3) {
    return "Medium Importance";
  }

  return "Low Importance";
}

/*
 * Pure result for the Active Lifestyle / Injury Risk check, shared by
 * the SBMI Analysis page and the Client Report.
 */
export function getInjuryCheckResult() {
  const protection = getProtection();

  const injuryProne = protection.activeExerciseInjuryProne;

  const accidentCoverage = getPersonalAccidentCoverageSummary();

  let flag = null;

  if (injuryProne === true) {
    flag =
      accidentCoverage.policyCount > 0
        ? {
            variant: "success",
            icon: "✅",
            title: "Personal Accident Cover in Place",
            detail:
              "No action needed — a Personal Accident policy is already recorded.",
          }
        : {
            variant: "warning",
            icon: "⚠️",
            title: "Consider Personal Accident Cover",
            detail:
              "Client is active and injury-prone, but no Personal Accident policy is recorded.",
          };
  }

  return { injuryProne, accidentCoverage, flag };
}
