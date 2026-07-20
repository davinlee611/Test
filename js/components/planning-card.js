"use strict";

/* ========================================
   PLANNING CARD
======================================== */

export function createPlanningCard({
    itemClass = "",
    iconClass = "",
    content,
    actions = [],
}) {
    const article =
        document.createElement("article");

    article.className = [
        "planning-card-item",
        itemClass,
    ]
        .filter(Boolean)
        .join(" ");

    const cardContent =
        document.createElement("div");

    cardContent.className =
        "planning-card-content";

    if (iconClass) {
        cardContent.appendChild(
            createPlanningCardIcon(
                iconClass,
            ),
        );
    }

    const details =
        document.createElement("div");

    details.className =
        "planning-card-details";

    appendCardContent(
        details,
        content,
    );

    cardContent.appendChild(details);

    article.appendChild(cardContent);

    if (actions.length > 0) {
        article.appendChild(
            createPlanningCardActions(
                actions,
            ),
        );
    }

    return article;
}


/* ========================================
   CARD ICON
======================================== */

function createPlanningCardIcon(
    iconClass,
) {
    const iconContainer =
        document.createElement("div");

    iconContainer.className =
        "planning-card-icon";

    const icon =
        document.createElement("i");

    icon.className = iconClass;
    icon.setAttribute(
        "aria-hidden",
        "true",
    );

    iconContainer.appendChild(icon);

    return iconContainer;
}


/* ========================================
   CARD CONTENT
======================================== */

function appendCardContent(
    container,
    content,
) {
    if (content instanceof Node) {
        container.appendChild(content);

        return;
    }

    if (Array.isArray(content)) {
        content.forEach(function (item) {
            if (item instanceof Node) {
                container.appendChild(item);
            }
        });

        return;
    }

    if (typeof content === "string") {
        container.innerHTML = content;
    }
}


/* ========================================
   CARD ACTIONS
======================================== */

function createPlanningCardActions(
    actions,
) {
    const actionsContainer =
        document.createElement("div");

    actionsContainer.className =
        "planning-card-actions";

    actions.forEach(function (action) {
        actionsContainer.appendChild(
            createPlanningCardAction(
                action,
            ),
        );
    });

    return actionsContainer;
}


export function createPlanningCardAction({
    action,
    itemId,
    dataPrefix,
    iconClass,
    label,
    variant = "",
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

    button.dataset[
        `${dataPrefix}Action`
    ] = action;

    button.dataset[
        `${dataPrefix}Id`
    ] = itemId;

    button.setAttribute(
        "aria-label",
        label,
    );

    button.title = label;

    const icon =
        document.createElement("i");

    icon.className = iconClass;
    icon.setAttribute(
        "aria-hidden",
        "true",
    );

    button.appendChild(icon);

    return button;
}


/* ========================================
   EMPTY STATE
======================================== */

export function renderPlanningEmptyState({
    container,
    message,
    id = "",
}) {
    if (!container) {
        return null;
    }

    const emptyMessage =
        document.createElement("p");

    if (id) {
        emptyMessage.id = id;
    }

    emptyMessage.className =
        "empty-state-message";

    emptyMessage.textContent =
        message;

    container.appendChild(
        emptyMessage,
    );

    return emptyMessage;
}