import { useState, useEffect, type ReactNode } from 'react';
import { Icon } from './icons.tsx';
import type { SessionApi } from '../state/runtime.ts';
import {
  MODULES,
  batteryOrder,
  candidateId,
  latestAnswers,
  type Profile,
} from './shared.tsx';
import { latestSet } from './Pathways.tsx';

interface CelebrationModalProps {
  api: SessionApi;
  profile: Profile;
  onClose: () => void;
  onReviewDossier: () => void;
  onExplorePathways: () => void;
}

// Module diagnostic focus descriptions
const MODULE_DESCRIPTIONS = [
  'Exploration of cognitive curiosities, analytical inclination, and technical problem domains.',
  'Fundamental operating drivers, professional integrity, and core motivators.',
  'Interaction preferences, execution cadence, and environmental settings.',
  'Functional proficiencies, self-reported capabilities, and experiential background.',
  'Boundary considerations, personal trade-offs, and career constraints.',
];

// Generate deterministic confetti pieces for celebratory animation
const CONFETTI_PIECES = Array.from({ length: 32 }, (_, i) => {
  const colors = ['#d4af37', '#133e87', '#1e6b3c', '#d97706', '#385ca6', '#059669'];
  const left = (i * 3.125 + ((i % 5) * 1.5)) % 100;
  const delay = ((i * 0.17) % 2.5).toFixed(2);
  const duration = (2.2 + ((i * 0.23) % 1.6)).toFixed(2);
  const size = 6 + (i % 6);
  const color = colors[i % colors.length];
  const isCircle = i % 3 === 0;
  return { id: i, left, delay, duration, size, color, isCircle };
});

