"use strict";

import { formatCurrency } from "../../utils/client-utils.js";

import { openModal } from "../../utils/modal.js";

import { getPlannedMortalityAge } from "../cost-of-wants/cost-of-wants-service.js";

import { MONTHS_PER_YEAR } from "./cost-analysis-config.js";

import { formatMonthYear } from "./cost-analysis-date-utils.js";

import {
  getFiniteNumber,
  getNonNegativeNumber,
  setText,
} from "./cost-analysis-format-utils.js";

import { getRetirementStrategyLabel } from "./retirement-strategy.js";

/* ========================================
   PROJECTION TABLES
======================================== */

export function renderProjectionPeriodLabels(
  elements,
  { selectedPeriod, usesAnnualRows },
) {
  const {
    projectionPeriodLabel,
    cashflowPeriodHeading,
    cpfPeriodHeading,
  } = elements;

  const periodDescription =
    selectedPeriod === "mortality"
      ? `To Planned Mortality Age ${getPlannedMortalityAge()}`
      : `${selectedPeriod}-Year Outlook`;

  const rowDescription = usesAnnualRows ? "Annual Rows" : "Monthly Rows";

  setText(projectionPeriodLabel, `${periodDescription} · ${rowDescription}`);

  setText(cashflowPeriodHeading, usesAnnualRows ? "Projection Year" : "Month");

  setText(cpfPeriodHeading, usesAnnualRows ? "Projection Year" : "Month");
}

export function renderCashflowProjectionTable(elements, { rows, usesAnnualRows }) {
  const { cashflowProjectionTableBody } = elements;

  if (!cashflowProjectionTableBody) {
    return;
  }

  cashflowProjectionTableBody.replaceChildren();

  const fragment = document.createDocumentFragment();

  rows.forEach(function (row, index) {
    const tableRow = document.createElement("tr");

    if (!usesAnnualRows && index % MONTHS_PER_YEAR === 0) {
      tableRow.classList.add("is-year-start");
    }

    tableRow.append(
      createCashflowPeriodCell(row, usesAnnualRows),

      createCurrencyCell(row.startWithdrawableBalance),

      createNetMovementCell(elements, row, usesAnnualRows),

      createCurrencyCell(row.endWithdrawableBalance, true),
    );

    fragment.append(tableRow);
  });

  cashflowProjectionTableBody.append(fragment);
}

export function renderCpfProjectionTable(elements, { rows, usesAnnualRows }) {
  const { cpfProjectionTableBody } = elements;

  if (!cpfProjectionTableBody) {
    return;
  }

  cpfProjectionTableBody.replaceChildren();

  const fragment = document.createDocumentFragment();

  rows.forEach(function (row, index) {
    const tableRow = document.createElement("tr");

    if (!usesAnnualRows && index % MONTHS_PER_YEAR === 0) {
      tableRow.classList.add("is-year-start");
    }

    tableRow.append(
      createTextCell(getProjectionRowLabel(row, usesAnnualRows)),

      createCurrencyCell(row.cpfInflow),

      createCpfOutflowCell(row),

      createCurrencyCell(row.cpfInterestCredited, true),

      createCpfNetFlowCell(row),

      createCurrencyCell(row.oaBalance),

      createRetirementBalanceCell(row),

      createCurrencyCell(row.maBalance),

      createBhsCell(row),
    );

    fragment.append(tableRow);
  });

  cpfProjectionTableBody.append(fragment);
}

function getProjectionRowLabel(row, usesAnnualRows) {
  const ageLabel = Number.isFinite(row.age) ? ` · Age ${row.age}` : "";

  if (!usesAnnualRows) {
    return formatMonthYear(row.date) + ageLabel;
  }

  if (row.isCurrentPartialYear) {
    return "Current Year · " + formatMonthYear(row.date) + ageLabel;
  }

  return `Year ${row.projectionYear} · ` + formatMonthYear(row.date) + ageLabel;
}

function createCashflowPeriodCell(row, usesAnnualRows) {
  const cell = document.createElement("td");

  cell.className = "analysis-cashflow-period-cell";

  const period = document.createElement("span");

  period.textContent = getProjectionRowLabel(row, usesAnnualRows);

  cell.append(period);

  if (row.fybcReachedThisMonth) {
    const marker = document.createElement("small");

    marker.className = "analysis-fybc-marker";

    const icon = document.createElement("i");

    icon.className = "fa-solid fa-flag";

    icon.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");

    label.textContent = "FYBC reached";

    marker.append(icon, label);

    cell.append(marker);
  }

  return cell;
}

function createTextCell(value) {
  const cell = document.createElement("td");

  cell.textContent = value;

  return cell;
}

function createCurrencyCell(value, showStatus = false) {
  const cell = document.createElement("td");

  cell.textContent = formatCurrency(value);

  if (showStatus) {
    cell.classList.toggle("is-positive", value > 0);
    cell.classList.toggle("is-negative", value < 0);
  }

  return cell;
}

