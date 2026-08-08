"use strict";

/* ========================================
   SBMI ANALYSIS ELEMENTS
======================================== */

export function getSbmiAnalysisElements() {
  return {
    neededExpenseCaption: document.getElementById("sbmiNeededExpenseCaption"),

    neededExpenseAmount: document.getElementById("sbmiNeededExpenseAmount"),

    neededLiabilityCaption: document.getElementById(
      "sbmiNeededLiabilityCaption",
    ),

    neededLiabilityAmount: document.getElementById(
      "sbmiNeededLiabilityAmount",
    ),

    totalNeededValue: document.getElementById("sbmiTotalNeeded"),

    existingList: document.getElementById("sbmiExistingList"),

    existingEmptyMessage: document.getElementById("sbmiExistingEmptyMessage"),

    totalExistingValue: document.getElementById("sbmiTotalExisting"),

    gapValue: document.getElementById("sbmiGapValue"),

    gapTag: document.getElementById("sbmiGapTag"),

    gapProgressFill: document.getElementById("sbmiGapProgressFill"),

    gapProgressCaption: document.getElementById("sbmiGapProgressCaption"),

    waitTimeSignalValue: document.getElementById("sbmiWaitTimeSignalValue"),

    waitTimeScaleDots: document.getElementById("sbmiWaitTimeScaleDots"),

    waitTimeRecordedValue: document.getElementById(
      "sbmiWaitTimeRecordedValue",
    ),

    waitTimeFlag: document.getElementById("sbmiWaitTimeFlag"),

    waitTimeFlagIcon: document.getElementById("sbmiWaitTimeFlagIcon"),

    waitTimeFlagTitle: document.getElementById("sbmiWaitTimeFlagTitle"),

    waitTimeFlagDetail: document.getElementById("sbmiWaitTimeFlagDetail"),

    injurySignalValue: document.getElementById("sbmiInjurySignalValue"),

    injuryRecordedValue: document.getElementById("sbmiInjuryRecordedValue"),

    injuryFlag: document.getElementById("sbmiInjuryFlag"),

    injuryFlagIcon: document.getElementById("sbmiInjuryFlagIcon"),

    injuryFlagTitle: document.getElementById("sbmiInjuryFlagTitle"),

    injuryFlagDetail: document.getElementById("sbmiInjuryFlagDetail"),
  };
}
