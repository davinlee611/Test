"use strict";

import { formatCurrency } from "../../utils/client-utils.js";

import { BHS_PROJECTION_GROWTH_RATE } from "../../services/cpf-healthcare-service.js";

import { MINIMUM_AUTOMATIC_CPF_LIFE_PREMIUM } from "./cost-analysis-config.js";

import { setCurrency, setText } from "./cost-analysis-format-utils.js";

/* ========================================
   CPF PLANNING ASSUMPTIONS
======================================== */

export function renderCpfPlanningAssumptions(elements, { cohortFrs, projectedCohortBhs }) {
  const {
    projectedFrsElement,
    projectedFrsBasisElement,
    projectedCohortBhsElement,
    projectedCohortBhsBasisElement,
  } = elements;

  if (cohortFrs?.isValid) {
    setCurrency(projectedFrsElement, cohortFrs.amount);

    const frsBasisLabel =
      cohortFrs.basis === "official"
        ? [
            `Confirmed CPF Retirement Sum`,
            `for age 55 in`,
            cohortFrs.yearTurning55,
          ].join(" ")
        : [
            `Projected for age 55 in`,
            cohortFrs.yearTurning55,
            `using`,
            `${cohortFrs.annualGrowthRate}%`,
            `annual growth`,
          ].join(" ");

    setText(projectedFrsBasisElement, frsBasisLabel);
  } else {
    setText(projectedFrsElement, "—");

    setText(projectedFrsBasisElement, "Complete the Client Profile");
  }

  if (projectedCohortBhs?.isValid) {
    setCurrency(projectedCohortBhsElement, projectedCohortBhs.amount);

    const cohortBhsBasisLabel = projectedCohortBhs.isProjected
      ? [
          `Projected for age 65 in`,
          projectedCohortBhs.yearTurning65,
          `using`,
          `${BHS_PROJECTION_GROWTH_RATE}%`,
          `annual growth, rounded to $500.`,
          `Fixed from`,
          projectedCohortBhs.yearTurning65,
          `onward.`,
        ].join(" ")
      : [
          `Confirmed cohort BHS for age 65 in`,
          projectedCohortBhs.yearTurning65,
          `. Fixed for life.`,
        ].join(" ");

    setText(projectedCohortBhsBasisElement, cohortBhsBasisLabel);
  } else {
    setText(projectedCohortBhsElement, "—");

    setText(projectedCohortBhsBasisElement, "Complete the Client Profile");
  }
}

export function renderCpfLifeProjectionStatus(elements, { rows, cpfLifeStartAge }) {
  const {
    cpfLifePremiumElement,
    cpfLifePayoutElement,
    cpfLifeProjectionStatusElement,
  } = elements;

  const eventRow = rows.find(function (row) {
    return (
      (row.cpfLifeProjectionStatus === "started" &&
        row.cpfLifePremiumOutflow > 0) ||
      row.cpfLifeProjectionStatus === "insufficient"
    );
  });

  if (!eventRow) {
    setText(cpfLifePremiumElement, "—");

    setText(cpfLifePayoutElement, "—");

    setText(
      cpfLifeProjectionStatusElement,
      `The selected projection does not reach age ${cpfLifeStartAge}.`,
    );

    return;
  }

  if (eventRow.cpfLifeProjectionStatus === "insufficient") {
    setCurrency(cpfLifePremiumElement, eventRow.affordableCpfLifePremium);

    setCurrency(cpfLifePayoutElement, 0);

    setText(
      cpfLifeProjectionStatusElement,
      `Projected RA at age ${cpfLifeStartAge} is below the ` +
        `${formatCurrency(
          MINIMUM_AUTOMATIC_CPF_LIFE_PREMIUM,
        )} automatic-inclusion threshold. ` +
        `No CPF LIFE premium or cash payout is applied.`,
    );

    return;
  }

  setCurrency(cpfLifePremiumElement, eventRow.cpfLifePremiumOutflow);

  setText(
    cpfLifePayoutElement,
    `${formatCurrency(eventRow.cpfLifeMonthlyPayout)}/mth`,
  );

  setText(
    cpfLifeProjectionStatusElement,
    `The premium is limited to the projected RA balance ` +
      `available at age ${cpfLifeStartAge}. The estimated ` +
      `Standard Plan payout is added to cashflow from that month.`,
  );
}