function createCpfOutflowCell(row) {
  const cell = document.createElement("td");

  cell.className = "analysis-cpf-outflow-cell";

  const outflows = [
    {
      account: "OA",
      amount: getNonNegativeNumber(row.oaOutflow),
    },

    {
      account: "SA",
      amount: getNonNegativeNumber(row.saOutflow),
    },

    {
      account: "RA",
      amount: getNonNegativeNumber(row.raOutflow),
    },

    {
      account: "MA",
      amount: getNonNegativeNumber(row.maInsuranceOutflow),
    },
  ].filter(function (outflow) {
    return outflow.amount > 0;
  });

  if (outflows.length === 0) {
    cell.textContent = "—";

    return cell;
  }

  const list = document.createElement("div");

  list.className = "analysis-cpf-outflow-list";

  outflows.forEach(function ({ account, amount }) {
    const item = document.createElement("div");

    item.className = "analysis-cpf-outflow-item";

    const accountLabel = document.createElement("span");

    accountLabel.textContent = account;

    const amountElement = document.createElement("strong");

    amountElement.textContent = `-${formatCurrency(amount)}`;

    item.append(accountLabel, amountElement);

    list.append(item);
  });

  cell.append(list);

  return cell;
}

function createCpfNetFlowCell(row) {
  const cell = document.createElement("td");

  cell.className = "analysis-cpf-net-flow-cell";

  const movements = [
    ["OA", getFiniteNumber(row.accountNetFlows?.oa)],

    ["SA", getFiniteNumber(row.accountNetFlows?.sa)],

    ["RA", getFiniteNumber(row.accountNetFlows?.ra)],

    ["MA", getFiniteNumber(row.accountNetFlows?.ma)],
  ].filter(function ([, amount]) {
    return Math.abs(amount) >= 0.5;
  });

  if (movements.length === 0) {
    cell.textContent = "—";

    return cell;
  }

  const list = document.createElement("div");

  list.className = "analysis-cpf-net-flow-list";

  movements.forEach(function ([account, amount]) {
    const item = document.createElement("div");

    item.className = "analysis-cpf-net-flow-item";

    const accountLabel = document.createElement("span");

    accountLabel.textContent = account;

    const amountElement = document.createElement("strong");

    const sign = amount > 0 ? "+" : "-";

    amountElement.textContent = `${sign}${formatCurrency(Math.abs(amount))}`;

    amountElement.classList.toggle("is-positive", amount > 0);

    amountElement.classList.toggle("is-negative", amount < 0);

    item.append(accountLabel, amountElement);

    list.append(item);
  });

  cell.append(list);

  return cell;
}

function createRetirementBalanceCell(row) {
  const cell = document.createElement("td");

  cell.className = "analysis-cpf-retirement-cell";

  const wrapper = document.createElement("div");

  wrapper.className = "analysis-cpf-retirement-value";

  const mainLine = document.createElement("div");

  mainLine.className = "analysis-cpf-retirement-main";

  const accountLabel = document.createElement("small");

  accountLabel.className = "analysis-cpf-account-badge";

  accountLabel.textContent = row.retirementAccount === "ra" ? "RA" : "SA";

  const amount = document.createElement("strong");

  amount.textContent = formatCurrency(row.retirementBalance);

  mainLine.append(accountLabel, amount);

  wrapper.append(mainLine);

  if (row.frsMetAt55) {
    const indicator = document.createElement("small");

    indicator.className = "analysis-cpf-frs-indicator";

    const icon = document.createElement("i");

    icon.className = "fa-solid fa-circle-check";

    icon.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");

    label.textContent = "FRS met at 55";

    indicator.append(icon, label);

    wrapper.append(indicator);
  }

  cell.append(wrapper);

  return cell;
}

function createBhsCell(row) {
  const cell = document.createElement("td");

  cell.className = "analysis-cpf-labelled-cell";

  const amount = document.createElement("strong");

  amount.textContent = formatCurrency(row.applicableBhs);

  const basis = document.createElement("small");

  basis.textContent = row.bhsIsLocked
    ? "Fixed for life"
    : row.bhsBasis === "projected"
      ? "Projected"
      : "Confirmed";

  cell.append(amount, basis);

  return cell;
}

