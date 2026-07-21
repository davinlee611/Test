"use strict";

/* ========================================
   PLANNING CARD
======================================== */

export function createPlanningCard({ itemClass = "", icon, details, actions }) {
  const article = document.createElement("article");

  article.className = ["planning-card-item", itemClass]
    .filter(Boolean)
    .join(" ");

  const content = document.createElement("div");

  content.className = "planning-card-content";

  if (icon) {
    content.appendChild(icon);
  }

  if (details) {
    content.appendChild(details);
  }

  article.appendChild(content);

  if (actions) {
    article.appendChild(actions);
  }

  return article;
}

/* ========================================
   PLANNING CARD ICON
======================================== */

export function createPlanningCardIcon(iconClass) {
  const container = document.createElement("div");

  container.className = "planning-card-icon";

  const icon = document.createElement("i");

  icon.className = iconClass;

  icon.setAttribute("aria-hidden", "true");

  container.appendChild(icon);

  return container;
}

/* ========================================
   PLANNING CARD DETAILS
======================================== */

export function createPlanningCardDetails({
  title = "",
  description = "",
  content = null,
} = {}) {
  const details = document.createElement("div");

  details.className = "planning-card-details";

  if (title) {
    const heading = document.createElement("h4");

    heading.textContent = title;

    details.appendChild(heading);
  }

  if (description) {
    const paragraph = document.createElement("p");

    paragraph.textContent = description;

    details.appendChild(paragraph);
  }

  appendPlanningCardContent(details, content);

  return details;
}

function appendPlanningCardContent(details, content) {
  if (!content) {
    return;
  }

  if (Array.isArray(content)) {
    content.forEach(function (node) {
      if (node instanceof Node) {
        details.appendChild(node);
      }
    });

    return;
  }

  if (content instanceof Node) {
    details.appendChild(content);
  }
}

/* ========================================
   PLANNING CARD ACTIONS
======================================== */

export function createPlanningCardActions() {
  const actions = document.createElement("div");

  actions.className = "planning-card-actions";

  return actions;
}

/* ========================================
   PLANNING CARD BUTTON
======================================== */

export function createPlanningCardButton({
    iconClass,
    label,
    variant = "",
    onClick,
}) {
    const button =
        document.createElement("button");

    button.type = "button";

    button.className = [
        "planning-card-action",
        variant,
    ]
        .filter(Boolean)
        .join(" ");

    button.setAttribute(
        "aria-label",
        label,
    );

    button.title = label;

    const icon =
        document.createElement("i");

    icon.className =
        iconClass;

    icon.setAttribute(
        "aria-hidden",
        "true",
    );

    button.appendChild(icon);

    if (typeof onClick === "function") {
        button.addEventListener(
            "click",
            onClick,
        );
    }

    return button;
}

/* ========================================
   PLANNING CARD BUTTON
======================================== */

export function createPlanningCardButton({
  iconClass,
  label,
  variant = "",
  onClick,
}) {
  const button = document.createElement("button");

  button.type = "button";

  button.className = ["planning-card-action", variant]
    .filter(Boolean)
    .join(" ");

  button.setAttribute("aria-label", label);

  button.title = label;

  const icon = document.createElement("i");

  icon.className = iconClass;

  icon.setAttribute("aria-hidden", "true");

  button.appendChild(icon);

  if (typeof onClick === "function") {
    button.addEventListener("click", onClick);
  }

  return button;
}

/* ========================================
   EMPTY STATE
======================================== */

export function renderPlanningEmptyState(list, message, existingElement) {
  if (!list || !existingElement) {
    return;
  }

  existingElement.textContent = message;

  list.appendChild(existingElement);
}
