"use strict";

import {
  getAssets,
  getClientProfile,
  getExpenses,
  getGoals,
  getLiabilities,
  getProperties,
} from "../state/client-plan.js";

import { getClientAge } from "./client-profile.js";

import { getAllPolicies } from "../services/policy-service.js";

import { getEffectiveMonthlyInsurancePremium } from "../services/commitment-service.js";

import {
  calculateCpfBalanceTotal,
  calculateLiquidAssetTotal,
} from "./assets-income/assets-income-calculator.js";

import { calculateTotalMonthlyExpenses } from "./expenses/expense-calculator.js";

import { getGoalTypeLabel } from "./goals/goal-config.js";

import { formatGoalDate } from "./goals/goal-date.js";

import { getLiabilityTypeLabel } from "./liabilities/liability-config.js";

import {
  getGrossRetirementGoalSummary,
  getProjectedCohortFrs,
} from "./cost-of-wants/cost-of-wants-service.js";

import { getProjectedCohortBasicHealthcareSum } from "../services/cpf-healthcare-service.js";

import {
  getLatestCurrentCashflow,
  getLatestYourPathProjectedPosition,
  getLatestYourNextStepsResult,
} from "./cost-analysis.js";

import { POLICY_TYPE_LABELS, BENEFIT_LABELS } from "../constants/insurance.js";

import { formatCurrency } from "../utils/client-utils.js";

import { openSection } from "./sidebar.js";

/* ========================================
   ELEMENTS
======================================== */

const generateReportButton = document.getElementById(
  "analysisGenerateReportButton",
);

const printClientReportButton = document.getElementById(
  "printClientReportButton",
);

const clientReportEmptyState = document.getElementById(
  "clientReportEmptyState",
);

const clientReportBody = document.getElementById("clientReportBody");

const reportConfirmModal = document.getElementById("reportConfirmModal");

const continueReportConfirmButton = document.getElementById(
  "continueReportConfirmButton",
);

const reportConfirmCloseTriggers = document.querySelectorAll(
  "[data-close-report-confirm-modal]",
);

/* ========================================
   LABELS
======================================== */

const EMPLOYMENT_STATUS_LABELS = {
  full_time_employed: "Full-time Employed",
  self_employed: "Self-employed",
  unemployed: "Unemployed",
  retired: "Retired",
  student: "Student",
};

const MARITAL_STATUS_LABELS = {
  single: "Single",
  married: "Married",
  divorced: "Divorced",
  widowed: "Widowed",
};

const EXPENSE_LABELS = {
  household: "Household",
  transport: "Transport",
  subscriptionsLifestyle: "Subscriptions & Lifestyle",
  parentsDependantsSupport: "Parents & Dependants Support",
  otherRecurringExpenses: "Other Recurring Expenses",
};

/* ========================================
   INITIALIZATION
======================================== */

let moduleInitialized = false;

export function initializeClientReport() {
  if (moduleInitialized) {
    return;
  }

  generateReportButton?.addEventListener("click", handleGenerateReportClick);

  continueReportConfirmButton?.addEventListener("click", function () {
    closeReportConfirmModal();

    generateAndShowReport();
  });

  reportConfirmCloseTriggers.forEach(function (trigger) {
    trigger.addEventListener("click", closeReportConfirmModal);
  });

  document.addEventListener("keydown", handleReportModalKeydown);

  printClientReportButton?.addEventListener("click", function () {
    window.print();
  });

  moduleInitialized = true;
}

export function resetClientReport() {
  if (clientReportBody) {
    clientReportBody.innerHTML = "";
  }

  setHidden(clientReportBody, true);

  setHidden(clientReportEmptyState, false);

  if (printClientReportButton) {
    printClientReportButton.hidden = true;
  }
}

/* ========================================
   PROTECTION ANALYSIS GATE

   Protection Analysis has not been built yet — there is no
   coverage-gap state anywhere in client-plan.js to check. This
   always returns false until that feature exists; update this one
   function (and nothing else) once it does.
======================================== */

function hasProtectionAnalysisContent() {
  return false;
}

/* ========================================
   GENERATE REPORT TRIGGER
======================================== */

function handleGenerateReportClick() {
  if (hasProtectionAnalysisContent()) {
    generateAndShowReport();

    return;
  }

  showReportConfirmModal();
}

function generateAndShowReport() {
  const data = buildClientReportData();

  renderClientReport(data);

  openSection("client-report");
}

