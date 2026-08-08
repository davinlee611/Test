"use strict";

import {
  getAssets,
  getClientProfile,
  getExpenses,
  getGoals,
  getLiabilities,
  getPriorities,
  getProperties,
  getProtection,
} from "../state/client-plan.js";

import { getClientAge } from "./client-profile.js";

import { getAllPolicies } from "../services/policy-service.js";

import { getEffectiveMonthlyInsurancePremium } from "../services/commitment-service.js";

import {
  calculateCpfBalanceTotal,
  calculateLiquidAssetTotal,
} from "./assets-income/assets-income-calculator.js";

import { calculateTotalMonthlyExpenses } from "./expenses/expense-calculator.js";

import { EXPENSE_FIELDS } from "./expenses/expense-config.js";

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

import { getCoverageNeededBreakdown } from "./protection-analysis.js";

import {
  calculateCoverageGap,
  calculateExistingCriticalIllnessCoverage,
} from "../services/protection-coverage-calculator.js";

import { getWaitTimeCheckResult, getInjuryCheckResult } from "./sbmi-analysis.js";

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

const WEALTH_TYPE_LABELS = {
  accumulation: "Accumulation",
  distribution: "Distribution",
  protection: "Protection",
  preservation: "Preservation",
};

const RANK_LABELS = ["1st Priority", "2nd Priority", "3rd Priority", "4th Priority"];

/*
 * Abbreviated versions of a subset of BENEFIT_LABELS, used only in the
 * Insurance Portfolio report cards so a policy with several benefits
 * doesn't overflow the card border. Everywhere else in the app keeps
 * the full BENEFIT_LABELS text (e.g. the Add Benefit dropdown), since
 * that's a different context where the full wording helps a user
 * unfamiliar with the product pick the right benefit.
 */
