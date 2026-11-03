import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useCareerSession, type SessionApi } from './state/runtime.ts';
import { TechnicalView } from './technical/TechnicalView.tsx';
import { Battery } from './app/Battery.tsx';
import { DossierCard } from './app/Dossier.tsx';
import { Icon } from './app/icons.tsx';
import { Registration, Syllabus } from './app/Pages.tsx';
import { PathwayDetail, PathwayList, isStale, latestSet } from './app/Pathways.tsx';
import {
  batteryOrder,
  candidateId,
  initials,
  latestAnswers,
  loadProfile,
  saveProfile,
  type Profile,
} from './app/shared.tsx';
import { Dashboard } from './app/Dashboard.tsx';
import { ProfileWorkspace } from './app/ProfileWorkspace.tsx';
import { DevelopmentPlan } from './app/DevelopmentPlan.tsx';
import { ExportModal } from './app/ExportModal.tsx';
import { CelebrationModal } from './app/CelebrationModal.tsx';
import { ThemeToggle } from './app/ThemeToggle.tsx';
import { getStoredTheme, persistTheme, type Theme } from './app/theme.ts';
import type { PathwayCandidate } from './api/types.ts';
import '@fontsource/source-serif-4/latin-400.css';
import '@fontsource/source-serif-4/latin-400-italic.css';
import '@fontsource/source-serif-4/latin-600.css';
import '@fontsource/source-sans-3/latin-400.css';
import '@fontsource/source-sans-3/latin-600.css';
import '@fontsource/source-sans-3/latin-700.css';
import './app/app.css';
import './app/theme.css';

type WorkspaceTab = 'dashboard' | 'profile' | 'assess' | 'pathways' | 'plan' | 'dossier' | 'syllabus';

const NAV_ITEMS: readonly { key: WorkspaceTab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'profile', label: 'Profile & Evidence', icon: 'account_box' },
  { key: 'assess', label: 'Assessment Battery', icon: 'quiz' },
  { key: 'pathways', label: 'Career Pathways', icon: 'account_tree' },
  { key: 'plan', label: 'Development Plan', icon: 'assignment' },
  { key: 'dossier', label: 'Results Dossier', icon: 'assignment_turned_in' },
  { key: 'syllabus', label: 'Scope & Syllabus', icon: 'menu_book' },
];

