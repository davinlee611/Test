"use strict";

import {
  closeModalOnOverlayClick,
  closeModalOnEscape,
} from "../../utils/modal.js";

/* ========================================
   INSURANCE EVENT BINDING
======================================== */

export function bindInsuranceEvents({
  elements,

  onPortfolioErrorClick,
  onPortfolioReviewClick,

  onAddPolicy,
  onClosePolicy,
  onSavePolicy,

  onInsurerChange,
  onPolicyStatusChange,
  onPolicyTypeChange,
  onLongTermCareBasePlanChange,
  onPolicyLifeAssuredInput,

  onHospitalisationRiderChange,
  onHospitalisationWardTypeChange,
  onHospitalisationPremiumChange,

  onAddBenefit,
  onCloseBenefit,
  onBenefitPayoutTermChange,
  onBenefitTypeChange,
  onSaveBenefit,
}) {
  elements.portfolioErrorButton?.addEventListener(
    "click",
    onPortfolioErrorClick,
  );

  elements.portfolioReviewButton?.addEventListener(
    "click",
    onPortfolioReviewClick,
  );

  elements.addPolicyButton?.addEventListener("click", onAddPolicy);

  elements.closePolicyModalButton?.addEventListener("click", onClosePolicy);

  elements.cancelPolicyButton?.addEventListener("click", onClosePolicy);

  elements.savePolicyButton?.addEventListener("click", onSavePolicy);

  elements.insurerSelect?.addEventListener("change", onInsurerChange);

  elements.policyStatusSelect?.addEventListener("change", onPolicyStatusChange);

  elements.policyTypeSelect?.addEventListener("change", onPolicyTypeChange);

  elements.hospitalisationWardTypeSelect?.addEventListener(
    "change",
    onHospitalisationWardTypeChange,
  );

  elements.hospitalisationRiderCheckbox?.addEventListener(
    "change",
    onHospitalisationRiderChange,
  );

  elements.premiumInput?.addEventListener(
    "input",
    onHospitalisationPremiumChange,
  );

  elements.hospitalisationRiderPremiumInput?.addEventListener(
    "input",
    onHospitalisationPremiumChange,
  );

  elements.hospitalisationMedisaveInput?.addEventListener(
    "input",
    onHospitalisationPremiumChange,
  );

  elements.longTermCareBasePlanSelect?.addEventListener(
    "change",
    onLongTermCareBasePlanChange,
  );

  elements.policyLifeAssuredInput?.addEventListener(
    "input",
    onPolicyLifeAssuredInput,
  );

  elements.addBenefitButton?.addEventListener("click", onAddBenefit);

  elements.closeBenefitEditorButton?.addEventListener("click", onCloseBenefit);

  elements.cancelBenefitButton?.addEventListener("click", onCloseBenefit);

  elements.benefitPayoutTermSelect?.addEventListener(
    "change",
    onBenefitPayoutTermChange,
  );

  elements.benefitTypeSelect?.addEventListener("change", onBenefitTypeChange);

  elements.saveBenefitButton?.addEventListener("click", onSaveBenefit);

  closeModalOnOverlayClick(elements.policyModal);

  closeModalOnEscape(elements.policyModal);
}
