"use strict";

import { escapeHtml } from "../../utils/client-utils.js";

/* ========================================
   POLICY VALIDATION RENDERING
======================================== */

export function renderPolicyValidationItems({
  section,
  list,
  validationItems,
  hasBenefits,
}) {
  if (!section || !list) {
    return;
  }

  list.innerHTML = "";

  if (!hasBenefits) {
    section.hidden = true;

    return;
  }

  section.hidden = false;

  validationItems.forEach(function (item) {
    list.appendChild(createValidationItem(item));
  });
}

function createValidationItem(item) {
  const validationItem = document.createElement("div");

  const displayState = getValidationDisplayState(item);

  validationItem.className = [
    "policy-validation-item",
    displayState.stateClass,
  ].join(" ");

  validationItem.innerHTML = `
    <i
      class="${displayState.iconClass}"
      aria-hidden="true"
    ></i>

    <span>
      ${escapeHtml(item.message)}
    </span>
  `;

  return validationItem;
}

function getValidationDisplayState(item) {
  if (item.severity === "error") {
    return {
      stateClass: "policy-validation-item--invalid",

      iconClass: "fa-solid fa-circle-exclamation",
    };
  }

  if (item.severity === "review") {
    return {
      stateClass: "policy-validation-item--review",

      iconClass: "fa-solid fa-triangle-exclamation",
    };
  }

  return {
    stateClass: "policy-validation-item--valid",

    iconClass: "fa-solid fa-circle-check",
  };
}