export function App(): ReactNode {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    persistTheme(theme);
  }, [theme]);

  const session = useCareerSession();
  if (session.status === 'ready') {
    return <DesktopWorkspaceApp api={session.api} theme={theme} onThemeChange={setTheme} />;
  }

  return (
    <div className={`c-app ${theme === 'dark' ? 'is-dark' : ''}`} data-theme={theme}>
      <div className="c-screen c-center">
        {session.status === 'loading' ? (
          <div className="c-spinner" aria-label="Loading workspace..." />
        ) : (
          <section className="c-card">
            <h1 className="c-h2">The assessment engine did not respond</h1>
            <p className="c-body-sm">{session.error}</p>
            <button type="button" className="c-btn c-btn-primary" onClick={session.retry}>
              Try Again
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

function DesktopWorkspaceApp({
  api,
  theme,
  onThemeChange,
}: {
  api: SessionApi;
  theme: Theme;
  onThemeChange: (t: Theme) => void;
}): ReactNode {
  const items = batteryOrder(api.catalog.items);
  const firstOpen = (): number => {
    const index = items.findIndex((item) => !latestAnswers(api.view).has(item.itemRef));
    return index < 0 ? 0 : index;
  };

  const [profile, setProfile] = useState<Profile | undefined>(loadProfile);
  const [tab, setTab] = useState<WorkspaceTab>('dashboard');
  const [cursor, setCursor] = useState(firstOpen);
  const [pathwayId, setPathwayId] = useState<string | undefined>(undefined);
  const [technical, setTechnical] = useState(false);
  const [query, setQuery] = useState<string | undefined>(undefined);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const answeredCount = latestAnswers(api.view).size;
  const prevAnsweredCountRef = useRef(answeredCount);

  // Auto-trigger celebration modal when candidate achieves 100% assessment completion
  useEffect(() => {
    const prev = prevAnsweredCountRef.current;
    prevAnsweredCountRef.current = answeredCount;
    if (items.length > 0 && answeredCount === items.length) {
      const storageKey = `career107_celebrated_${candidateId(api.view)}`;
      let alreadyCelebrated = false;
      try {
        alreadyCelebrated = sessionStorage.getItem(storageKey) === 'true';
      } catch {
        // ignore storage error
      }
      if (prev < items.length || !alreadyCelebrated) {
        setShowCelebration(true);
        try {
          sessionStorage.setItem(storageKey, 'true');
        } catch {
          // ignore storage error
        }
      }
    }
  }, [answeredCount, items.length, api.view]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, pathwayId, technical]);

  // Keep pathways mapped from latest answer
  useEffect(() => {
    if (!api.busy && api.rejections.length === 0 && isStale(api)) void api.mapPathways();
  }, [api]);

  if (technical) return <TechnicalView api={api} onClose={() => setTechnical(false)} />;

  const updateProfile = (next: Profile | undefined): void => {
    saveProfile(next);
    setProfile(next);
  };

  if (profile === undefined) {
    return (
      <div className={`c-app ${theme === 'dark' ? 'is-dark' : ''}`} data-theme={theme}>
        <Registration questionCount={items.length} onSubmit={updateProfile} />
      </div>
    );
  }

  const navigateTo = (next: WorkspaceTab): void => {
    setPathwayId(undefined);
    setQuery(undefined);
    setTab(next);
  };

  const openPathway = (id: string): void => {
    setTab('pathways');
    setPathwayId(id);
  };

  const openItem = (index: number): void => {
    setCursor(index);
    navigateTo('assess');
  };

  const battery = (
    <Battery
      api={api}
      profile={profile}
      index={cursor}
      onIndex={setCursor}
      onDone={() => navigateTo('dossier')}
      onCelebration={() => setShowCelebration(true)}
    />
  );

  let screenContent: ReactNode;

  if (query !== undefined) {
    screenContent = <SearchScreen api={api} query={query} onPathway={openPathway} onItem={openItem} />;
  } else if (tab === 'dashboard') {
    screenContent = (
      <Dashboard
        api={api}
        profile={profile}
        onNavigate={navigateTo}
        onOpenPathway={openPathway}
        onOpenItem={openItem}
        onUpdateProfile={updateProfile}
        onCelebrate={() => setShowCelebration(true)}
      />
    );
  } else if (tab === 'profile') {
    screenContent = <ProfileWorkspace profile={profile} onUpdate={updateProfile} />;
  } else if (tab === 'assess') {
    screenContent = battery;
  } else if (tab === 'pathways') {
    if (pathwayId !== undefined) {
      screenContent = <PathwayDetail api={api} pathwayId={pathwayId} onBack={() => setPathwayId(undefined)} />;
    } else {
      screenContent = (
        <div className="c-stack-lg">
          <section className="c-card c-card-highlight">
            <span className="c-tag">
              <Icon name="account_tree" size={14} /> Career Exploration (FR-016 – FR-018)
            </span>
            <h1 className="c-h1">Criterion-Referenced Pathway Exploration</h1>
            <p className="c-body-sm">
              Multiple plausible career directions derived from your own observations. Directions carry trade-offs, open questions,
              and requirement breakdowns: the system never reduces you to a single forced recommendation.
            </p>
          </section>
          <PathwayList api={api} onOpen={setPathwayId} onStart={() => navigateTo('assess')} />
        </div>
      );
    }
  } else if (tab === 'plan') {
    screenContent = (
      <DevelopmentPlan
        api={api}
        profile={profile}
        onUpdateProfile={updateProfile}
        onExplorePathway={openPathway}
      />
    );
  } else if (tab === 'dossier') {
    screenContent = (
      <div className="c-stack-lg">
        <DossierCard api={api} profile={profile} />
        <PathwayList api={api} onOpen={setPathwayId} onStart={() => navigateTo('assess')} />
      </div>
    );
  } else if (tab === 'syllabus') {
    screenContent = <Syllabus api={api} onItem={openItem} />;
  }

  return (
    <div className={`c-app c-desktop-shell ${theme === 'dark' ? 'is-dark' : ''}`} data-theme={theme}>
      {/* Desktop Sidebar Navigation */}
      <aside className="c-sidebar">
        <div className="c-sidebar-brand">
          <span className="c-seal">
            <Icon name="account_balance" size={24} />
          </span>
          <div>
            <strong style={{ fontSize: '15px' }}>Career Assessment 107</strong>
            <div className="c-caption">V2.0 Desktop Workspace</div>
          </div>
        </div>

        {/* Candidate Profile Summary Tile */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--surface-dim)' }}>
          <div className="c-row" style={{ justifyContent: 'flex-start', gap: '10px' }}>
            <div className="c-avatar c-avatar-sm">
              {initials(profile.name)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <strong className="c-strong" style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {profile.name || 'Candidate'}
              </strong>
              <div className="c-caption">{candidateId(api.view)}</div>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="c-sidebar-nav" aria-label="Workspace sections">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`c-sidebar-item ${tab === item.key && pathwayId === undefined ? 'is-active' : ''}`}
              onClick={() => navigateTo(item.key)}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer with Theme Toggle, Technical View, and Privacy guarantee */}
        <div className="c-sidebar-footer">
          <ThemeToggle theme={theme} onThemeChange={onThemeChange} />

          <button
            type="button"
            className="c-btn c-btn-secondary c-btn-block"
            style={{ marginBottom: '8px' }}
            onClick={() => setTechnical(true)}
          >
            <Icon name="terminal" size={16} /> Technical View & Invariants
          </button>
          <div className="c-footnote">
            <Icon name="lock" size={12} /> Private · Stored on device only
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="c-main-workspace">
        {/* Top Header Bar */}
        <header className="c-workspace-topbar">
          <div className="c-row" style={{ gap: '12px', flex: 1, maxWidth: '480px' }}>
            <div className="c-search" style={{ width: '100%' }}>
              <input
                className="c-input"
                value={query ?? ''}
                placeholder="Search pathways, assessment items, and skills..."
                onChange={(e) => setQuery(e.target.value || undefined)}
              />
            </div>
          </div>

          {/* Top Bar Actions */}
          <div className="c-row" style={{ gap: '10px' }}>
            <button
              type="button"
              className="c-btn c-btn-secondary"
              onClick={() => setShowExportModal(true)}
              title="Export dossier or manage local data"
            >
              <Icon name="download" size={16} /> Export / Data
            </button>

            <button
              type="button"
              className="c-btn c-btn-primary"
              onClick={() => openItem(firstOpen())}
            >
              <Icon name="quiz" size={16} />
              {answeredCount === items.length ? 'Review Test' : `Test (${answeredCount}/${items.length})`}
            </button>
          </div>
        </header>

        {/* Main Content View */}
        <main className="c-workspace-body">
          {screenContent}
        </main>
      </div>

      {/* Rejections and Error Toasts */}
      {api.rejections.length > 0 && (
        <div className="c-toast" role="alert">
          <p>{api.rejections.map((item: string) => item.replace(/^[A-Z0-9.\-_]+: /, '')).join(' ')}</p>
          <button type="button" className="c-icon-btn" aria-label="Dismiss" onClick={api.clearMessages}>
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      {/* Export & Data Management Modal (FR-022, FR-023) */}
      {showExportModal && (
        <ExportModal
          api={api}
          profile={profile}
          onClose={() => setShowExportModal(false)}
          onResetAll={() => {
            void api.reset().then(() => {
              updateProfile(undefined);
              setCursor(0);
              navigateTo('dashboard');
            });
          }}
        />
      )}

      {/* 100% Assessment Completion Celebration Modal */}
      {showCelebration && (
        <CelebrationModal
          api={api}
          profile={profile}
          onClose={() => setShowCelebration(false)}
          onReviewDossier={() => {
            setShowCelebration(false);
            navigateTo('dossier');
          }}
          onExplorePathways={() => {
            setShowCelebration(false);
            navigateTo('pathways');
          }}
        />
      )}
    </div>
  );
}

function SearchScreen(props: {
  api: SessionApi;
  query: string;
  onPathway: (id: string) => void;
  onItem: (index: number) => void;
}): ReactNode {
  const needle = props.query.trim().toLowerCase();
  const items = batteryOrder(props.api.catalog.items);
  const pathways = (latestSet(props.api)?.pathways ?? []).filter((pathway: PathwayCandidate) =>
    `${pathway.name} ${pathway.description}`.toLowerCase().includes(needle),
  );
  const matches = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.promptText.toLowerCase().includes(needle));

  if (needle === '') return <p className="c-body-sm">Type to search career pathways and assessment items.</p>;

  return (
    <section className="c-card">
      <h2 className="c-h2">Search Results for “{props.query}”</h2>
      <div className="c-rule" />
      <div className="c-ledger">
        {pathways.map((pathway: PathwayCandidate) => (
          <button key={pathway.id} type="button" onClick={() => props.onPathway(pathway.pathwayId)}>
            <Icon name="account_tree" size={18} />
            <span className="c-body-sm c-strong">{pathway.name} (Pathway)</span>
            <Icon name="chevron_right" size={18} />
          </button>
        ))}
        {matches.map(({ item, index }) => (
          <button key={item.itemRef} type="button" onClick={() => props.onItem(index)}>
            <Icon name="quiz" size={18} />
            <span className="c-body-sm">{item.promptText} (Item)</span>
            <Icon name="chevron_right" size={18} />
          </button>
        ))}
        {pathways.length + matches.length === 0 ? <p className="c-body-sm">Nothing matches “{props.query}”.</p> : null}
      </div>
    </section>
  );
}
