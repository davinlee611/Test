"use strict";

/* ========================================
   COMMITMENT FIELD CONFIGURATION
======================================== */

export const COMMITMENT_FIELDS = Object.freeze([
  Object.freeze({
    key: "insurancePremiums",
    elementId: "generalInsurancePremium",
  }),
]);

/* ========================================
   EMPTY COMMITMENTS
======================================== */

export function createEmptyCommitments() {
  return COMMITMENT_FIELDS.reduce(function (commitments, field) {
    commitments[field.key] = 0;

    return commitments;
  }, {});
}