/* ========================================
   CONFIRMATION MODAL
======================================== */

function showReportConfirmModal() {
  if (!reportConfirmModal) {
    generateAndShowReport();

    return;
  }

  reportConfirmModal.hidden = false;

  document.body.classList.add("validation-modal-open");

  continueReportConfirmButton?.focus();
}

function closeReportConfirmModal() {
  if (!reportConfirmModal) {
    return;
  }

  reportConfirmModal.hidden = true;

  document.body.classList.remove("validation-modal-open");
}

function handleReportModalKeydown(event) {
  if (
    event.key === "Escape" &&
    reportConfirmModal &&
    !reportConfirmModal.hidden
  ) {
    closeReportConfirmModal();
  }
}

/* ========================================
   DATA AGGREGATION

   Reuses the same selectors/services/cached results already used
   elsewhere in the app rather than recalculating anything
   independently.
======================================== */

function buildClientReportData() {
  const profile = getClientProfile();

  const assets = getAssets();

  const age = getClientAge();

  const currentCashflow = getLatestCurrentCashflow();

  const position = getLatestYourPathProjectedPosition();

  const nextSteps = getLatestYourNextStepsResult();

  const goal = getGrossRetirementGoalSummary();

  const frs = getProjectedCohortFrs();

  const bhs = getProjectedCohortBasicHealthcareSum({
    dateOfBirth: profile.dateOfBirth,
  });

  const policies = getAllPolicies();

  return {
    generatedAt: new Date(),

    profile: {
      fullName: profile.fullName || "Client Report",

      age,

      maritalStatusLabel: MARITAL_STATUS_LABELS[profile.maritalStatus] || "",

      employmentStatusLabel:
        EMPLOYMENT_STATUS_LABELS[profile.employmentStatus] || "",

      occupation: profile.occupation || "",

      dependants: Number(profile.dependants) || 0,
    },

    currentCashflow,

    expenses: {
      total: calculateTotalMonthlyExpenses(getExpenses()),

      breakdown: buildExpenseBreakdown(getExpenses()),
    },

    cpf: {
      oa: Number(assets?.cpf?.oa) || 0,
      sa: Number(assets?.cpf?.sa) || 0,
      ma: Number(assets?.cpf?.ma) || 0,
      ra: Number(assets?.cpf?.ra) || 0,
      total: calculateCpfBalanceTotal(assets?.cpf, age),
    },

    liquidAssetsTotal: calculateLiquidAssetTotal(assets?.liquidAssets),

    properties: getProperties() || [],

    goals: getGoals() || [],

    liabilities: getLiabilities() || [],

    policies,

    totalMonthlyPremium: getEffectiveMonthlyInsurancePremium(),

    goal,

    position,

    nextSteps,

    cpfAssumptions: { frs, bhs },

    hasRetirementPlan: Boolean(goal?.isValid && position?.isValid),

    hasProtectionAnalysis: hasProtectionAnalysisContent(),
  };
}

function buildExpenseBreakdown(expenses) {
  return Object.keys(EXPENSE_LABELS)
    .map(function (key) {
      return {
        label: EXPENSE_LABELS[key],

        amount: Number(expenses?.[key]) || 0,
      };
    })
    .filter(function (item) {
      return item.amount > 0;
    });
}

/* ========================================
   RENDER
======================================== */

function renderClientReport(data) {
  if (!clientReportBody) {
    return;
  }

  clientReportBody.innerHTML = "";

  clientReportBody.appendChild(buildReportHeader(data));

  clientReportBody.appendChild(buildPrioritiesSection(data));

  if (Array.isArray(data.policies) && data.policies.length > 0) {
    clientReportBody.appendChild(buildInsuranceSection(data));
  }

  clientReportBody.appendChild(buildCostOfWantsAnalysisSection(data));

  clientReportBody.appendChild(buildProtectionSection(data));

  clientReportBody.appendChild(buildDisclosureSection());

  setHidden(clientReportEmptyState, true);

  setHidden(clientReportBody, false);

  if (printClientReportButton) {
    printClientReportButton.hidden = false;
  }
}

/* ========================================
   HEADER
======================================== */