function createNetMovementCell(elements, row, usesAnnualRows) {
  const cell = document.createElement("td");

  cell.className = "analysis-net-movement-cell analysis-breakdown-cell";

  cell.classList.toggle("is-positive", row.netMovement > 0);

  cell.classList.toggle("is-negative", row.netMovement < 0);

  cell.tabIndex = 0;

  cell.setAttribute("role", "button");

  const periodLabel = getProjectionRowLabel(row, usesAnnualRows);

  cell.setAttribute(
    "aria-label",
    `View Net Movement breakdown for ${periodLabel}`,
  );

  const amount = document.createElement("strong");

  amount.className = "analysis-net-movement-amount";

  amount.textContent = formatSignedCurrency(row.netMovement);

  cell.append(amount);

  const events = row.cashflowEvents || [];

  if (events.length > 0) {
    const eventList = document.createElement("div");

    eventList.className = "analysis-cashflow-event-list";

    events.forEach(function (event) {
      const eventLine = document.createElement("small");

      eventLine.className = [
        "analysis-cashflow-event",
        `analysis-cashflow-event--${event.direction}`,
      ].join(" ");

      eventLine.textContent = [
        event.label,
        event.direction === "outflow" ? "-" : "+",
        formatCurrency(event.amount),
      ].join(" ");

      eventList.append(eventLine);
    });

    cell.append(eventList);
  }

  const action = document.createElement("small");

  action.className = "analysis-breakdown-cell__action";

  action.textContent = "View breakdown";

  cell.append(action);

  function openBreakdown() {
    openNetMovementBreakdown(elements, {
      row,
      periodLabel,
    });
  }

  cell.addEventListener("click", openBreakdown);

  cell.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();

    openBreakdown();
  });

  return cell;
}

function openNetMovementBreakdown(elements, { row, periodLabel }) {
  const {
    projectionBreakdownModal,
    projectionBreakdownContent,
    projectionBreakdownTitle,
    projectionBreakdownSubtitle,
  } = elements;

  if (!projectionBreakdownModal || !projectionBreakdownContent) {
    return;
  }

  setText(projectionBreakdownTitle, "Net Movement Breakdown");

  setText(projectionBreakdownSubtitle, periodLabel);

  projectionBreakdownContent.replaceChildren();

  const inflows = [
    {
      label: "Take-home income",
      amount: row.cashflowBreakdown?.takeHomeIncome,
    },

    {
      label: "Annual bonus",
      amount: row.cashflowBreakdown?.bonusIncome,
    },

    {
      label: "Other income",
      amount: row.cashflowBreakdown?.otherIncome,
    },

    ...(row.policyCashInflowItems || []).map(function (item) {
      return {
        label: item.policyName,
        amount: item.amount,
      };
    }),

    {
      label: "CPF LIFE payout",
      amount: row.cashflowBreakdown?.cpfLifeIncome,
    },
  ];

  const outflows = [
    {
      label: "Expenses",
      amount: row.cashflowBreakdown?.expenses,
    },

    {
      label: "Liability repayments",
      amount: row.cashflowBreakdown?.liabilities,
    },

    {
      label: "Insurance premiums",
      amount: row.cashflowBreakdown?.insurancePremiums,
    },

    {
      label: `${getRetirementStrategyLabel(
        row.retirementStrategy,
      )} cash top-up to RA`,

      amount: row.cashflowBreakdown?.retirementStrategyCashTopUp,
    },

    ...(row.goalOutflowItems || []).map(function (item) {
      return {
        label: item.goalName,
        amount: item.amount,
      };
    }),
  ];

  appendBreakdownSection(elements, {
    heading: "Inflows",
    items: inflows,
    direction: "inflow",
  });

  appendBreakdownSection(elements, {
    heading: "Outflows",
    items: outflows,
    direction: "outflow",
  });

  const total = document.createElement("div");

  total.className = "projection-breakdown-total";

  const totalLabel = document.createElement("strong");

  totalLabel.textContent = "Net Movement";

  const totalAmount = document.createElement("strong");

  totalAmount.textContent = formatSignedCurrency(row.netMovement);

  totalAmount.classList.toggle("is-positive", row.netMovement > 0);

  totalAmount.classList.toggle("is-negative", row.netMovement < 0);

  total.append(totalLabel, totalAmount);

  projectionBreakdownContent.append(total);

  openModal(projectionBreakdownModal);
}

function appendBreakdownSection(elements, { heading, items, direction }) {
  const section = document.createElement("section");

  section.className = "projection-breakdown-section";

  const title = document.createElement("h3");

  title.textContent = heading;

  section.append(title);

  const visibleItems = items.filter(function (item) {
    return getFiniteNumber(item.amount) > 0;
  });

  if (visibleItems.length === 0) {
    const empty = document.createElement("p");

    empty.className = "projection-breakdown-empty";

    empty.textContent = "None";

    section.append(empty);
  } else {
    visibleItems.forEach(function (item) {
      const detailRow = document.createElement("div");

      detailRow.className = "projection-breakdown-row";

      const label = document.createElement("span");

      label.textContent = item.label;

      const amount = document.createElement("strong");

      amount.className =
        direction === "outflow" ? "is-negative" : "is-positive";

      amount.textContent = [
        direction === "outflow" ? "-" : "+",

        formatCurrency(item.amount),
      ].join("");

      detailRow.append(label, amount);

      section.append(detailRow);
    });
  }

  elements.projectionBreakdownContent.append(section);
}

function formatSignedCurrency(value) {
  const amount = getFiniteNumber(value);

  if (amount > 0) {
    return `+${formatCurrency(amount)}`;
  }

  if (amount < 0) {
    return `-${formatCurrency(Math.abs(amount))}`;
  }

  return formatCurrency(0);
}
