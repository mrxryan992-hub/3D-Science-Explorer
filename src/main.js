import { isAdmin, isVerifiedSession, logoutUser, subscribeAuth } from './state/auth.js';
import { getState, startUserSync, stopUserSync, subscribe, syncInitialBadges } from './state/store.js';
import { notifyRewardEvents, showToast } from './components/toast.js';
import { renderLoginView } from './views/loginView.js';
import { renderDashboardView } from './views/dashboardView.js';
import { renderLearnView } from './views/learnView.js';
import { renderQuizView } from './views/quizView.js';
import { renderSimView } from './views/simView.js';
import { renderLeaderboardView } from './views/leaderboardView.js';
import { renderTeacherView } from './views/teacherView.js';
import { renderAdminView } from './views/adminView.js';

const VALID_VIEWS = new Set(['dash', 'learn', 'quiz', 'daily', 'sim', 'lb', 'teacher', 'admin']);

const viewState = {
  currentView: 'dash',
  learnCategory: 'all',
  learnBand: 'all',
  learnQuery: '',
  activeMaterialId: null,
  quizCategory: 'all',
  quizBand: 'all',
  quizIndex: 0,
  selectedOption: null,
  quizFeedback: null,
  activeSim: 'g',
  lbPeriod: 'all',
  lbBand: 'all',
};

let activeViewCleanup = null;

function readHashView() {
  const hash = window.location.hash.replace('#', '').trim();
  return VALID_VIEWS.has(hash) ? hash : 'dash';
}

function getNavItemsForRole() {
  const state = getState();
  if (isAdmin()) {
    return [
      { key: 'admin', label: 'Panel Admin' },
      { key: 'teacher', label: 'Studio Guru' },
      { key: 'learn', label: 'Materi' },
      { key: 'sim', label: 'Simulasi' },
      { key: 'lb', label: 'Peringkat' },
    ];
  }
  if (state.accountType === 'teacher') {
    return [
      { key: 'teacher', label: 'Studio Guru' },
      { key: 'learn', label: 'Materi' },
      { key: 'quiz', label: 'Kuis' },
      { key: 'sim', label: 'Simulasi' },
      { key: 'lb', label: 'Peringkat' },
    ];
  }
  return [
    { key: 'dash', label: 'Dashboard' },
    { key: 'learn', label: 'Materi' },
    { key: 'quiz', label: 'Kuis' },
    { key: 'sim', label: 'Simulasi' },
    { key: 'lb', label: 'Peringkat' },
  ];
}

function renderTopBar() {
  const nav = document.getElementById('nav');
  const headerCta = document.getElementById('header-cta');
  const authed = isVerifiedSession();

  if (nav) {
    if (!authed) {
      nav.innerHTML = '';
    } else {
      const items = getNavItemsForRole();
      nav.innerHTML = items
        .map(
          (item) =>
            `<a href="#${item.key}" class="nav-link ${viewState.currentView === item.key ? 'is-active' : ''}" data-view="${item.key}">${item.label}</a>`
        )
        .join('');

      nav.querySelectorAll('[data-view]').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const target = el.getAttribute('data-view');
          if (target) navigateTo(target);
        });
      });
    }
  }

  if (headerCta) {
    if (!authed) {
      headerCta.style.display = 'none';
    } else {
      headerCta.style.display = '';
      headerCta.textContent = 'Keluar';
      headerCta.className = 'btn btn-3d btn-secondary btn-sm';
    }
  }
}

function renderActiveView() {
  if (typeof activeViewCleanup === 'function') {
    activeViewCleanup();
    activeViewCleanup = null;
  }

  const main = document.getElementById('app-main');
  if (!main) return;

  renderTopBar();

  if (!isVerifiedSession()) {
    activeViewCleanup = renderLoginView(main);
    return;
  }

  if (viewState.currentView === 'admin' && !isAdmin()) {
    viewState.currentView = 'dash';
  }

  const openMaterialHandler = (materialId) => {
    viewState.activeMaterialId = materialId;
    navigateTo('learn', { preserveMaterial: true });
  };

  switch (viewState.currentView) {
    case 'dash':
      renderDashboardView(main, { onNavigate: navigateTo, onOpenMaterial: openMaterialHandler });
      break;
    case 'learn':
      activeViewCleanup = renderLearnView(main, viewState, {
        onNavigateSim: (simKey) => {
          viewState.activeSim = simKey;
          navigateTo('sim');
        },
      });
      break;
    case 'quiz':
      renderQuizView(main, viewState, {
        isDaily: false,
        onOpenMaterial: openMaterialHandler,
      });
      break;
    case 'daily':
      renderQuizView(main, viewState, {
        isDaily: true,
        onOpenMaterial: openMaterialHandler,
      });
      break;
    case 'sim':
      activeViewCleanup = renderSimView(main, viewState);
      break;
    case 'lb':
      renderLeaderboardView(main, viewState);
      break;
    case 'teacher':
      renderTeacherView(main);
      break;
    case 'admin':
      renderAdminView(main);
      break;
    default:
      renderDashboardView(main, { onNavigate: navigateTo, onOpenMaterial: openMaterialHandler });
  }
}

export function navigateTo(viewKey, options = {}) {
  if (!VALID_VIEWS.has(viewKey)) return;

  viewState.currentView = viewKey;
  if (!options.preserveMaterial) {
    viewState.activeMaterialId = null;
  }
  viewState.selectedOption = null;
  viewState.quizFeedback = null;

  if (isVerifiedSession() && window.location.hash !== `#${viewKey}`) {
    history.pushState(null, '', `#${viewKey}`);
  }

  renderActiveView();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function bootstrap() {
  viewState.currentView = readHashView();

  const brandLink = document.getElementById('brand-link');
  brandLink?.addEventListener('click', (e) => {
    e.preventDefault();
    if (isVerifiedSession()) {
      navigateTo('dash');
    }
  });

  const headerCta = document.getElementById('header-cta');
  headerCta?.addEventListener('click', async () => {
    if (isVerifiedSession()) {
      await logoutUser();
      viewState.currentView = 'dash';
      showToast('Anda telah keluar dari akun.', 'info');
    }
  });

  window.addEventListener('popstate', () => {
    viewState.currentView = readHashView();
    viewState.selectedOption = null;
    viewState.quizFeedback = null;
    renderActiveView();
  });

  subscribe(() => {
    if (
      isVerifiedSession() &&
      (viewState.currentView === 'dash' || viewState.currentView === 'lb' || viewState.currentView === 'quiz')
    ) {
      renderActiveView();
    } else if (isVerifiedSession()) {
      renderTopBar();
    }
  });

  subscribeAuth(async ({ authReady, user }) => {
    if (!authReady) return;
    if (user && user.emailVerified) {
      await startUserSync(user);
      const initialBadges = syncInitialBadges();
      notifyRewardEvents({ unlockedBadges: initialBadges });

      const currentState = getState();
      viewState.learnBand = currentState.gradeBand;
      viewState.quizBand = currentState.gradeBand;

      if (!window.location.hash) {
        if (user.isAdmin) {
          viewState.currentView = 'admin';
        } else if (currentState.accountType === 'teacher') {
          viewState.currentView = 'teacher';
        } else {
          viewState.currentView = 'dash';
        }
      }
    } else {
      stopUserSync();
    }
    renderActiveView();
  });

  renderActiveView();
}

bootstrap();