function buildReportHeader(data) {
  const header = el("div", "report-header");

  header.appendChild(el("h2", null, data.profile.fullName));

  const metaParts = [];

  if (data.profile.age !== null && data.profile.age !== undefined) {
    metaParts.push(`Age ${data.profile.age}`);
  }

  if (data.profile.maritalStatusLabel) {
    metaParts.push(data.profile.maritalStatusLabel);
  }

  if (data.profile.employmentStatusLabel) {
    metaParts.push(data.profile.employmentStatusLabel);
  }

  if (data.profile.occupation) {
    metaParts.push(data.profile.occupation);
  }

  if (data.profile.dependants > 0) {
    metaParts.push(
      `${data.profile.dependants} ${
        data.profile.dependants === 1 ? "dependant" : "dependants"
      }`,
    );
  }

  header.appendChild(el("p", "report-header-meta", metaParts.join(" · ")));

  header.appendChild(
    el(
      "p",
      "report-header-timestamp",
      `Generated ${formatReportTimestamp(data.generatedAt)}`,
    ),
  );

  return header;
}

/* ========================================
   PRIORITIES & SITUATION
======================================== */

function buildPrioritiesSection(data) {
  const section = createReportSection(
    "Priorities & Situation",
    "fa-solid fa-bullseye",
  );

  const cashflow = data.currentCashflow;

  const incomeGroup = createReportGroup("Current Monthly Cashflow");

  if (cashflow) {
    incomeGroup.appendChild(
      createReportRow("Total Monthly Income", formatCurrency(cashflow.totalMonthlyIncome)),
    );

    incomeGroup.appendChild(
      createReportRow("Monthly Expenses", formatCurrency(cashflow.monthlyExpenses)),
    );

    incomeGroup.appendChild(
      createReportRow("Monthly Commitments", formatCurrency(cashflow.monthlyCommitments)),
    );

    incomeGroup.appendChild(
      createReportRow(
        "Remaining Monthly Surplus",
        formatCurrency(cashflow.remainingSurplus),
        cashflow.remainingSurplus < 0 ? "report-value--negative" : "",
      ),
    );
  } else {
    incomeGroup.appendChild(createReportNote("Not yet entered."));
  }

  section.appendChild(incomeGroup);

  if (data.expenses.breakdown.length > 0) {
    const expenseGroup = createReportGroup("Monthly Expense Breakdown");

    data.expenses.breakdown.forEach(function (item) {
      expenseGroup.appendChild(
        createReportRow(item.label, formatCurrency(item.amount)),
      );
    });

    section.appendChild(expenseGroup);
  }

  const cpfGroup = createReportGroup("CPF Balances");

  cpfGroup.appendChild(createReportRow("Ordinary Account (OA)", formatCurrency(data.cpf.oa)));

  cpfGroup.appendChild(
    createReportRow("Special / Retirement Account (SA / RA)", formatCurrency(data.cpf.sa + data.cpf.ra)),
  );

  cpfGroup.appendChild(createReportRow("MediSave Account (MA)", formatCurrency(data.cpf.ma)));

  cpfGroup.appendChild(createReportRow("Total CPF", formatCurrency(data.cpf.total)));

  section.appendChild(cpfGroup);

  const assetsGroup = createReportGroup("Withdrawable Assets");

  assetsGroup.appendChild(
    createReportRow("Liquid / Withdrawable Assets", formatCurrency(data.liquidAssetsTotal)),
  );

  section.appendChild(assetsGroup);

  if (data.properties.length > 0) {
    const propertiesGroup = createReportGroup("Properties");

    data.properties.forEach(function (property) {
      propertiesGroup.appendChild(
        createReportRow(
          `${property.type || "Property"} (${getNonNegativeNumber(
            property.ownershipPercentage,
          )}% owned)`,
          formatCurrency(property.marketValue),
        ),
      );
    });

    section.appendChild(propertiesGroup);
  }

  if (data.goals.length > 0) {
    const goalsGroup = createReportGroup("Goals");

    data.goals.forEach(function (goal) {
      goalsGroup.appendChild(
        createReportRow(
          `${goal.name || getGoalTypeLabel(goal.type)} — ${formatGoalDate(goal.targetDate)}`,
          formatCurrency(goal.targetAmount),
        ),
      );
    });

    section.appendChild(goalsGroup);
  }

  if (data.liabilities.length > 0) {
    const liabilitiesGroup = createReportGroup("Liabilities");

    data.liabilities.forEach(function (liability) {
      liabilitiesGroup.appendChild(
        createReportRow(
          `${liability.name || getLiabilityTypeLabel(liability.type)} — ${formatCurrency(
            liability.monthlyRepayment,
          )}/mth`,
          formatCurrency(liability.outstandingBalance),
        ),
      );
    });

    section.appendChild(liabilitiesGroup);
  }

  return section;
}

