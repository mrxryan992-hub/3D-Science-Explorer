export function openConfirmModal({ title, description, confirmLabel = 'Konfirmasi', onConfirm }) {
  const dialog = document.getElementById('confirm-dialog');
  const titleEl = document.getElementById('dialog-title');
  const descEl = document.getElementById('dialog-desc');
  const cancelBtn = document.getElementById('dialog-cancel');
  const confirmBtn = document.getElementById('dialog-confirm');

  if (!dialog || !titleEl || !descEl || !cancelBtn || !confirmBtn) return;

  titleEl.textContent = title;
  descEl.textContent = description;
  confirmBtn.textContent = confirmLabel;

  const cleanup = () => {
    cancelBtn.removeEventListener('click', handleCancel);
    confirmBtn.removeEventListener('click', handleConfirm);
    dialog.removeEventListener('click', handleBackdropClick);
  };

  const handleCancel = () => {
    cleanup();
    dialog.close();
  };

  const handleConfirm = () => {
    cleanup();
    dialog.close();
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
  };

  const handleBackdropClick = (event) => {
    if (event.target === dialog) {
      handleCancel();
    }
  };

  cancelBtn.addEventListener('click', handleCancel);
  confirmBtn.addEventListener('click', handleConfirm);
  dialog.addEventListener('click', handleBackdropClick);

  dialog.showModal();
}
