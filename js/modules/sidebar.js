"use strict";

import { isProfileComplete, showProfileMessage } from "./client-profile.js";

import { on, emit } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";


/* ========================================
   SIDEBAR ELEMENTS
======================================== */

const sidebarItems = document.querySelectorAll(".sidebar-item");

const workspaceSections = document.querySelectorAll(".workspace-section");

const sidebarToggleButton = document.getElementById("sidebarToggleButton");

const sidebarElement = document.getElementById("clientSidebar");

const sidebarBackdrop = document.getElementById("sidebarBackdrop");

const prioritiesBackButton = document.getElementById("prioritiesBackButton");

const prioritiesNextButton = document.getElementById("prioritiesNextButton");

const insuranceBackButton = document.getElementById("insuranceBackButton");

const insuranceNextButton = document.getElementById("insuranceNextButton");

const costAnalysisBackButton = document.getElementById(
  "costAnalysisBackButton",
);

const costAnalysisNextButton = document.getElementById(
  "costAnalysisNextButton",
);

const analysisViewDetailedButton = document.getElementById(
  "analysisViewDetailedButton",
);

const analysisDetailBackButton = document.getElementById(
  "analysisDetailBackButton",
);

/* ========================================
   MODULE CONFIGURATION
======================================== */

let moduleInitialized = false;

/* ========================================
   INITIALIZATION
======================================== */

export function initializeSidebar() {
  if (moduleInitialized) {
    return;
  }

  attachSidebarListeners();
  attachSectionNavigationListeners();
  attachProfileEventListeners();
  attachResponsiveSidebarListeners();

  moduleInitialized = true;
}

/* ========================================
   SIDEBAR LISTENERS
======================================== */

function attachSidebarListeners() {
  sidebarItems.forEach(function (item) {
    item.addEventListener("click", handleSidebarItemClick);
  });
}

function handleSidebarItemClick(event) {
  const selectedItem = event.currentTarget;

  const sectionName = selectedItem.dataset.section;

  if (!sectionName) {
    return;
  }

  navigateToSection(sectionName);
}

/* ========================================
   RESPONSIVE SIDEBAR (OFF-CANVAS DRAWER)

   Below 900px the sidebar becomes a fixed off-canvas drawer (see
   client-sidebar.css) rather than a persistent column. These
   listeners only affect that collapsed state; on wider screens
   setSidebarOpen() still runs but has no visible effect since the
   drawer styles are scoped to the same breakpoint.
======================================== */

const mobileSidebarQuery = window.matchMedia("(max-width: 900px)");

function attachResponsiveSidebarListeners() {
  sidebarToggleButton?.addEventListener("click", function () {
    setSidebarOpen(!sidebarElement?.classList.contains("is-open"));
  });

  sidebarBackdrop?.addEventListener("click", function () {
    setSidebarOpen(false, { returnFocus: true });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      setSidebarOpen(false, { returnFocus: true });
    }
  });

  /*
   * Re-sync whenever the viewport crosses the drawer breakpoint
   * (e.g. resizing the window), so the sidebar is never left
   * inert on a wide screen or interactive-but-hidden on a narrow
   * one. Not a user-initiated close, so focus stays where it is.
   */
  mobileSidebarQuery.addEventListener("change", function () {
    setSidebarOpen(false);
  });

  setSidebarOpen(false);
}

function setSidebarOpen(isOpen, { returnFocus = false } = {}) {
  if (!sidebarElement) {
    return;
  }

  sidebarElement.classList.toggle("is-open", isOpen);

  /*
   * inert must only apply while the sidebar is an off-canvas drawer
   * (below the breakpoint). On a wide screen the sidebar is always a
   * persistent, interactive column regardless of this open/closed
   * state.
   */
  sidebarElement.inert = mobileSidebarQuery.matches && !isOpen;

  if (sidebarBackdrop) {
    sidebarBackdrop.hidden = !isOpen;
  }

  sidebarToggleButton?.setAttribute("aria-expanded", String(isOpen));

  if (!isOpen && returnFocus) {
    sidebarToggleButton?.focus();
  }
}

/* ========================================
   SECTION NAVIGATION
======================================== */

function attachSectionNavigationListeners() {
  if (prioritiesBackButton) {
    prioritiesBackButton.addEventListener("click", function () {
      openSection("profile");
    });
  }

  if (prioritiesNextButton) {
    prioritiesNextButton.addEventListener("click", function () {
      navigateToSection("insurance");
    });
  }

  if (insuranceBackButton) {
    insuranceBackButton.addEventListener("click", function () {
      openSection("priorities");
    });
  }

  if (insuranceNextButton) {
    insuranceNextButton.addEventListener("click", function () {
      navigateToSection("cost");
    });
  }

  if (costAnalysisBackButton) {
    costAnalysisBackButton.addEventListener("click", function () {
      navigateToSection("cost");
    });
  }

  if (costAnalysisNextButton) {
    costAnalysisNextButton.addEventListener("click", function () {
      navigateToSection("protection");
    });
  }

  if (analysisViewDetailedButton) {
    analysisViewDetailedButton.addEventListener("click", function () {
      openSection("cost-analysis-detail");
    });
  }

  if (analysisDetailBackButton) {
    analysisDetailBackButton.addEventListener("click", function () {
      openSection("cost-analysis");
    });
  }
}

function navigateToSection(sectionName) {
  /*
   * Client Profile must always remain
   * accessible.
   */
  if (sectionName === "profile") {
    openSection(sectionName);
    return;
  }

  /*
   * All other sections require a
   * completed Client Profile.
   */
  if (!isProfileComplete()) {
    showProfileMessage("Complete the Client Profile before continuing.");

    openSection("profile");
    return;
  }

  openSection(sectionName);
}

/* ========================================
   PROFILE EVENTS
======================================== */

function attachProfileEventListeners() {
  on(EVENTS.PROFILE_COMPLETED, function () {
    openSection("priorities");
  });
}

/* ========================================
   SECTION DISPLAY
======================================== */

export function openSection(sectionName) {
  const matchingSectionExists = Array.from(workspaceSections).some(
    function (section) {
      return section.dataset.content === sectionName;
    },
  );

  if (!matchingSectionExists) {
    console.warn(`Unknown workspace section: ${sectionName}`);

    return;
  }

  sidebarItems.forEach(function (item) {
    const isActive = item.dataset.section === sectionName;

    item.classList.toggle("active", isActive);

    if (isActive) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  workspaceSections.forEach(function (section) {
    const isActive = section.dataset.content === sectionName;

    section.classList.toggle("active", isActive);
  });

  /*
   * Navigating away closes the off-canvas drawer on a narrow screen;
   * a no-op on a wide screen where the sidebar is already a
   * persistent column.
   */
  setSidebarOpen(false);

  emit(EVENTS.SECTION_CHANGED, {
    section: sectionName,
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
