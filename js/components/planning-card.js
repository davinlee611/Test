export function createPlanningCardDetails({
    title,
    description,
    content,
}) {
    const details =
        document.createElement("div");

    details.className =
        "planning-card-details";

    if (title) {
        const heading =
            document.createElement("h4");

        heading.textContent =
            title;

        details.appendChild(
            heading,
        );
    }

    if (description) {
        const paragraph =
            document.createElement("p");

        paragraph.textContent =
            description;

        details.appendChild(
            paragraph,
        );
    }

    if (content) {
        if (Array.isArray(content)) {
            content.forEach(function (node) {
                details.appendChild(
                    node,
                );
            });
        } else {
            details.appendChild(
                content,
            );
        }
    }

    return details;
}