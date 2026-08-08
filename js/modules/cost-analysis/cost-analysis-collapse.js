"use strict";

/* ========================================
   COLLAPSIBLE ANALYSIS SECTIONS
======================================== */

export function handleAnalysisSectionCollapse(event) {
  const button = event.currentTarget;

  const targetId = button.dataset.analysisCollapseTarget;

  const content = document.getElementById(targetId);

  if (!content) {
    return;
  }

  const isCurrentlyExpanded = button.getAttribute("aria-expanded") === "true";

  setAnalysisSectionExpanded({
    button,

    content,

    expanded: !isCurrentlyExpanded,
  });
}

export function setAnalysisSectionExpanded({ button, content, expanded }) {
  button.setAttribute("aria-expanded", String(expanded));

  content.hidden = !expanded;

  const label = button.querySelector("span");

  const icon = button.querySelector("i");

  if (label) {
    label.textContent = expanded ? "Hide Section" : "Show Section";
  }

  if (icon) {
    icon.classList.toggle("fa-chevron-up", expanded);

    icon.classList.toggle("fa-chevron-down", !expanded);
  }
}
