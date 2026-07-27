"use strict";

/* ========================================
   GOAL TYPE CONFIGURATION
======================================== */

export const GOAL_TYPE_LABELS = Object.freeze({
  retirement: "Retirement",

  education: "Children’s Education",

  property: "Property Purchase",

  emergency_fund: "Emergency Fund",

  wedding: "Wedding",

  travel: "Travel",

  legacy: "Legacy",

  other: "Others",
});

export const GOAL_TYPE_ICONS = Object.freeze({
  retirement: "fa-solid fa-umbrella-beach",

  education: "fa-solid fa-graduation-cap",

  property: "fa-solid fa-house",

  emergency_fund: "fa-solid fa-shield-halved",

  wedding: "fa-solid fa-ring",

  travel: "fa-solid fa-plane",

  legacy: "fa-solid fa-hand-holding-heart",

  other: "fa-solid fa-bullseye",
});

/* ========================================
   CONFIGURATION QUERIES
======================================== */

export function getGoalTypeLabel(goalType) {
  return GOAL_TYPE_LABELS[goalType] || "Goal";
}

export function getGoalIconClass(goalType) {
  return GOAL_TYPE_ICONS[goalType] || GOAL_TYPE_ICONS.other;
}