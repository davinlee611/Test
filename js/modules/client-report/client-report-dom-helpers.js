"use strict";

/* ========================================
   DOM HELPERS — PRIMITIVES
======================================== */

export function el(tag, className, text) {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  if (text !== undefined && text !== null) {
    node.textContent = text;
  }

  return node;
}

export function createReportSectionShell(title, iconClass, description) {
  const section = el("section", "report-section");

  const heading = el("h2", "report-section-title");

  if (iconClass) {
    const iconWrap = el("span", "report-section-icon");

    const icon = document.createElement("i");

    icon.className = iconClass;

    icon.setAttribute("aria-hidden", "true");

    iconWrap.appendChild(icon);

    heading.appendChild(iconWrap);
  }

  heading.appendChild(document.createTextNode(title));

  section.appendChild(heading);

  if (description) {
    section.appendChild(el("p", "report-section-sub", description));
  }

  return section;
}

export function createReportPlainNote(text) {
  return el("p", "report-note", text);
}

/* ========================================
   DOM HELPERS — CARDS
======================================== */

export function createReportCard({ icon, badgeNumber, title, description }) {
  const shell = el("div", "report-card-shell");

  const card = el("div", "report-card");

  const heading = el("div", "report-card-heading");

  if (icon) {
    const iconWrap = el("span", "report-card-icon");

    const iconEl = document.createElement("i");

    iconEl.className = icon;

    iconEl.setAttribute("aria-hidden", "true");

    iconWrap.appendChild(iconEl);

    heading.appendChild(iconWrap);
  } else if (badgeNumber !== undefined && badgeNumber !== null) {
    heading.appendChild(el("span", "report-card-badge", String(badgeNumber)));
  }

  const headingText = el("div");

  headingText.appendChild(el("h4", null, title));

  if (description) {
    headingText.appendChild(el("p", null, description));
  }

  heading.appendChild(headingText);

  card.appendChild(heading);

  shell.appendChild(card);

  return { shell, card };
}

export function createSummaryRow(label, value, { caption, note } = {}) {
  const row = el("div", "report-summary-row");

  const labelWrap = el("div");

  labelWrap.appendChild(el("span", null, label));

  if (caption) {
    labelWrap.appendChild(el("small", null, caption));
  }

  if (note) {
    labelWrap.appendChild(el("small", "report-summary-row-note", note));
  }

  row.appendChild(labelWrap);

  row.appendChild(el("strong", null, value));

  return row;
}

export function createSummaryTotal(label, value, { negative } = {}) {
  const total = el(
    "div",
    negative
      ? "report-summary-total report-summary-total--negative"
      : "report-summary-total",
  );

  total.appendChild(el("span", null, label));

  total.appendChild(el("strong", null, value));

  return total;
}

/* ========================================
   DOM HELPERS — GAP / NEXT STEPS PANEL
======================================== */

export function createGapPanel({
  badgeNumber,
  title,
  caption,
  valueText,
  tagText,
  isCovered,
  rows,
  coveragePercent,
  progressLabel,
  progressCaption,
}) {
  const panel = el("div", "report-gap-panel");

  const top = el("div", "report-gap-top");

  const labelWrap = el("div", "report-gap-label");

  const labelLine = el("span", "report-gap-title-row");

  if (badgeNumber !== undefined && badgeNumber !== null) {
    labelLine.appendChild(
      el("span", "report-card-badge", String(badgeNumber)),
    );
  }

  labelLine.appendChild(document.createTextNode(title));

  labelWrap.appendChild(labelLine);

  if (caption) {
    labelWrap.appendChild(el("small", null, caption));
  }

  top.appendChild(labelWrap);

  const valueWrap = el("div", "report-gap-value-wrap");

  valueWrap.appendChild(
    el(
      "div",
      isCovered
        ? "report-gap-value report-gap-value--covered"
        : "report-gap-value report-gap-value--shortfall",
      valueText,
    ),
  );

  valueWrap.appendChild(
    el(
      "span",
      isCovered
        ? "report-gap-tag report-gap-tag--covered"
        : "report-gap-tag report-gap-tag--shortfall",
      tagText,
    ),
  );

  top.appendChild(valueWrap);

  panel.appendChild(top);

  if (Array.isArray(rows) && rows.length > 0) {
    const list = el("div", "report-summary-list");

    rows.forEach(function ([label, value]) {
      list.appendChild(createSummaryRow(label, value));
    });

    panel.appendChild(list);
  }

  if (coveragePercent !== undefined && coveragePercent !== null) {
    const track = el("div", "report-progress-track");

    const fill = el("span", "report-progress-fill");

    fill.style.width = `${coveragePercent}%`;

    track.appendChild(fill);

    panel.appendChild(track);

    const captionRow = el("div", "report-progress-caption");

    captionRow.appendChild(el("span", null, progressLabel || ""));

    captionRow.appendChild(el("strong", null, progressCaption || ""));

    panel.appendChild(captionRow);
  }

  return panel;
}

/* ========================================
   DOM HELPERS — MEDICAL PROTECTION CHECK
======================================== */

export function createCheckCard({
  icon,
  title,
  signalLabel,
  signalValue,
  recordedLabel,
  recordedValue,
  flag,
}) {
  const { shell, card } = createReportCard({ icon, title });

  const signal = el("div", "report-check-signal");

  signal.appendChild(el("span", "report-check-label", signalLabel));

  signal.appendChild(el("div", "report-check-value", signalValue));

  card.appendChild(signal);

  const recorded = el("div", "report-check-recorded");

  recorded.appendChild(el("span", "report-check-label", recordedLabel));

  recorded.appendChild(
    el("span", "report-check-recorded-value", recordedValue),
  );

  card.appendChild(recorded);

  if (flag) {
    const flagEl = el(
      "div",
      `report-check-flag report-check-flag--${flag.variant}`,
    );

    flagEl.appendChild(el("span", null, flag.icon));

    const textWrap = el("span");

    textWrap.appendChild(el("span", "report-check-flag-title", flag.title));

    textWrap.appendChild(
      el("span", "report-check-flag-detail", flag.detail),
    );

    flagEl.appendChild(textWrap);

    card.appendChild(flagEl);
  }

  return shell;
}

/* ========================================
   MISC HELPERS
======================================== */

export function getNonNegativeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? number : 0;
}

export function formatReportTimestamp(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