/* ========================================
   INSURANCE PORTFOLIO
======================================== */

function buildInsuranceSection(data) {
  const section = createReportSection(
    "Insurance Portfolio",
    "fa-solid fa-shield-heart",
  );

  data.policies.forEach(function (policy) {
    const policyGroup = createReportGroup(
      policy.policyName || POLICY_TYPE_LABELS[policy.policyType] || "Policy",
    );

    if (policy.insurer) {
      policyGroup.appendChild(createReportRow("Insurer", policy.insurer));
    }

    policyGroup.appendChild(
      createReportRow(
        "Type",
        POLICY_TYPE_LABELS[policy.policyType] || "Other",
      ),
    );

    if (policy.lifeAssured) {
      policyGroup.appendChild(
        createReportRow("Life Assured", policy.lifeAssured),
      );
    }

    const benefitLabels = (policy.benefits || [])
      .map(function (benefit) {
        return BENEFIT_LABELS[benefit.type];
      })
      .filter(Boolean);

    if (benefitLabels.length > 0) {
      policyGroup.appendChild(
        createReportRow(
          "Benefits",
          benefitLabels.join(", "),
          null,
          true,
        ),
      );
    }

    section.appendChild(policyGroup);
  });

  const totalGroup = createReportGroup("Portfolio Total");

  totalGroup.appendChild(
    createReportRow(
      "Effective Monthly Premium",
      formatCurrency(data.totalMonthlyPremium),
    ),
  );

  section.appendChild(totalGroup);

  return section;
}

/* ========================================
   COST OF WANTS ANALYSIS
======================================== */

function buildCostOfWantsAnalysisSection(data) {
  const section = createReportSection(
    "Cost of Wants Analysis",
    "fa-solid fa-chart-line",
  );

  if (!data.hasRetirementPlan) {
    section.appendChild(
      createReportNote(
        "Complete Cost of Wants and the Analysis projection to include a retirement plan in this report.",
      ),
    );

    return section;
  }

  const { goal, position, nextSteps } = data;

  const goalGroup = createReportGroup("Your Goal");

  goalGroup.appendChild(
    createReportRow("Desired FYBC Age", String(goal.desiredFybcAge)),
  );

  goalGroup.appendChild(
    createReportRow("Planned Mortality Age", String(goal.plannedMortalityAge)),
  );

  goalGroup.appendChild(
    createReportRow(
      "Monthly Lifestyle in Today's Dollars",
      formatCurrency(goal.monthlyIncomeToday),
    ),
  );

  goalGroup.appendChild(
    createReportRow(
      `Monthly Lifestyle Needed at FYBC Age ${goal.desiredFybcAge}`,
      formatCurrency(goal.monthlyIncomeAtFybc),
    ),
  );

  goalGroup.appendChild(
    createReportRow(
      "Estimated Lifetime Retirement Spending (Undiscounted)",
      formatCurrency(goal.grossCapitalRequired),
    ),
  );

  section.appendChild(goalGroup);

  const positionGroup = createReportGroup("Capital Needed at FYBC");

  positionGroup.appendChild(
    createReportRow(
      "Lifestyle Capital Before Recorded Income",
      formatCurrency(position.grossLifestyleCapitalAtFybc),
    ),
  );

  positionGroup.appendChild(
    createReportRow(
      "Value of Recorded Retirement Income",
      `-${formatCurrency(position.recordedIncomeCapitalOffset)}`,
    ),
  );

  positionGroup.appendChild(
    createReportRow(
      "Capital Needed at FYBC",
      formatCurrency(position.capitalNeededAtFybc),
      "report-value--primary",
    ),
  );

  positionGroup.appendChild(
    createReportRow(
      "Recorded Monthly Income at FYBC",
      `${formatCurrency(position.recordedIncomeAtFybc?.total)}/mth`,
    ),
  );

  positionGroup.appendChild(
    createReportRow(
      `Projected CPF LIFE Income (from Age ${position.cpfLifeStartAge})`,
      `${formatCurrency(position.projectedCpfLifeIncome)}/mth`,
    ),
  );

  section.appendChild(positionGroup);

  if (nextSteps?.isValid) {
    const nextStepsGroup = createReportGroup("Your Next Steps");

    nextStepsGroup.appendChild(
      createReportRow(
        "Resources Selected Toward This Goal",
        formatCurrency(nextSteps.selectedResources),
      ),
    );

    nextStepsGroup.appendChild(
      createReportRow(
        "Chosen Monthly Commitment",
        `${formatCurrency(nextSteps.chosenMonthly)}/mth`,
      ),
    );

    nextStepsGroup.appendChild(
      createReportRow(
        "Projected Value of Monthly Commitment",
        formatCurrency(nextSteps.projectedMonthlyCommitment),
      ),
    );

    nextStepsGroup.appendChild(
      createReportRow(
        "Estimated Capital at FYBC",
        formatCurrency(nextSteps.projectedFunding),
        "report-value--primary",
      ),
    );

    nextStepsGroup.appendChild(
      createReportRow(
        "Estimated Goal Coverage",
        `${Math.round(getNonNegativeNumber(nextSteps.fundingProgress))}%`,
      ),
    );

    nextStepsGroup.appendChild(
      createReportRow(
        "Remaining Gap",
        formatCurrency(nextSteps.remainingGap),
        nextSteps.remainingGap > 0 ? "report-value--negative" : "",
      ),
    );

    section.appendChild(nextStepsGroup);
  }

  const cpfGroup = createReportGroup("CPF Assumptions");

  if (data.cpfAssumptions.frs.isValid) {
    cpfGroup.appendChild(
      createReportRow(
        `Projected Cohort FRS (turning 55 in ${data.cpfAssumptions.frs.yearTurning55})`,
        formatCurrency(data.cpfAssumptions.frs.amount),
      ),
    );
  }

  if (data.cpfAssumptions.bhs.isValid) {
    cpfGroup.appendChild(
      createReportRow(
        `Projected Cohort BHS at Age 65 (${data.cpfAssumptions.bhs.yearTurning65})`,
        formatCurrency(data.cpfAssumptions.bhs.amount),
      ),
    );
  }

  cpfGroup.appendChild(
    createReportNote(
      "Figures beyond the latest published CPF year are this application's projection assumptions, not official future values.",
    ),
  );

  section.appendChild(cpfGroup);

  return section;
}

