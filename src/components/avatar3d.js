import { AVATAR_OPTIONS, DEFAULT_AVATAR } from '../data/scienceData.js';

function getOption(list, key) {
  return list.find((item) => item.key === key) || list[0];
}

export function renderAvatar3DSvg(rawConfig = DEFAULT_AVATAR, size = 132) {
  const cfg = { ...DEFAULT_AVATAR, ...(rawConfig || {}) };
  const suit = getOption(AVATAR_OPTIONS.suitColor, cfg.suitColor);
  const skin = getOption(AVATAR_OPTIONS.skinTone, cfg.skinTone);
  const uid = Math.random().toString(36).slice(2, 7);

  let hairMarkup = '';
  if (cfg.hairStyle === 'wave') {
    hairMarkup = `
      <path d="M40 50 C40 24 88 22 92 48 C84 36 62 34 40 50 Z" fill="#2A1D1B"/>
      <path d="M48 34 Q64 20 84 34" fill="none" stroke="#4A342F" stroke-width="4" stroke-linecap="round"/>
    `;
  } else if (cfg.hairStyle === 'spiky') {
    hairMarkup = `
      <path d="M38 48 L46 24 L58 36 L68 18 L78 36 L90 25 L92 48 C80 38 50 38 38 48 Z" fill="#1E293B"/>
    `;
  } else if (cfg.hairStyle === 'bob') {
    hairMarkup = `
      <path d="M36 62 C36 24 94 24 94 62 L88 64 C88 40 42 40 42 64 Z" fill="#3B2322"/>
    `;
  } else if (cfg.hairStyle === 'helmet') {
    hairMarkup = `
      <path d="M34 62 C34 20 96 20 96 62" fill="none" stroke="${suit.secondary}" stroke-width="8" stroke-linecap="round"/>
      <circle cx="34" cy="58" r="7" fill="${suit.accent}"/>
      <circle cx="96" cy="58" r="7" fill="${suit.accent}"/>
    `;
  }

  let visorMarkup = '';
  if (cfg.visor === 'round') {
    visorMarkup = `
      <circle cx="54" cy="56" r="8.5" fill="rgba(56,189,248,0.18)" stroke="#F8FAFC" stroke-width="2.2"/>
      <circle cx="76" cy="56" r="8.5" fill="rgba(56,189,248,0.18)" stroke="#F8FAFC" stroke-width="2.2"/>
      <line x1="62.5" y1="56" x2="67.5" y2="56" stroke="#F8FAFC" stroke-width="2.2"/>
    `;
  } else if (cfg.visor === 'cyber') {
    visorMarkup = `
      <rect x="43" y="48" width="44" height="15" rx="7.5" fill="rgba(6,182,212,0.72)" stroke="#E0F2FE" stroke-width="1.8"/>
      <line x1="50" y1="53" x2="62" y2="53" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    `;
  }

  let accessoryMarkup = '';
  if (cfg.accessory === 'atom') {
    accessoryMarkup = `
      <g transform="translate(84, 96)">
        <ellipse rx="9" ry="3.5" transform="rotate(30)" fill="none" stroke="#F8FAFC" stroke-width="1.4"/>
        <ellipse rx="9" ry="3.5" transform="rotate(-30)" fill="none" stroke="#F8FAFC" stroke-width="1.4"/>
        <circle r="2.8" fill="${suit.accent}"/>
      </g>
    `;
  } else if (cfg.accessory === 'planet') {
    accessoryMarkup = `
      <g transform="translate(86, 98)">
        <circle r="7" fill="${suit.accent}"/>
        <ellipse rx="11" ry="3" transform="rotate(-22)" fill="none" stroke="#F8FAFC" stroke-width="1.5"/>
      </g>
    `;
  } else if (cfg.accessory === 'flask') {
    accessoryMarkup = `
      <g transform="translate(85, 96)">
        <polygon points="-6,8 6,8 2,-4 -2,-4" fill="#34D399" stroke="#F8FAFC" stroke-width="1.4"/>
        <rect x="-2.5" y="-8" width="5" height="4" rx="1" fill="#F8FAFC"/>
      </g>
    `;
  } else if (cfg.accessory === 'rocket') {
    accessoryMarkup = `
      <g transform="translate(85, 96) rotate(-25)">
        <path d="M0 -9 C4 -4 4 3 0 7 C-4 3 -4 -4 0 -9 Z" fill="#F8FAFC"/>
        <circle cx="0" cy="-2" r="2" fill="${suit.primary}"/>
        <polygon points="-3,4 -6,8 -1,6" fill="${suit.accent}"/>
        <polygon points="3,4 6,8 1,6" fill="${suit.accent}"/>
      </g>
    `;
  }

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 130 130" class="avatar-3d-svg" role="img" aria-label="Avatar 3D Penjelajah">
      <defs>
        <radialGradient id="bg-${uid}" cx="32%" cy="24%" r="78%">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="55%" stop-color="${suit.secondary}" stop-opacity="0.24"/>
          <stop offset="100%" stop-color="#E0F2FE"/>
        </radialGradient>
        <linearGradient id="suit-${uid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${suit.secondary}"/>
          <stop offset="100%" stop-color="${suit.primary}"/>
        </linearGradient>
        <linearGradient id="skin-${uid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${skin.color}"/>
          <stop offset="100%" stop-color="${skin.shade}"/>
        </linearGradient>
      </defs>

      <rect x="4" y="4" width="122" height="122" rx="30" fill="url(#bg-${uid})" stroke="rgba(2,132,199,0.22)" stroke-width="2"/>

      <!-- Claymorphic Shoulders / Suit -->
      <path d="M24 124 C26 92 42 82 65 82 C88 82 104 92 106 124 Z" fill="url(#suit-${uid})"/>
      <path d="M46 84 Q65 96 84 84" fill="none" stroke="${suit.accent}" stroke-width="5" stroke-linecap="round"/>

      <!-- Neck & Clay Head -->
      <rect x="57" y="72" width="16" height="14" rx="6" fill="${skin.shade}"/>
      <circle cx="38" cy="58" r="6" fill="${skin.shade}"/>
      <circle cx="92" cy="58" r="6" fill="${skin.shade}"/>
      <rect x="39" y="32" width="52" height="48" rx="24" fill="url(#skin-${uid})"/>
      <ellipse cx="53" cy="40" rx="8" ry="3.5" fill="rgba(255,255,255,0.22)"/>

      <!-- Eyes & Smile -->
      <circle cx="54" cy="56" r="3.2" fill="#0F172A"/>
      <circle cx="76" cy="56" r="3.2" fill="#0F172A"/>
      <circle cx="55" cy="54.8" r="1.1" fill="#FFFFFF"/>
      <circle cx="77" cy="54.8" r="1.1" fill="#FFFFFF"/>
      <path d="M58 67 Q65 73 72 67" fill="none" stroke="#5A3327" stroke-width="2.4" stroke-linecap="round"/>

      ${hairMarkup}
      ${visorMarkup}
      ${accessoryMarkup}
    </svg>
  `;
}

export function attachAvatarTilt(stageEl) {
  if (!stageEl) return;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (media.matches) return;

  const onMove = (e) => {
    const rect = stageEl.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    stageEl.style.transform = `perspective(700px) rotateY(${(x * 16).toFixed(2)}deg) rotateX(${(-y * 16).toFixed(2)}deg) scale(1.02)`;
  };
  const onLeave = () => {
    stageEl.style.transform = 'perspective(700px) rotateY(0deg) rotateX(0deg) scale(1)';
  };
  stageEl.addEventListener('pointermove', onMove);
  stageEl.addEventListener('pointerleave', onLeave);
}
