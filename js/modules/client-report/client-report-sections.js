"use strict";

import { getGoalTypeLabel } from "../goals/goal-config.js";

import { formatGoalDate } from "../goals/goal-date.js";

import { getLiabilityTypeLabel } from "../liabilities/liability-config.js";

import { POLICY_TYPE_LABELS, BENEFIT_LABELS } from "../../constants/insurance.js";

import { formatCurrency } from "../../utils/client-utils.js";

import {
  BENEFIT_LABELS_SHORT,
  RANK_LABELS,
  WEALTH_TYPE_LABELS,
} from "./client-report-config.js";

import {
  createCheckCard,
  createGapPanel,
  createReportCard,
  createReportPlainNote,
  createReportSectionShell,
  createSummaryRow,
  createSummaryTotal,
  el,
  formatReportTimestamp,
  getNonNegativeNumber,
} from "./client-report-dom-helpers.js";

/* ========================================
   HEADER
======================================== */

export function buildReportHeader(data) {
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

export function buildPrioritiesSection(data) {
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
      list.appendChild(
        createSummaryRow(item.label, formatCurrency(item.amount)),
      );
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

export function buildInsuranceSection(data) {
  const section = createReportSectionShell(
    "Insurance Portfolio",
    "fa-solid fa-shield-heart",
    "Every policy currently recorded for this client.",
  );

  const grid = el("div", "report-card-grid");

  data.policies.forEach(function (policy) {
    const { shell, card } = createReportCard({
      title:
        policy.policyName || POLICY_TYPE_LABELS[policy.policyType] || "Policy",
      description: [
        policy.insurer,
        POLICY_TYPE_LABELS[policy.policyType] || "Other",
      ]
        .filter(Boolean)
        .join(" · "),
    });

    const list = el("div", "report-summary-list");

    if (policy.lifeAssured) {
      list.appendChild(createSummaryRow("Life Assured", policy.lifeAssured));
    }

    const benefitLabels = (policy.benefits || [])
      .map(function (benefit) {
        return (
          BENEFIT_LABELS_SHORT[benefit.type] || BENEFIT_LABELS[benefit.type]
        );
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

export function buildCostOfWantsAnalysisSection(data) {
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

  goalList.appendChild(
    createSummaryRow("Desired FYBC Age", String(goal.desiredFybcAge)),
  );

  goalList.appendChild(
    createSummaryRow(
      "Planned Mortality Age",
      String(goal.plannedMortalityAge),
    ),
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
    createSummaryTotal(
      "Capital Needed at FYBC",
      formatCurrency(position.capitalNeededAtFybc),
    ),
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
          [
            "Resources Selected Toward This Goal",
            formatCurrency(nextSteps.selectedResources),
          ],
          [
            "Chosen Monthly Commitment",
            `${formatCurrency(nextSteps.chosenMonthly)}/mth`,
          ],
          [
            "Projected Value of Monthly Commitment",
            formatCurrency(nextSteps.projectedMonthlyCommitment),
          ],
          [
            "Estimated Capital at FYBC",
            formatCurrency(nextSteps.projectedFunding),
          ],
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

export function buildProtectionSection(data) {
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

  const {
    coverageNeeded,
    existingCoverage,
    coverageGap,
    waitTimeCheck,
    injuryCheck,
  } = data.protectionAnalysis;

  const grid = el("div", "report-card-grid");

  const neededCard = createReportCard({
    badgeNumber: 1,
    title: "Coverage Needed",
    description:
      "5-year total of the obligations selected on Protection Analysis.",
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
    createSummaryTotal(
      "Total Coverage Needed",
      formatCurrency(coverageNeeded.totalNeeded),
    ),
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
      createReportPlainNote(
        "No Critical Illness coverage recorded on Insurance Portfolio.",
      ),
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
        signalValue: injuryCheck.injuryProne
          ? "Yes — Active & Injury-Prone"
          : "No",
        recordedLabel: "Currently Recorded",
        recordedValue:
          injuryCheck.accidentCoverage.policyCount > 0
            ? `${injuryCheck.accidentCoverage.policyCount} Personal Accident ${
                injuryCheck.accidentCoverage.policyCount === 1
                  ? "policy"
                  : "policies"
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

export function buildDisclosureSection() {
  const section = createReportSectionShell(
    "Important",
    "fa-solid fa-circle-info",
  );

  section.appendChild(
    createReportPlainNote(
      "This report is a planning and educational tool, not financial, tax, legal, insurance, investment, or CPF advice. CPF rules, insurer product terms, premiums, payout illustrations, contribution rates and public-policy thresholds change. Values described as Estimated or Projected are application assumptions, not values published or guaranteed by CPF Board, MOH, an insurer, or another authority.",
    ),
  );

  return section;
}
