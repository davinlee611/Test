"use strict";

import {
  buildCostOfWantsAnalysisSection,
  buildDisclosureSection,
  buildInsuranceSection,
  buildPrioritiesSection,
  buildProtectionSection,
  buildReportHeader,
} from "./client-report-sections.js";

/* ========================================
   RENDER
======================================== */

export function renderClientReport(elements, data) {
  const { clientReportBody, clientReportEmptyState, printClientReportButton } =
    elements;

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

export function resetClientReportDisplay(elements) {
  const { clientReportBody, clientReportEmptyState, printClientReportButton } =
    elements;

  if (clientReportBody) {
    clientReportBody.innerHTML = "";
  }

  setHidden(clientReportBody, true);

  setHidden(clientReportEmptyState, false);

  if (printClientReportButton) {
    printClientReportButton.hidden = true;
  }
}

function setHidden(element, hidden) {
  if (element) {
    element.hidden = hidden;
  }
}
