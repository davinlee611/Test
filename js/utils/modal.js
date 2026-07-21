"use strict";

export function openModal(modal) {
  if (!modal) return;

  modal.hidden = false;
  document.body.classList.add("modal-open");
}

export function closeModal(modal) {
  if (!modal) return;

  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

export function closeModalOnOverlayClick(modal) {
  if (!modal) return;

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
}

export function closeModalOnEscape(modal) {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal(modal);
    }
  });
}