const BENEFIT_LABELS_SHORT = {
  death: "Death / TI",
  tpd: "TPD",
  critical_illness: "CI",
  early_critical_illness: "ECI",
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

   "Complete enough to report on" means the adviser has actually gone
   through Protection Analysis, not just that the app can compute a
   ($0) gap for a client who never opened the page.
======================================== */

function hasProtectionAnalysisContent() {
  const protection = getProtection();

  return (
    Number(protection.waitTimeImportance) > 0 ||
    protection.activeExerciseInjuryProne !== null ||
    (protection.selectedExpenseKeys || []).length > 0 ||
    (protection.selectedLiabilityIds || []).length > 0
  );
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

  const priorities = getPriorities();

  const wealthTypes = priorities.selectedWealthTypes || [];

  const protection = getProtection();

  const coverageNeeded = getCoverageNeededBreakdown(protection);

  const existingCoverage = calculateExistingCriticalIllnessCoverage();

  const coverageGap = calculateCoverageGap(
    coverageNeeded.totalNeeded,
    existingCoverage.totalAmount,
  );

  return {
    generatedAt: new Date(),

    wealthTypes,

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

    protectionAnalysis: {
      coverageNeeded,
      existingCoverage,
      coverageGap,
      waitTimeCheck: getWaitTimeCheckResult(),
      injuryCheck: getInjuryCheckResult(),
    },
  };
}

function buildExpenseBreakdown(expenses) {
  return EXPENSE_FIELDS.map(function (field) {
    return {
      label: field.label,

      amount: Number(expenses?.[field.key]) || 0,
    };
  }).filter(function (item) {
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

  const prioritiesSection = buildPrioritiesSection(data);

  if (prioritiesSection) {
    clientReportBody.appendChild(prioritiesSection);
  }

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
  const header = el("div", "report-head");

  const identity = el("div");

  identity.appendChild(el("h1", null, data.profile.fullName));

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

  identity.appendChild(el("p", "report-head-meta", metaParts.join(" · ")));

  header.appendChild(identity);

  const meta = el("div");

  const brand = el("div", "report-head-brand");

  brand.appendChild(el("i", "fa-solid fa-file-lines"));

  brand.appendChild(document.createTextNode("Client Report"));

  meta.appendChild(brand);

  meta.appendChild(
    el(
      "div",
      "report-head-timestamp",
      `Generated ${formatReportTimestamp(data.generatedAt)}`,
    ),
  );

  header.appendChild(meta);

  return header;
}

/* ========================================
   PRIORITIES & SITUATION
======================================== */

function buildPrioritiesSection(data) {
  const grid = el("div", "report-card-grid");

  if (data.wealthTypes.length > 0) {
    const { shell, card } = createReportCard({
      title: "Wealth Priorities",
      description: "Ranked by the client, most important first.",
    });

    const list = el("div", "report-summary-list");

    data.wealthTypes.forEach(function (wealthType, index) {
      list.appendChild(
        createSummaryRow(
          RANK_LABELS[index] || `${index + 1}th Priority`,
          WEALTH_TYPE_LABELS[wealthType] || wealthType,
        ),
      );
    });

    card.appendChild(list);

    grid.appendChild(shell);
  }

  const cashflow = data.currentCashflow;

  if (cashflow) {
    const { shell, card } = createReportCard({
      title: "Current Monthly Cashflow",
      description: "Today's snapshot — inflow vs. outflow.",
    });

    const list = el("div", "report-summary-list");

    list.appendChild(
      createSummaryRow(
        "Total Monthly Income",
        formatCurrency(cashflow.totalMonthlyIncome),
      ),
    );

    list.appendChild(
      createSummaryRow(
        "Monthly Expenses",
        formatCurrency(cashflow.monthlyExpenses),
      ),
    );

    list.appendChild(
      createSummaryRow(
        "Monthly Commitments",
        formatCurrency(cashflow.monthlyCommitments),
      ),
    );

    card.appendChild(list);

    card.appendChild(
      createSummaryTotal(
        "Remaining Monthly Surplus",
        formatCurrency(cashflow.remainingSurplus),
        { negative: cashflow.remainingSurplus < 0 },
      ),
    );

    grid.appendChild(shell);
  }

  if (data.expenses.breakdown.length > 0) {
    const { shell, card } = createReportCard({
      title: "Monthly Expense Breakdown",
      description: "Only categories with a recorded amount.",
    });

    const list = el("div", "report-summary-list");

    data.expenses.breakdown.forEach(function (item) {
      list.appendChild(createSummaryRow(item.label, formatCurrency(item.amount)));
    });

    card.appendChild(list);

    grid.appendChild(shell);
  }

  if (data.cpf.total > 0) {
    const { shell, card } = createReportCard({
      title: "CPF Balances",
      description: "Ordinary, Special/Retirement and MediSave accounts.",
    });

    const list = el("div", "report-summary-list");

    list.appendChild(
      createSummaryRow("Ordinary Account (OA)", formatCurrency(data.cpf.oa)),
    );

    list.appendChild(
      createSummaryRow(
        "Special / Retirement Account (SA / RA)",
        formatCurrency(data.cpf.sa + data.cpf.ra),
      ),
    );

    list.appendChild(
      createSummaryRow("MediSave Account (MA)", formatCurrency(data.cpf.ma)),
    );

    card.appendChild(list);

    card.appendChild(
      createSummaryTotal("Total CPF", formatCurrency(data.cpf.total)),
    );

    grid.appendChild(shell);
  }

  if (data.liquidAssetsTotal > 0) {
    const { shell, card } = createReportCard({
      title: "Withdrawable Assets",
      description: "Cash, fixed deposits, T-bills and other liquid holdings.",
    });

    card.appendChild(
      createSummaryTotal(
        "Liquid / Withdrawable Assets",
        formatCurrency(data.liquidAssetsTotal),
      ),
    );

    grid.appendChild(shell);
  }

  if (data.goals.length > 0) {
    const { shell, card } = createReportCard({
      title: "Goals",
      description: "Big-ticket outflows recorded separately from expenses.",
    });

    const list = el("div", "report-summary-list");

    data.goals.forEach(function (goal) {
      list.appendChild(
        createSummaryRow(
          goal.name || getGoalTypeLabel(goal.type),
          formatCurrency(goal.targetAmount),
          { caption: `Target: ${formatGoalDate(goal.targetDate)}` },
        ),
      );
    });

    card.appendChild(list);

    grid.appendChild(shell);
  }

  if (data.liabilities.length > 0) {
    const { shell, card } = createReportCard({
      title: "Liabilities",
      description: "Recorded loans and their repayment schedule.",
    });

    const list = el("div", "report-summary-list");

    data.liabilities.forEach(function (liability) {
      list.appendChild(
        createSummaryRow(
          liability.name || getLiabilityTypeLabel(liability.type),
          formatCurrency(liability.outstandingBalance),
          {
            caption: `${formatCurrency(liability.monthlyRepayment)}/mth repayment`,
          },
        ),
      );
    });

    card.appendChild(list);

    grid.appendChild(shell);
  }

  if (data.properties.length > 0) {
    const { shell, card } = createReportCard({
      title: "Properties",
      description: "Recorded property holdings and ownership share.",
    });

    const list = el("div", "report-summary-list");

    data.properties.forEach(function (property) {
      list.appendChild(
        createSummaryRow(
          property.type || "Property",
          formatCurrency(property.marketValue),
          {
            caption: `${getNonNegativeNumber(property.ownershipPercentage)}% owned`,
          },
        ),
      );
    });

    card.appendChild(list);

    grid.appendChild(shell);
  }

  if (grid.children.length === 0) {
    return null;
  }

  const section = createReportSectionShell(
    "Priorities & Situation",
    "fa-solid fa-bullseye",
    "What the client owns, earns, spends, owes and wants.",
  );

  section.appendChild(grid);

  return section;
}

/* ========================================
   INSURANCE PORTFOLIO
======================================== */

function buildInsuranceSection(data) {
  const section = createReportSectionShell(
    "Insurance Portfolio",
    "fa-solid fa-shield-heart",
    "Every policy currently recorded for this client.",
  );

  const grid = el("div", "report-card-grid");

  data.policies.forEach(function (policy) {
    const { shell, card } = createReportCard({
      title: policy.policyName || POLICY_TYPE_LABELS[policy.policyType] || "Policy",
      description: [policy.insurer, POLICY_TYPE_LABELS[policy.policyType] || "Other"]
        .filter(Boolean)
        .join(" · "),
    });

    const list = el("div", "report-summary-list");

    if (policy.lifeAssured) {
      list.appendChild(createSummaryRow("Life Assured", policy.lifeAssured));
    }

    const benefitLabels = (policy.benefits || [])
      .map(function (benefit) {
        return BENEFIT_LABELS_SHORT[benefit.type] || BENEFIT_LABELS[benefit.type];
      })
      .filter(Boolean);

    if (benefitLabels.length > 0) {
      list.appendChild(createSummaryRow("Benefits", benefitLabels.join(", ")));
    }

    card.appendChild(list);

    grid.appendChild(shell);
  });

  section.appendChild(grid);

  section.appendChild(
    createSummaryTotal(
      "Portfolio Total · Effective Monthly Premium",
      formatCurrency(data.totalMonthlyPremium),
    ),
  );

  return section;
}

/* ========================================
   COST OF WANTS ANALYSIS
======================================== */

function buildCostOfWantsAnalysisSection(data) {
  const section = createReportSectionShell(
    "Cost of Wants Analysis",
    "fa-solid fa-chart-line",
    "The retirement goal, the funding plan behind it, and what it would take to close any remaining gap.",
  );

  if (!data.hasRetirementPlan) {
    section.appendChild(
      createReportPlainNote(
        "Complete Cost of Wants and the Analysis projection to include a retirement plan in this report.",
      ),
    );

    return section;
  }

  const { goal, position, nextSteps } = data;

  const grid = el("div", "report-card-grid");

  const goalCard = createReportCard({
    badgeNumber: 1,
    title: "Your Goal",
    description: "The lifestyle and timeline selected on Cost of Wants.",
  });

  const goalList = el("div", "report-summary-list");

  goalList.appendChild(createSummaryRow("Desired FYBC Age", String(goal.desiredFybcAge)));

  goalList.appendChild(
    createSummaryRow("Planned Mortality Age", String(goal.plannedMortalityAge)),
  );

  goalList.appendChild(
    createSummaryRow(
      "Monthly Lifestyle Today",
      formatCurrency(goal.monthlyIncomeToday),
    ),
  );

  goalList.appendChild(
    createSummaryRow(
      `Monthly Lifestyle Needed at FYBC Age ${goal.desiredFybcAge}`,
      formatCurrency(goal.monthlyIncomeAtFybc),
    ),
  );

  goalList.appendChild(
    createSummaryRow(
      "Estimated Lifetime Retirement Spending",
      formatCurrency(goal.grossCapitalRequired),
      { caption: "Undiscounted" },
    ),
  );

  goalCard.card.appendChild(goalList);

  grid.appendChild(goalCard.shell);

  const positionCard = createReportCard({
    badgeNumber: 2,
    title: "Capital Needed at FYBC",
    description: "After post-FYBC returns and recorded recurring income.",
  });

  const positionList = el("div", "report-summary-list");

  positionList.appendChild(
    createSummaryRow(
      "Lifestyle Capital Before Recorded Income",
      formatCurrency(position.grossLifestyleCapitalAtFybc),
    ),
  );

  positionList.appendChild(
    createSummaryRow(
      "Value of Recorded Retirement Income",
      `-${formatCurrency(position.recordedIncomeCapitalOffset)}`,
    ),
  );

  positionList.appendChild(
    createSummaryRow(
      "Recorded Monthly Income at FYBC",
      `${formatCurrency(position.recordedIncomeAtFybc?.total)}/mth`,
    ),
  );

  positionList.appendChild(
    createSummaryRow(
      `Projected CPF LIFE Income (from Age ${position.cpfLifeStartAge})`,
      `${formatCurrency(position.projectedCpfLifeIncome)}/mth`,
    ),
  );

  positionCard.card.appendChild(positionList);

  positionCard.card.appendChild(
    createSummaryTotal("Capital Needed at FYBC", formatCurrency(position.capitalNeededAtFybc)),
  );

  grid.appendChild(positionCard.shell);

  section.appendChild(grid);

  if (nextSteps?.isValid) {
    const remainingGap = Number(nextSteps.remainingGap) || 0;

    const isFunded = remainingGap <= 0;

    const coveragePercent = Math.min(
      100,
      Math.max(0, Math.round(getNonNegativeNumber(nextSteps.fundingProgress))),
    );

    section.appendChild(
      createGapPanel({
        badgeNumber: 3,
        title: "Your Next Steps",
        caption: "What the client chose to commit toward this goal",
        valueText: formatCurrency(Math.abs(remainingGap)),
        tagText: isFunded ? "Goal Fully Funded" : "Remaining Gap",
        isCovered: isFunded,
        rows: [
          ["Resources Selected Toward This Goal", formatCurrency(nextSteps.selectedResources)],
          ["Chosen Monthly Commitment", `${formatCurrency(nextSteps.chosenMonthly)}/mth`],
          [
            "Projected Value of Monthly Commitment",
            formatCurrency(nextSteps.projectedMonthlyCommitment),
          ],
          ["Estimated Capital at FYBC", formatCurrency(nextSteps.projectedFunding)],
        ],
        coveragePercent,
        progressLabel: "Estimated Goal Coverage",
        progressCaption: `${coveragePercent}% of ${formatCurrency(position.capitalNeededAtFybc)}`,
      }),
    );
  }

  const cpfCard = el("div", "report-plain-card");

  cpfCard.appendChild(el("h4", null, "CPF Assumptions"));

  const cpfList = el("div", "report-summary-list");

  if (data.cpfAssumptions.frs.isValid) {
    cpfList.appendChild(
      createSummaryRow(
        `Projected Cohort FRS (turning 55 in ${data.cpfAssumptions.frs.yearTurning55})`,
        formatCurrency(data.cpfAssumptions.frs.amount),
      ),
    );
  }

  if (data.cpfAssumptions.bhs.isValid) {
    cpfList.appendChild(
      createSummaryRow(
        `Projected Cohort BHS at Age 65 (${data.cpfAssumptions.bhs.yearTurning65})`,
        formatCurrency(data.cpfAssumptions.bhs.amount),
      ),
    );
  }

  cpfCard.appendChild(cpfList);

  cpfCard.appendChild(
    createReportPlainNote(
      "Figures beyond the latest published CPF year are this application's projection assumptions, not official future values.",
    ),
  );

  section.appendChild(cpfCard);

  return section;
}

/* ========================================
   PROTECTION ANALYSIS
======================================== */

function buildProtectionSection(data) {
  const section = createReportSectionShell(
    "Protection Analysis",
    "fa-solid fa-shield-halved",
    "SBMI — how much Critical Illness coverage is needed, what's already in place, and whether the portfolio backs up the client's stated preferences.",
  );

  if (!data.hasProtectionAnalysis) {
    section.appendChild(
      createReportPlainNote(
        "Protection Analysis has not been completed for this client. Coverage gaps are not yet assessed in this report.",
      ),
    );

    return section;
  }

  const { coverageNeeded, existingCoverage, coverageGap, waitTimeCheck, injuryCheck } =
    data.protectionAnalysis;

  const grid = el("div", "report-card-grid");

  const neededCard = createReportCard({
    badgeNumber: 1,
    title: "Coverage Needed",
    description: "5-year total of the obligations selected on Protection Analysis.",
  });

  const neededList = el("div", "report-summary-list");

  neededList.appendChild(
    createSummaryRow(
      "Monthly Expenses (5 yrs)",
      formatCurrency(coverageNeeded.expenseTotal),
      {
        caption:
          coverageNeeded.expenseItemCount === 0
            ? "No expenses recorded"
            : `${coverageNeeded.selectedExpenseCount} of ${coverageNeeded.expenseItemCount} expense categories selected`,
      },
    ),
  );

  neededList.appendChild(
    createSummaryRow(
      "Liabilities (5 yrs)",
      formatCurrency(coverageNeeded.liabilityTotal),
      {
        caption:
          coverageNeeded.liabilityCount === 0
            ? "No liabilities recorded"
            : `${coverageNeeded.selectedLiabilityCount} of ${coverageNeeded.liabilityCount} liabilities selected`,
      },
    ),
  );

  neededCard.card.appendChild(neededList);

  neededCard.card.appendChild(
    createSummaryTotal("Total Coverage Needed", formatCurrency(coverageNeeded.totalNeeded)),
  );

  grid.appendChild(neededCard.shell);

  const existingCard = createReportCard({
    badgeNumber: 2,
    title: "Existing Coverage",
    description: "Critical Illness benefits recorded on the Insurance Portfolio.",
  });

  const existingList = el("div", "report-summary-list");

  if (existingCoverage.entries.length === 0) {
    existingList.appendChild(
      createReportPlainNote("No Critical Illness coverage recorded on Insurance Portfolio."),
    );
  } else {
    existingCoverage.entries.forEach(function (entry) {
      const captionParts = [
        entry.benefitType === "early_critical_illness"
          ? "Early Critical Illness"
          : "Critical Illness",
      ];

      if (entry.payoutTypeLabel) {
        captionParts.push(entry.payoutTypeLabel);
      }

      existingList.appendChild(
        createSummaryRow(entry.policyName, formatCurrency(entry.amount), {
          caption: captionParts.join(" · "),
          note: entry.note,
        }),
      );
    });
  }

  existingCard.card.appendChild(existingList);

  existingCard.card.appendChild(
    createSummaryTotal(
      "Total Existing Coverage",
      formatCurrency(existingCoverage.totalAmount),
    ),
  );

  grid.appendChild(existingCard.shell);

  section.appendChild(grid);

  section.appendChild(
    createGapPanel({
      badgeNumber: 3,
      title: "Coverage Gap",
      caption: "Total Coverage Needed minus Total Existing Coverage",
      valueText: formatCurrency(coverageGap.gap),
      tagText: coverageGap.isCovered ? "Fully Covered" : "Shortfall",
      isCovered: coverageGap.isCovered,
      coveragePercent: coverageGap.coveragePercent,
      progressLabel: "Existing coverage in place",
      progressCaption: `${coverageGap.coveragePercent}% of ${formatCurrency(
        coverageNeeded.totalNeeded,
      )}`,
    }),
  );

  const checkGrid = el("div", "report-card-grid");

  if (waitTimeCheck.importance > 0) {
    checkGrid.appendChild(
      createCheckCard({
        icon: "fa-regular fa-clock",
        title: "Treatment Wait-Time Preference",
        signalLabel: "Client's Answer",
        signalValue: `${waitTimeCheck.importance} / 5 — ${waitTimeCheck.importanceLabel}`,
        recordedLabel: "Currently Recorded",
        recordedValue: waitTimeCheck.wardLabel
          ? `Hospitalisation — ${waitTimeCheck.wardLabel}`
          : "No Hospitalisation policy recorded",
        flag: waitTimeCheck.flag,
      }),
    );
  }

  if (injuryCheck.injuryProne !== null) {
    checkGrid.appendChild(
      createCheckCard({
        icon: "fa-solid fa-person-running",
        title: "Active Lifestyle / Injury Risk",
        signalLabel: "Client's Answer",
        signalValue: injuryCheck.injuryProne ? "Yes — Active & Injury-Prone" : "No",
        recordedLabel: "Currently Recorded",
        recordedValue:
          injuryCheck.accidentCoverage.policyCount > 0
            ? `${injuryCheck.accidentCoverage.policyCount} Personal Accident ${
                injuryCheck.accidentCoverage.policyCount === 1 ? "policy" : "policies"
              } · ${formatCurrency(injuryCheck.accidentCoverage.totalAmount)} coverage`
            : "No Personal Accident policy recorded",
        flag: injuryCheck.flag,
      }),
    );
  }

  if (checkGrid.children.length > 0) {
    section.appendChild(
      el("h3", "report-subsection-title", "Medical Protection Check"),
    );

    section.appendChild(checkGrid);
  }

  return section;
}

/* ========================================
   DISCLOSURE
======================================== */

function buildDisclosureSection() {
  const section = createReportSectionShell("Important", "fa-solid fa-circle-info");

  section.appendChild(
    createReportPlainNote(
      "This report is a planning and educational tool, not financial, tax, legal, insurance, investment, or CPF advice. CPF rules, insurer product terms, premiums, payout illustrations, contribution rates and public-policy thresholds change. Values described as Estimated or Projected are application assumptions, not values published or guaranteed by CPF Board, MOH, an insurer, or another authority.",
    ),
  );

  return section;
}

/* ========================================
   DOM HELPERS — PRIMITIVES
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

function createReportSectionShell(title, iconClass, description) {
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

function createReportPlainNote(text) {
  return el("p", "report-note", text);
}

/* ========================================
   DOM HELPERS — CARDS
======================================== */

function createReportCard({ icon, badgeNumber, title, description }) {
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

function createSummaryRow(label, value, { caption, note } = {}) {
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

function createSummaryTotal(label, value, { negative } = {}) {
  const total = el(
    "div",
    negative ? "report-summary-total report-summary-total--negative" : "report-summary-total",
  );

  total.appendChild(el("span", null, label));

  total.appendChild(el("strong", null, value));

  return total;
}

/* ========================================
   DOM HELPERS — GAP / NEXT STEPS PANEL
======================================== */

function createGapPanel({
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

  const labelLine = el("span");

  if (badgeNumber !== undefined && badgeNumber !== null) {
    labelLine.appendChild(el("span", "report-card-badge", String(badgeNumber)));
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
      isCovered ? "report-gap-value report-gap-value--covered" : "report-gap-value report-gap-value--shortfall",
      valueText,
    ),
  );

  valueWrap.appendChild(
    el(
      "span",
      isCovered ? "report-gap-tag report-gap-tag--covered" : "report-gap-tag report-gap-tag--shortfall",
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

function createCheckCard({
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

  recorded.appendChild(el("span", "report-check-recorded-value", recordedValue));

  card.appendChild(recorded);

  if (flag) {
    const flagEl = el("div", `report-check-flag report-check-flag--${flag.variant}`);

    flagEl.appendChild(el("span", null, flag.icon));

    const textWrap = el("span");

    textWrap.appendChild(el("span", "report-check-flag-title", flag.title));

    textWrap.appendChild(el("span", "report-check-flag-detail", flag.detail));

    flagEl.appendChild(textWrap);

    card.appendChild(flagEl);
  }

  return shell;
}

/* ========================================
   MISC HELPERS
======================================== */

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
