"use strict";

/* ========================================
   PLANNING CARD
======================================== */

export function createPlanningCard({
    itemClass = "",
    icon,
    details,
    actions,
}) {
    const article =
        document.createElement("article");

    article.className = [
        "planning-card-item",
        itemClass,
    ]
        .filter(Boolean)
        .join(" ");

    const content =
        document.createElement("div");

    content.className =
        "planning-card-content";

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

export function createPlanningCardIcon(
    iconClass,
) {
    const container =
        document.createElement("div");

    container.className =
        "planning-card-icon";

    container.innerHTML = `
        <i
            class="${iconClass}"
            aria-hidden="true"
        ></i>
    `;

    return container;
}

export function createPlanningCardDetails() {
    const details =
        document.createElement("div");

    details.className =
        "planning-card-details";

    return details;
}

export function createPlanningCardActions() {
    const actions =
        document.createElement("div");

    actions.className =
        "planning-card-actions";

    return actions;
}

export function renderPlanningEmptyState(
    list,
    message,
    existingElement,
) {
    if (!existingElement) {
        return;
    }

    existingElement.textContent =
        message;

    list.appendChild(
        existingElement,
    );
}