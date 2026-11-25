import { escapeHtml } from '../utils/dom.js';
import { iconSvg } from '../utils/icons.js';

const TOAST_DURATION = 3200;

export function showToast(message, variant = 'info') {
  const region = document.getElementById('toast-region');
  if (!region) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${variant}`;
  toast.setAttribute('role', 'status');

  const iconName =
    variant === 'success' ? 'check' : variant === 'badge' ? 'trophy' : 'bolt';
  toast.innerHTML = `<span class="toast-icon">${iconSvg(iconName, 16)}</span><span class="toast-text">${escapeHtml(message)}</span>`;

  region.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => {
      toast.remove();
    }, 220);
  }, TOAST_DURATION);
}

export function notifyRewardEvents(result) {
  if (!result) return;
  if (result.leveledUp) {
    showToast(`Naik ke Level ${result.newLevel}!`, 'success');
  }
  if (Array.isArray(result.unlockedBadges)) {
    result.unlockedBadges.forEach((badge) => {
      showToast(`Badge terbuka: ${badge.name}`, 'badge');
    });
  }
}
