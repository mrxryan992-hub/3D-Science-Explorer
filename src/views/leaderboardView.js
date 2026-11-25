import { DEFAULT_AVATAR, DEMO_PEERS } from '../data/scienceData.js';
import { getAuthUser } from '../state/auth.js';
import { getLeaderboardEntries, getLevelInfo, getState } from '../state/store.js';
import { renderAvatar3DSvg } from '../components/avatar3d.js';
import { escapeHtml } from '../utils/dom.js';

export function renderLeaderboardView(container, viewState = {}) {
  const state = getState();
  const levelInfo = getLevelInfo();
  const authUser = getAuthUser();
  const cloudEntries = getLeaderboardEntries();

  const period = viewState.lbPeriod || 'all'; // 'daily' | 'weekly' | 'all'
  const bandFilter = viewState.lbBand || 'all'; // 'all' | 'SMP' | 'SMA'

  const seenUids = new Set();
  const merged = [];

  for (const row of cloudEntries) {
    if (!row || !row.uid || seenUids.has(row.uid)) continue;
    seenUids.add(row.uid);
    const isSelf = authUser && row.uid === authUser.uid;
    merged.push({
      name: isSelf ? state.name : row.name,
      gradeBand: isSelf ? state.gradeBand : row.gradeBand || 'SMP',
      avatarConfig: isSelf ? state.avatarConfig : row.avatarConfig || DEFAULT_AVATAR,
      xp: isSelf ? state.xp : row.xp || 0,
      weeklyXp: isSelf ? state.weeklyXp || state.xp : row.weeklyXp ?? row.xp ?? 0,
      dailyXp: isSelf ? state.dailyXp || 0 : row.dailyXp ?? 0,
      level: isSelf ? levelInfo.level : row.level || 1,
      isUser: Boolean(isSelf),
    });
  }

  if (authUser && !seenUids.has(authUser.uid)) {
    merged.push({
      name: state.name,
      gradeBand: state.gradeBand,
      avatarConfig: state.avatarConfig,
      xp: state.xp,
      weeklyXp: state.weeklyXp || state.xp,
      dailyXp: state.dailyXp || 0,
      level: levelInfo.level,
      isUser: true,
    });
  }

  DEMO_PEERS.forEach((peer) => {
    merged.push({
      name: peer.name,
      gradeBand: peer.gradeBand,
      avatarConfig: peer.avatarConfig,
      xp: peer.xp,
      weeklyXp: peer.weeklyXp,
      dailyXp: peer.dailyXp,
      level: Math.floor(peer.xp / 50) + 1,
      isUser: false,
    });
  });

  const scoreForPeriod = (entry) => {
    if (period === 'daily') return entry.dailyXp || 0;
    if (period === 'weekly') return entry.weeklyXp || 0;
    return entry.xp || 0;
  };

  const filtered = merged.filter((e) => bandFilter === 'all' || e.gradeBand === bandFilter);
  const entries = filtered.sort((a, b) => scoreForPeriod(b) - scoreForPeriod(a) || (a.isUser ? -1 : 1));
  const userRank = entries.findIndex((e) => e.isUser) + 1;
  const aboveEntry = userRank > 1 ? entries[userRank - 2] : null;
  const userScore = userRank > 0 ? scoreForPeriod(entries[userRank - 1]) : 0;
  const xpGap = aboveEntry ? scoreForPeriod(aboveEntry) - userScore : 0;

  container.innerHTML = `
    <section class="page-section">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Papan Peringkat Penjelajah</h1>
          <p class="page-desc">Kompetisi XP harian, mingguan, dan sepanjang waktu antar siswa SMP &amp; SMA.</p>
        </div>
        ${
          userRank > 0
            ? `<span class="muted-meta mono">
                Posisi Anda: #${userRank}${aboveEntry ? ` · ${xpGap} XP di bawah ${escapeHtml(aboveEntry.name)}` : ' · Peringkat teratas'}
              </span>`
            : ''
        }
      </div>

      <div class="toolbar">
        <div class="toolbar-cluster">
          <div class="segmented" role="tablist" aria-label="Periode peringkat">
            <button type="button" class="seg-btn ${period === 'daily' ? 'is-active' : ''}" data-lb-period="daily">Harian</button>
            <button type="button" class="seg-btn ${period === 'weekly' ? 'is-active' : ''}" data-lb-period="weekly">Mingguan</button>
            <button type="button" class="seg-btn ${period === 'all' ? 'is-active' : ''}" data-lb-period="all">Sepanjang Waktu</button>
          </div>

          <div class="segmented" role="tablist" aria-label="Filter jenjang peringkat">
            <button type="button" class="seg-btn ${bandFilter === 'all' ? 'is-active' : ''}" data-lb-band="all">Semua</button>
            <button type="button" class="seg-btn ${bandFilter === 'SMP' ? 'is-active' : ''}" data-lb-band="SMP">SMP</button>
            <button type="button" class="seg-btn ${bandFilter === 'SMA' ? 'is-active' : ''}" data-lb-band="SMA">SMA</button>
          </div>
        </div>
      </div>

      <div class="surface clay-card table-card">
        <table class="lb-table">
          <thead>
            <tr>
              <th>Peringkat</th>
              <th>Penjelajah</th>
              <th>Jenjang</th>
              <th>Level</th>
              <th class="num-col">${period === 'daily' ? 'XP Hari Ini' : period === 'weekly' ? 'XP Minggu Ini' : 'Total XP'}</th>
            </tr>
          </thead>
          <tbody>
            ${entries
              .map(
                (entry, idx) => `
              <tr class="${entry.isUser ? 'is-user-row' : ''} ${idx === 0 ? 'is-top-row' : idx === 1 ? 'is-rank-2' : idx === 2 ? 'is-rank-3' : ''}">
                <td class="mono">#${idx + 1}</td>
                <td>
                  <div class="lb-identity">
                    ${renderAvatar3DSvg(entry.avatarConfig, 34)}
                    <div>
                      <span class="lb-name">${escapeHtml(entry.name)}</span>
                      ${entry.isUser ? '<span class="lb-self-note"> · Kamu</span>' : ''}
                    </div>
                  </div>
                </td>
                <td class="muted-meta">${escapeHtml(entry.gradeBand)}</td>
                <td class="mono">Lv. ${entry.level}</td>
                <td class="num-col mono">${scoreForPeriod(entry)} XP</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;

  container.querySelectorAll('[data-lb-period]').forEach((btn) => {
    btn.addEventListener('click', () => {
      viewState.lbPeriod = btn.getAttribute('data-lb-period') || 'all';
      renderLeaderboardView(container, viewState);
    });
  });

  container.querySelectorAll('[data-lb-band]').forEach((btn) => {
    btn.addEventListener('click', () => {
      viewState.lbBand = btn.getAttribute('data-lb-band') || 'all';
      renderLeaderboardView(container, viewState);
    });
  });
}
