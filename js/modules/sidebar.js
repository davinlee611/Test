"use strict";

import {
    isProfileComplete,
    showProfileMessage,
} from "./client-profile.js";

import {
    on,
} from "../events/event-bus.js";


/* ========================================
   SIDEBAR ELEMENTS
======================================== */

const sidebarItems =
    document.querySelectorAll(
        ".sidebar-item",
    );

const workspaceSections =
    document.querySelectorAll(
        ".workspace-section",
    );

const prioritiesBackButton =
    document.getElementById(
        "prioritiesBackButton",
    );

const prioritiesNextButton =
    document.getElementById(
        "prioritiesNextButton",
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

    moduleInitialized = true;
}


/* ========================================
   SIDEBAR LISTENERS
======================================== */

function attachSidebarListeners() {
    sidebarItems.forEach(function (item) {
        item.addEventListener(
            "click",
            handleSidebarItemClick,
        );
    });
}


function handleSidebarItemClick(event) {
    const selectedItem =
        event.currentTarget;

    const sectionName =
        selectedItem.dataset.section;

    if (!sectionName) {
        return;
    }

    navigateToSection(sectionName);
}


/* ========================================
   SECTION NAVIGATION
======================================== */

function attachSectionNavigationListeners() {
    if (prioritiesBackButton) {
        prioritiesBackButton.addEventListener(
            "click",
            function () {
                openSection("profile");
            },
        );
    }

    if (prioritiesNextButton) {
        prioritiesNextButton.addEventListener(
            "click",
            function () {
                navigateToSection("cost");
            },
        );
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
        showProfileMessage(
            "Complete the Client Profile before continuing.",
        );

        openSection("profile");
        return;
    }

    openSection(sectionName);
}


/* ========================================
   PROFILE EVENTS
======================================== */

function attachProfileEventListeners() {
    on(
        "profile:completed",
        function () {
            openSection("priorities");
        },
    );
}


/* ========================================
   SECTION DISPLAY
======================================== */

export function openSection(sectionName) {
    const matchingSectionExists =
        Array.from(workspaceSections)
            .some(function (section) {
                return (
                    section.dataset.content ===
                    sectionName
                );
            });

    if (!matchingSectionExists) {
        console.warn(
            `Unknown workspace section: ${sectionName}`,
        );

        return;
    }

    sidebarItems.forEach(function (item) {
        const isActive =
            item.dataset.section ===
            sectionName;

        item.classList.toggle(
            "active",
            isActive,
        );

        if (isActive) {
            item.setAttribute(
                "aria-current",
                "page",
            );
        } else {
            item.removeAttribute(
                "aria-current",
            );
        }
    });

    workspaceSections.forEach(
        function (section) {
            const isActive =
                section.dataset.content ===
                sectionName;

            section.classList.toggle(
                "active",
                isActive,
            );
        },
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth",
    });
}