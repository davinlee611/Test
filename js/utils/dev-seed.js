"use strict";

/**
 * Enable or disable development data.
 */
export const DEV_MODE = true;

export function seedClientProfile() {
  if (!DEV_MODE) {
    return;
  }

  return {
    fullName: "John Tan",

    dateOfBirth: "1989-06-15",

    gender: "male",

    maritalStatus: "married",

    occupation: "Engineer",

    employmentStatus: "full_time_employed",

    phoneNumber: "91234567",

    email: "john.tan@email.com",

    dependants: 2,
  };
}
