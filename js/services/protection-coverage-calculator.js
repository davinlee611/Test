"use strict";

import { getAllPolicies } from "./policy-service.js";

import {
  POLICY_TYPE_LABELS,
  PAYOUT_TYPE_LABELS,
} from "../constants/insurance.js";

import { formatCurrency } from "../utils/client-utils.js";

/* ========================================
   EXISTING CRITICAL ILLNESS COVERAGE

   Sums Critical Illness (CI) and Early Critical Illness (ECI) benefits
   across the saved Insurance Portfolio. Accelerated ECI is a sub-limit
   drawn from its related CI benefit's own sum assured, not additional
   money, so it is folded into the CI entry as a note rather than summed
   again. Additional/standalone ECI genuinely adds coverage and is kept
   as its own entry. CI accelerated/additional from a Death benefit is
   left at face value here — that distinction affects what happens to
   the Death benefit afterwards, not how much is payable on a CI event,
   which is all this comparison is about.
======================================== */

export function calculateExistingCriticalIllnessCoverage() {
  const entries = [];

  getAllPolicies().forEach(function (policy) {
    const benefits = policy.benefits || [];

    const ciBenefit =
      benefits.find(function (benefit) {
        return benefit.type === "critical_illness";
      }) || null;

    const eciBenefit =
      benefits.find(function (benefit) {
        return benefit.type === "early_critical_illness";
      }) || null;

    if (!ciBenefit && !eciBenefit) {
      return;
    }

    const policyName =
      policy.policyName || POLICY_TYPE_LABELS[policy.policyType] || "Policy";

    const eciIsAcceleratedFromCi =
      eciBenefit !== null && eciBenefit.payoutType === "accelerated";

    if (ciBenefit) {
      entries.push({
        policyId: policy.id,
        policyName,
        benefitType: "critical_illness",
        amount: Number(ciBenefit.amount) || 0,
        payoutTypeLabel: PAYOUT_TYPE_LABELS[ciBenefit.payoutType] || "",
        note:
          eciIsAcceleratedFromCi && eciBenefit.amount > 0
            ? `Includes up to ${formatCurrency(
                Number(eciBenefit.amount) || 0,
              )} payable early as Early Critical Illness.`
            : null,
      });
    }

    if (eciBenefit && !(ciBenefit && eciIsAcceleratedFromCi)) {
      entries.push({
        policyId: policy.id,
        policyName,
        benefitType: "early_critical_illness",
        amount: Number(eciBenefit.amount) || 0,
        payoutTypeLabel: PAYOUT_TYPE_LABELS[eciBenefit.payoutType] || "",
        note:
          eciIsAcceleratedFromCi && !ciBenefit
            ? "Accelerated Early Critical Illness with no linked Critical Illness benefit on this policy."
            : null,
      });
    }
  });

  const totalAmount = entries.reduce(function (total, entry) {
    return total + entry.amount;
  }, 0);

  return { entries, totalAmount };
}

/* ========================================
   HOSPITALISATION WARD CLASS

   Returns the highest recorded ward class across all Hospitalisation
   policies, or null if none is recorded. Used to check whether the
   client's stated importance of avoiding a treatment wait (Protection
   Analysis Step 1) is backed up by a Private ward plan.
======================================== */

const WARD_CLASS_RANK = {
  b2_ward: 0,
  b1_ward: 1,
  a_ward: 2,
  private: 3,
};

export function getBestRecordedHospitalisationWardClass() {
  let bestWardType = null;

  let bestRank = -1;

  getAllPolicies().forEach(function (policy) {
    if (policy.policyType !== "hospitalisation") {
      return;
    }

    const wardType = policy.hospitalisation?.wardType;

    const rank = WARD_CLASS_RANK[wardType];

    if (rank === undefined || rank <= bestRank) {
      return;
    }

    bestRank = rank;
    bestWardType = wardType;
  });

  return bestWardType;
}

/* ========================================
   PERSONAL ACCIDENT COVERAGE

   Sums Death + TPD benefit amounts across all Personal Accident
   policies. Used to check whether the client's stated active-lifestyle
   / injury-prone answer (Protection Analysis Step 1) is backed up by
   accident cover.
======================================== */

export function getPersonalAccidentCoverageSummary() {
  let policyCount = 0;

  let totalAmount = 0;

  getAllPolicies().forEach(function (policy) {
    if (policy.policyType !== "personal_accident") {
      return;
    }

    policyCount += 1;

    const benefits = policy.benefits || [];

    totalAmount += benefits.reduce(function (total, benefit) {
      if (benefit.type !== "death" && benefit.type !== "tpd") {
        return total;
      }

      return total + (Number(benefit.amount) || 0);
    }, 0);
  });

  return { policyCount, totalAmount };
}

/* ========================================
   COVERAGE GAP

   Pure Needed-vs-Existing comparison, shared by SBMI Analysis and the
   Client Report so both show the same gap/coverage figures.
======================================== */

export function calculateCoverageGap(totalNeeded, totalExisting) {
  const gap = totalNeeded - totalExisting;

  const isCovered = gap <= 0;

  const coveragePercent =
    totalNeeded > 0
      ? Math.min(100, Math.round((totalExisting / totalNeeded) * 100))
      : 100;

  return {
    gap: Math.abs(gap),
    isCovered,
    coveragePercent,
  };
}
