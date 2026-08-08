"use strict";

import { RETIREMENT_STRATEGIES } from "./retirement-strategy.js";

/* ========================================
   MODULE STATE

   Centralised mutable state shared across the Analysis page's
   sub-modules (Your Path, Your Next Steps, retirement strategy, goal
   filtering). Exposed as getter/setter pairs rather than bare
   bindings since ES modules only allow the declaring module to
   reassign a `let` — every other module sees a read-only live
   binding.
======================================== */

let expenseInflationWasOverridden = false;

let includeProjectedOa = false;

let currentCashflowState = null;

let yourPathProjectedPositionState = null;

let yourNextStepsResultState = null;

let selectedRetirementStrategy = RETIREMENT_STRATEGIES.CURRENT_PATH;

export const excludedProjectionGoalIds = new Set();

/* ========================================
   EXPENSE INFLATION OVERRIDE
======================================== */

export function getExpenseInflationOverridden() {
  return expenseInflationWasOverridden;
}

export function setExpenseInflationOverridden(value) {
  expenseInflationWasOverridden = value;
}

/* ========================================
   INCLUDE PROJECTED OA
======================================== */

export function getIncludeProjectedOa() {
  return includeProjectedOa;
}

export function setIncludeProjectedOa(value) {
  includeProjectedOa = value;
}

/* ========================================
   CURRENT CASHFLOW
======================================== */

export function getCurrentCashflowState() {
  return currentCashflowState;
}

export function setCurrentCashflowState(value) {
  currentCashflowState = value;
}

/* ========================================
   YOUR PATH PROJECTED POSITION
======================================== */

export function getYourPathProjectedPositionState() {
  return yourPathProjectedPositionState;
}

export function setYourPathProjectedPositionState(value) {
  yourPathProjectedPositionState = value;
}

/* ========================================
   YOUR NEXT STEPS RESULT
======================================== */

export function getYourNextStepsResultState() {
  return yourNextStepsResultState;
}

export function setYourNextStepsResultState(value) {
  yourNextStepsResultState = value;
}

/* ========================================
   SELECTED RETIREMENT STRATEGY
======================================== */

export function getSelectedRetirementStrategy() {
  return selectedRetirementStrategy;
}

export function setSelectedRetirementStrategy(value) {
  selectedRetirementStrategy = value;
}
