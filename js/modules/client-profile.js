"use strict";

import {
    clientPlan,
} from "../state/client-state.js";

import {
    getTodayDate,
    isValidEmail,
} from "../utils/client-utils.js";


/* ========================================
   PROFILE ELEMENTS
======================================== */

const clientHeading =
    document.getElementById("clientName");

const profileForm =
    document.getElementById("profileForm");

const clientNameInput =
    document.getElementById("clientNameInput");

const dateOfBirthInput =
    document.getElementById("dateOfBirth");

const genderInput =
    document.getElementById("gender");

const maritalStatusInput =
    document.getElementById("maritalStatus");

const occupationInput =
    document.getElementById("occupation");

const employmentStatusInput =
    document.getElementById(
        "employmentStatus",
    );

const dependantsInput =
    document.getElementById("dependants");

const phoneInput =
    document.getElementById("phone");

const emailInput =
    document.getElementById("email");

const profileFormMessage =
    document.getElementById(
        "profileFormMessage",
    );

const profileValidationModal =
    document.getElementById(
        "profileValidationModal",
    );

const profileValidationMessage =
    document.getElementById(
        "profileValidationMessage",
    );

const closeProfileValidationModalButton =
    document.getElementById(
        "closeProfileValidationModal",
    );

const validationModalBackdrop =
    document.querySelector(
        "[data-close-validation-modal]",
    );


/* ========================================
   MODULE CONFIGURATION
======================================== */

let moduleInitialized = false;

let onProfileChanged = function () {};
let onProfileCompleted = function () {};


/* ========================================
   INITIALIZATION
======================================== */

export function initializeProfile(options = {}) {
    if (
        typeof options.onProfileChanged ===
        "function"
    ) {
        onProfileChanged =
            options.onProfileChanged;
    }

    if (
        typeof options.onProfileCompleted ===
        "function"
    ) {
        onProfileCompleted =
            options.onProfileCompleted;
    }

    if (!moduleInitialized) {
        attachProfileListeners();
        moduleInitialized = true;
    }

    if (dateOfBirthInput) {
        dateOfBirthInput.max =
            getTodayDate();
    }

    renderProfile();
}


/* ========================================
   EVENT LISTENERS
======================================== */

function attachProfileListeners() {
    if (profileForm) {
        profileForm.addEventListener(
            "input",
            handleProfileInput,
        );

        profileForm.addEventListener(
            "change",
            handleProfileInput,
        );

        profileForm.addEventListener(
            "submit",
            handleProfileSubmit,
        );
    }

    if (
        closeProfileValidationModalButton
    ) {
        closeProfileValidationModalButton
            .addEventListener(
                "click",
                closeProfileValidationModal,
            );
    }

    if (validationModalBackdrop) {
        validationModalBackdrop
            .addEventListener(
                "click",
                closeProfileValidationModal,
            );
    }

    document.addEventListener(
        "keydown",
        handleProfileModalKeydown,
    );
}


/* ========================================
   PROFILE STATE
======================================== */

function handleProfileInput() {
    clearProfileMessage();
    syncProfileState();
    updateClientHeading();
    onProfileChanged();
}


function syncProfileState() {
    const profile = clientPlan.profile;

    profile.fullName =
        clientNameInput?.value.trim() || "";

    profile.dateOfBirth =
        dateOfBirthInput?.value || "";

    profile.gender =
        genderInput?.value || "";

    profile.maritalStatus =
        maritalStatusInput?.value || "";

    profile.occupation =
        occupationInput?.value.trim() || "";

    profile.employmentStatus =
        employmentStatusInput?.value || "";

    profile.dependants =
        dependantsInput?.value
            ? Number(dependantsInput.value)
            : 0;

    profile.phone =
        phoneInput?.value.trim() || "";

    profile.email =
        emailInput?.value.trim() || "";
}


/* ========================================
   PROFILE SUBMISSION
======================================== */

function handleProfileSubmit(event) {
    event.preventDefault();

    clearProfileMessage();
    syncProfileState();

    const validationResult =
        validateProfile();

    if (!validationResult.isValid) {
        showProfileMessage(
            validationResult.message,
        );

        validationResult.element?.focus();
        return;
    }

    onProfileCompleted();
}


/* ========================================
   VALIDATION
======================================== */