/* ========================================
   PROTECTION ANALYSIS
======================================== */

function buildProtectionSection(data) {
  const section = createReportSection(
    "Protection Analysis",
    "fa-solid fa-shield-halved",
  );

  if (!data.hasProtectionAnalysis) {
    section.appendChild(
      createReportNote(
        "Protection Analysis has not been completed for this client. Coverage gaps are not yet assessed in this report.",
      ),
    );

    return section;
  }

  return section;
}

/* ========================================
   DISCLOSURE
======================================== */

function buildDisclosureSection() {
  const section = createReportSection("Important", "fa-solid fa-circle-info");

  section.appendChild(
    createReportNote(
      "This report is a planning and educational tool, not financial, tax, legal, insurance, investment, or CPF advice. CPF rules, insurer product terms, premiums, payout illustrations, contribution rates and public-policy thresholds change. Values described as Estimated or Projected are application assumptions, not values published or guaranteed by CPF Board, MOH, an insurer, or another authority.",
    ),
  );

  return section;
}

/* ========================================
   DOM HELPERS
======================================== */

function el(tag, className, text) {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  if (text !== undefined && text !== null) {
    node.textContent = text;
  }

  return node;
}

function createReportSection(title, iconClass) {
  const section = el("section", "report-section");

  const heading = el("h3", "report-section-title");

  if (iconClass) {
    const icon = document.createElement("i");

    icon.className = iconClass;

    icon.setAttribute("aria-hidden", "true");

    heading.appendChild(icon);
  }

  heading.appendChild(document.createTextNode(title));

  section.appendChild(heading);

  return section;
}

function createReportGroup(title) {
  const group = el("div", "report-group");

  group.appendChild(el("h4", "report-group-title", title));

  return group;
}

function createReportRow(label, value, valueClassName, wrap) {
  const row = el("div", wrap ? "report-row report-row--wrap" : "report-row");

  row.appendChild(el("span", null, label));

  row.appendChild(el("strong", valueClassName || null, value));

  return row;
}

function createReportNote(text) {
  return el("p", "report-note", text);
}

function setHidden(element, hidden) {
  if (element) {
    element.hidden = hidden;
  }
}

function getNonNegativeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? number : 0;
}

function formatReportTimestamp(date) {
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
