"use strict";

/* ========================================
   DATE HELPERS
======================================== */

export function getProjectionStartDate() {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth() + 1, 1);
}

export function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function calculateAgeOnDate(dateOfBirth, referenceDate) {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  let age = referenceDate.getFullYear() - birthDate.getFullYear();

  const birthdayHasPassed =
    referenceDate.getMonth() > birthDate.getMonth() ||
    (referenceDate.getMonth() === birthDate.getMonth() &&
      referenceDate.getDate() >= birthDate.getDate());

  if (!birthdayHasPassed) {
    age -= 1;
  }

  return age;
}

export function calculateAgeAtEndOfMonth(dateOfBirth, projectionDate) {
  const endOfMonth = new Date(
    projectionDate.getFullYear(),
    projectionDate.getMonth() + 1,
    0,
  );

  return calculateAgeOnDate(dateOfBirth, endOfMonth);
}

export function isBirthdayAgeMonth({ dateOfBirth, projectionDate, targetAge }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth || "")) {
    return false;
  }

  const birthYear = Number(dateOfBirth.slice(0, 4));

  const birthMonth = Number(dateOfBirth.slice(5, 7)) - 1;

  return (
    projectionDate.getFullYear() === birthYear + targetAge &&
    projectionDate.getMonth() === birthMonth
  );
}

export function formatYearMonth(date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export function formatMonthYear(date) {
  return new Intl.DateTimeFormat("en-SG", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function hasReachedTargetAgeMonth({
  dateOfBirth,
  projectionDate,
  targetAge,
}) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth || "") ||
    !Number.isFinite(targetAge)
  ) {
    return false;
  }

  const birthYear = Number(dateOfBirth.slice(0, 4));

  const birthMonth = Number(dateOfBirth.slice(5, 7)) - 1;

  const targetYear = birthYear + targetAge;

  if (projectionDate.getFullYear() > targetYear) {
    return true;
  }

  if (projectionDate.getFullYear() < targetYear) {
    return false;
  }

  return projectionDate.getMonth() >= birthMonth;
}

export function isTargetAgeMonth({ dateOfBirth, projectionDate, targetAge }) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth || "") ||
    !Number.isFinite(targetAge)
  ) {
    return false;
  }

  const birthYear = Number(dateOfBirth.slice(0, 4));

  const birthMonth = Number(dateOfBirth.slice(5, 7)) - 1;

  return (
    projectionDate.getFullYear() === birthYear + targetAge &&
    projectionDate.getMonth() === birthMonth
  );
}