function validateProfile() {
    const profile = clientPlan.profile;

    if (
        profile.email &&
        !isValidEmail(profile.email)
    ) {
        return {
            isValid: false,
            message:
                "Please enter a valid email address.",
            element: emailInput,
        };
    }

    if (!profile.fullName) {
        return {
            isValid: false,
            message:
                "Please enter the client's full name.",
            element: clientNameInput,
        };
    }

    if (!profile.dateOfBirth) {
        return {
            isValid: false,
            message:
                "Please enter the client's date of birth.",
            element: dateOfBirthInput,
        };
    }

    const selectedDate =
        createLocalDate(
            profile.dateOfBirth,
        );

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (
        selectedDate &&
        selectedDate > today
    ) {
        return {
            isValid: false,
            message:
                "Date of birth cannot be in the future.",
            element: dateOfBirthInput,
        };
    }

    if (!profile.gender) {
        return {
            isValid: false,
            message:
                "Please select the client's gender.",
            element: genderInput,
        };
    }

    if (!profile.maritalStatus) {
        return {
            isValid: false,
            message:
                "Please select the client's marital status.",
            element: maritalStatusInput,
        };
    }

    if (!profile.occupation) {
        return {
            isValid: false,
            message:
                "Please enter the client's occupation.",
            element: occupationInput,
        };
    }

    if (!profile.employmentStatus) {
        return {
            isValid: false,
            message:
                "Please select the client's employment status.",
            element: employmentStatusInput,
        };
    }

    return {
        isValid: true,
        message: "",
        element: null,
    };
}


/* ========================================
   PROFILE STATUS
======================================== */

export function isProfileComplete() {
    const profile = clientPlan.profile;

    return Boolean(
        profile.fullName &&
        profile.dateOfBirth &&
        profile.gender &&
        profile.maritalStatus &&
        profile.occupation &&
        profile.employmentStatus
    );
}


export function getClientAge() {
    const dateOfBirth =
        clientPlan.profile.dateOfBirth;

    if (!dateOfBirth) {
        return null;
    }

    const [
        birthYear,
        birthMonth,
        birthDay,
    ] = dateOfBirth
        .split("-")
        .map(Number);

    const today = new Date();

    let age =
        today.getFullYear() -
        birthYear;

    const hasHadBirthdayThisYear =
        today.getMonth() + 1 >
            birthMonth ||
        (
            today.getMonth() + 1 ===
                birthMonth &&
            today.getDate() >=
                birthDay
        );

    if (!hasHadBirthdayThisYear) {
        age--;
    }

    return age;
}


/* ========================================
   PROFILE RENDERING
======================================== */

export function renderProfile() {
    const profile = clientPlan.profile;

    setInputValue(
        clientNameInput,
        profile.fullName,
    );

    setInputValue(
        dateOfBirthInput,
        profile.dateOfBirth,
    );

    setInputValue(
        genderInput,
        profile.gender,
    );

    setInputValue(
        maritalStatusInput,
        profile.maritalStatus,
    );

    setInputValue(
        occupationInput,
        profile.occupation,
    );

    setInputValue(
        employmentStatusInput,
        profile.employmentStatus,
    );

    setInputValue(
        dependantsInput,
        profile.dependants || "",
    );

    setInputValue(
        phoneInput,
        profile.phone,
    );

    setInputValue(
        emailInput,
        profile.email,
    );

    updateClientHeading();
}


export function updateClientHeading() {
    const fullName =
        clientPlan.profile.fullName;

    if (clientHeading) {
        clientHeading.textContent =
            fullName
                ? `${fullName}'s Financial Plan`
                : "New Financial Plan";
    }

    document.title =
        fullName
            ? `${fullName} | Financial Plan`
            : "New Financial Plan";
}


/* ========================================
   PROFILE RESET
======================================== */

export function resetProfile() {
    if (profileForm) {
        profileForm.reset();
    }

    renderProfile();
    clearProfileMessage();
    closeProfileValidationModal();
}


/* ========================================
   VALIDATION MODAL
======================================== */

export function showProfileMessage(
    message,
) {
    if (
        !profileValidationModal ||
        !profileValidationMessage
    ) {
        window.alert(message);
        return;
    }

    profileValidationMessage.textContent =
        message;

    profileValidationModal.hidden = false;

    document.body.classList.add(
        "validation-modal-open",
    );

    closeProfileValidationModalButton
        ?.focus();
}


export function closeProfileValidationModal() {
    if (!profileValidationModal) {
        return;
    }

    profileValidationModal.hidden = true;

    document.body.classList.remove(
        "validation-modal-open",
    );
}


function handleProfileModalKeydown(event) {
    if (
        event.key === "Escape" &&
        profileValidationModal &&
        !profileValidationModal.hidden
    ) {
        closeProfileValidationModal();
    }
}


/* ========================================
   PROFILE MESSAGES
======================================== */

export function clearProfileMessage() {
    if (profileFormMessage) {
        profileFormMessage.textContent =
            "";
    }
}


/* ========================================
   INTERNAL HELPERS
======================================== */

function setInputValue(
    inputElement,
    value,
) {
    if (!inputElement) {
        return;
    }

    inputElement.value =
        value ?? "";
}


function createLocalDate(dateString) {
    const [
        year,
        month,
        day,
    ] = dateString
        .split("-")
        .map(Number);

    if (
        !year ||
        !month ||
        !day
    ) {
        return null;
    }

    return new Date(
        year,
        month - 1,
        day,
    );
}