export function CelebrationModal({
  api,
  profile,
  onClose,
  onReviewDossier,
  onExplorePathways,
}: CelebrationModalProps): ReactNode {
  const items = batteryOrder(api.catalog.items);
  const answers = latestAnswers(api.view);
  const answeredCount = answers.size;
  const totalItems = items.length;
  const pathwaySet = latestSet(api);
  const topPathway = pathwaySet?.pathways?.[0];

  const [activeTab, setActiveTab] = useState<'overview' | 'modules'>('overview');

  // Trap escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="c-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="celebration-title">
      <div className="c-modal c-celebration-modal" onClick={(e) => e.stopPropagation()}>
        {/* Animated Confetti Particles Overlay */}
        <div className="c-confetti-container" aria-hidden="true">
          {CONFETTI_PIECES.map((piece) => (
            <span
              key={piece.id}
              className={`c-confetti-piece ${piece.isCircle ? 'is-circle' : ''}`}
              style={{
                left: `${piece.left}%`,
                width: `${piece.size}px`,
                height: `${piece.isCircle ? piece.size : piece.size * 1.6}px`,
                backgroundColor: piece.color,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
              }}
            />
          ))}
        </div>

        {/* Modal Close Button */}
        <button
          type="button"
          className="c-icon-btn c-celebration-close"
          onClick={onClose}
          aria-label="Close celebration dialog"
        >
          <Icon name="close" size={20} />
        </button>

        {/* Hero Header with Laurel Insignia */}
        <div className="c-celebration-hero">
          <div className="c-laurel-badge-wrapper">
            <svg className="c-laurel-svg" viewBox="0 0 120 120" width="100" height="100" aria-hidden="true">
              {/* Gold outer halo */}
              <circle cx="60" cy="60" r="54" fill="#fdf8ed" stroke="#d4af37" strokeWidth="2" strokeDasharray="3 3" />
              {/* Laurel left wreath branch */}
              <path
                d="M32 82 C22 68, 24 45, 42 26 C38 34, 40 44, 46 50 C38 48, 32 58, 36 66 C28 66, 28 76, 32 82 Z"
                fill="#b8860b"
                opacity="0.85"
              />
              <path
                d="M38 72 C32 60, 34 40, 48 24"
                stroke="#b8860b"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Laurel right wreath branch */}
              <path
                d="M88 82 C98 68, 96 45, 78 26 C82 34, 80 44, 74 50 C82 48, 88 58, 84 66 C92 66, 92 76, 88 82 Z"
                fill="#b8860b"
                opacity="0.85"
              />
              <path
                d="M82 72 C88 60, 86 40, 72 24"
                stroke="#b8860b"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Central medallion */}
              <circle cx="60" cy="60" r="34" fill="#0b2545" stroke="#d4af37" strokeWidth="2.5" />
              <circle cx="60" cy="60" r="28" fill="#001026" />
              {/* Central text or emblem */}
              <text
                x="60"
                y="56"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="16"
                fontWeight="700"
                fontFamily="var(--sans)"
              >
                100%
              </text>
              <text
                x="60"
                y="69"
                textAnchor="middle"
                fill="#d4af37"
                fontSize="8.5"
                fontWeight="700"
                letterSpacing="1"
              >
                CALIBRATED
              </text>
              {/* Star at top */}
              <polygon
                points="60,37 62,42 67,42 63,45 65,50 60,47 55,50 57,45 53,42 58,42"
                fill="#d4af37"
              />
            </svg>
          </div>

          <div className="c-celebration-title-group">
            <span className="c-celebration-pill">
              <Icon name="verified" size={14} /> Assessment Battery Fully Completed
            </span>
            <h1 id="celebration-title" className="c-h1 c-celebration-h1">
              Outstanding Milestone, {profile.name || 'Candidate'}!
            </h1>
            <p className="c-celebration-lead">
              You have completed all <strong>{totalItems} behavioral items</strong> across all 5 psychometric modules.
              Your multi-dimensional evidence profile is calibrated and ready for comprehensive evaluation.
            </p>
          </div>
        </div>

        {/* Tab navigation between Overview & Module Verification */}
        <div className="c-celebration-tab-bar">
          <button
            type="button"
            className={`c-celebration-tab-btn ${activeTab === 'overview' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Icon name="insights" size={16} /> Achievement Summary
          </button>
          <button
            type="button"
            className={`c-celebration-tab-btn ${activeTab === 'modules' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('modules')}
          >
            <Icon name="fact_check" size={16} /> 5-Module Verification (100%)
          </button>
        </div>

        {/* Content Section: Overview */}
        {activeTab === 'overview' && (
          <div className="c-stack" style={{ gap: '14px', marginTop: '12px' }}>
            {/* 4 Pillar Grid */}
            <div className="c-celebration-grid">
              <div className="c-celebration-stat-card">
                <div className="c-celebration-stat-icon" style={{ color: '#1e6b3c', background: '#d8f0df' }}>
                  <Icon name="quiz" size={20} />
                </div>
                <div>
                  <div className="c-celebration-stat-num">{answeredCount}/{totalItems} Items</div>
                  <div className="c-celebration-stat-label">Full Battery Recorded</div>
                  <div className="c-caption" style={{ marginTop: '3px' }}>
                    100% of self-descriptions logged without omissions.
                  </div>
                </div>
              </div>

              <div className="c-celebration-stat-card">
                <div className="c-celebration-stat-icon" style={{ color: '#133e87', background: '#d9eafa' }}>
                  <Icon name="psychology" size={20} />
                </div>
                <div>
                  <div className="c-celebration-stat-num">(A, E, C) | U</div>
                  <div className="c-celebration-stat-label">No Forced Collapse</div>
                  <div className="c-caption" style={{ marginTop: '3px' }}>
                    Retains genuine multidimensional aptitude, engagement, and context.
                  </div>
                </div>
              </div>

              <div className="c-celebration-stat-card">
                <div className="c-celebration-stat-icon" style={{ color: '#8a5a00', background: '#fbe7c2' }}>
                  <Icon name="account_tree" size={20} />
                </div>
                <div>
                  <div className="c-celebration-stat-num">{pathwaySet?.pathways?.length ?? 6} Pathways</div>
                  <div className="c-celebration-stat-label">Criterion Mapped</div>
                  <div className="c-caption" style={{ marginTop: '3px' }}>
                    Multiple plausible trajectories with trade-offs and growth edges.
                  </div>
                </div>
              </div>

              <div className="c-celebration-stat-card">
                <div className="c-celebration-stat-icon" style={{ color: '#385ca6', background: '#ebf5ff' }}>
                  <Icon name="lock" size={20} />
                </div>
                <div>
                  <div className="c-celebration-stat-num">Private &amp; Secure</div>
                  <div className="c-celebration-stat-label">Client-Side Device Only</div>
                  <div className="c-caption" style={{ marginTop: '3px' }}>
                    Zero tracking, zero cloud leaks. Candidate ID: {candidateId(api.view)}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Pathway Highlight Preview */}
            {topPathway && (
              <div className="c-celebration-pathway-callout">
                <div className="c-row" style={{ gap: '10px' }}>
                  <div className="c-avatar c-avatar-sm" style={{ background: 'var(--primary-container)', color: '#ffffff' }}>
                    <Icon name="star" size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="c-caption" style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                      Leading Trajectory Match
                    </div>
                    <strong style={{ fontSize: '15px', color: 'var(--primary)' }}>
                      {topPathway.name}
                    </strong>
                    <p className="c-caption" style={{ margin: '2px 0 0', color: 'var(--on-surface-variant)' }}>
                      {topPathway.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="c-btn c-btn-secondary c-btn-sm"
                    onClick={() => {
                      onClose();
                      onExplorePathways();
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Section: 5-Module Breakdown */}
        {activeTab === 'modules' && (
          <div className="c-celebration-modules-list" style={{ marginTop: '12px' }}>
            {MODULES.map((mod, idx) => {
              const modItems = items.filter((_, itemIdx) => {
                if (idx === 0) return itemIdx < 3;
                if (idx === 1) return itemIdx >= 3 && itemIdx < 7;
                if (idx === 2) return itemIdx >= 7 && itemIdx < 11;
                if (idx === 3) return itemIdx >= 11 && itemIdx < 15;
                return itemIdx >= 15;
              });

              return (
                <div key={idx} className="c-celebration-module-row">
                  <div className="c-celebration-mod-num">
                    <Icon name="check_circle" size={18} className="c-text-success" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="c-row">
                      <strong className="c-strong" style={{ fontSize: '14px' }}>
                        Module {idx + 1}: {mod.title}
                      </strong>
                      <span className="c-tag-done">
                        <Icon name="check" size={12} /> {modItems.length}/{modItems.length} Complete
                      </span>
                    </div>
                    <p className="c-caption" style={{ margin: '2px 0 0' }}>
                      {MODULE_DESCRIPTIONS[idx]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Call-to-action Footer Bar */}
        <div className="c-celebration-footer">
          <div className="c-celebration-footer-note">
            <Icon name="assignment_turned_in" size={16} />
            <span>Your complete Results Dossier is ready for review, export, and planning.</span>
          </div>

          <div className="c-celebration-actions">
            <button
              type="button"
              className="c-btn c-btn-secondary"
              onClick={onClose}
            >
              <Icon name="dashboard" size={16} /> Dashboard
            </button>

            <button
              type="button"
              className="c-btn c-btn-secondary"
              onClick={() => {
                onClose();
                onExplorePathways();
              }}
            >
              <Icon name="account_tree" size={16} /> Career Pathways
            </button>

            <button
              type="button"
              className="c-btn c-btn-primary c-celebration-primary-btn"
              onClick={() => {
                onClose();
                onReviewDossier();
              }}
            >
              <Icon name="assignment_turned_in" size={18} />
              <span>Review Results Dossier</span>
              <Icon name="arrow_forward" size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
