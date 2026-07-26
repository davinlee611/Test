"use strict";

/* ========================================
   BENEFIT UTILITIES
======================================== */

export function cloneBenefits(benefits) {
  if (!Array.isArray(benefits)) {
    return [];
  }

  return benefits.map((benefit) => ({
    ...benefit,
  }));
}
