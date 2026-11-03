import { useState, type ReactNode } from 'react';
import type { SessionApi } from '../state/runtime.ts';
import type { PathwayCandidate, PathwayRequirement, PathwaySet } from '../api/types.ts';
import { Icon } from './icons.tsx';
import { byMatch, matchPercent, FAMILY_ICON } from './shared.tsx';

export function latestSet(api: SessionApi): PathwaySet | undefined {
  const sets = api.view.pathwaySets;
  return sets[sets.length - 1];
}

export function isStale(api: SessionApi): boolean {
  const sets = api.view.pathwaySets;
  if (sets.length === 0) return api.view.signals.length > 0;
  const latest = sets[sets.length - 1];
  return (latest?.coverage?.representationCount ?? 0) < api.view.signals.length;
}

export function PathwayList(props: {
  api: SessionApi;
  onOpen: (id: string) => void;
  onStart: () => void;
}): ReactNode {
  const currentSet = latestSet(props.api);
  const pathways = currentSet?.pathways ?? [];
  const sorted = byMatch(pathways);

  if (pathways.length === 0) {
    return (
      <section className="c-card c-empty-state">
        <Icon name="account_tree" size={40} />
        <h2 className="c-h2">No Career Pathways Mapped Yet</h2>
        <p className="c-body-sm">
          Complete self-description items in the assessment battery to map multi-dimensional criterion pathways.
        </p>
        <button type="button" className="c-btn c-btn-primary" onClick={props.onStart}>
          <Icon name="quiz" size={18} /> Begin Assessment
        </button>
      </section>
    );
  }

  return (
    <div className="c-stack-lg">
      <div className="c-grid-2">
        {sorted.map((pathway) => (
          <PathwayCard key={pathway.id} pathway={pathway} onOpen={() => props.onOpen(pathway.pathwayId)} />
        ))}
      </div>
    </div>
  );
}

function PathwayCard({ pathway, onOpen }: { pathway: PathwayCandidate; onOpen: () => void }): ReactNode {
  const percent = matchPercent(pathway);
  const icon = FAMILY_ICON[pathway.family] ?? 'account_tree';
  const review = pathway.review;

  return (
    <div className="c-card c-pathway-preview-card" onClick={onOpen}>
      <div className="c-row c-top">
        <div className="c-row" style={{ gap: '12px', alignItems: 'center' }}>
          <div className="c-family-icon">
            <Icon name={icon} size={20} />
          </div>
          <div>
            <h3 className="c-h3">{pathway.name}</h3>
            <span className="c-caption">{pathway.family} Family</span>
          </div>
        </div>
        <div className="c-row" style={{ gap: '6px' }}>
          {review && (
            <span className={`c-review-badge c-review-${review.state}`}>
              {review.state.replace('-', ' ')}
            </span>
          )}
          <span className="c-match-pill">{percent}% match</span>
        </div>
      </div>

      <p className="c-body-sm" style={{ margin: '10px 0 12px' }}>
        {pathway.description}
      </p>

      <div className="c-row c-footer">
        <span className="c-caption">
          {pathway.supportSummary.supported}/{pathway.supportSummary.total} criteria supported
        </span>
        <button type="button" className="c-link" onClick={onOpen}>
          Explore Details <Icon name="arrow_forward" size={14} />
        </button>
      </div>
    </div>
  );
}

export function PathwayDetail(props: {
  api: SessionApi;
  pathwayId: string;
  onBack: () => void;
}): ReactNode {
  const { api, pathwayId, onBack } = props;
  const currentSet = latestSet(api);
  const pathway = currentSet?.pathways?.find((p) => p.pathwayId === pathwayId);
  const [rationale, setRationale] = useState(pathway?.review?.rationale ?? '');
  const [editingRationale, setEditingRationale] = useState(false);

  if (!pathway) {
    return (
      <section className="c-card">
        <button type="button" className="c-link" onClick={onBack}>
          <Icon name="arrow_back" size={16} /> Back to Pathways
        </button>
        <h2 className="c-h2">Pathway not found</h2>
      </section>
    );
  }

  const percent = matchPercent(pathway);
  const icon = FAMILY_ICON[pathway.family] ?? 'account_tree';

  const handleReview = (state: 'interesting' | 'not-a-fit' | 'pursuing' | 'deferred'): void => {
    void api.setReview(pathway.id, state, rationale.trim() || undefined);
    setEditingRationale(false);
  };

  return (
    <div className="c-stack-lg">
      <div className="c-row">
        <button type="button" className="c-link" onClick={onBack}>
          <Icon name="arrow_back" size={16} /> All Pathways
        </button>
        <span className="c-caption">Criterion-Referenced Trajectory</span>
      </div>

      <section className="c-card c-card-highlight">
        <div className="c-row c-top">
          <div className="c-row" style={{ gap: '14px', alignItems: 'flex-start' }}>
            <div className="c-family-icon" style={{ width: '48px', height: '48px' }}>
              <Icon name={icon} size={28} />
            </div>
            <div>
              <span className="c-tag">{pathway.family} Family</span>
              <h1 className="c-h1" style={{ margin: '4px 0' }}>{pathway.name}</h1>
              <p className="c-body">{pathway.description}</p>
            </div>
          </div>
          <div className="c-stat" style={{ textAlign: 'right', minWidth: '110px' }}>
            <strong style={{ fontSize: '28px', color: 'var(--primary)' }}>{percent}%</strong>
            <span>Evidence Match</span>
            <div className="c-caption">{pathway.supportSummary.supported}/{pathway.supportSummary.total} criteria</div>
          </div>
        </div>

        {/* User Decision & Review Section (FR-019 - FR-021) */}
        <div className="c-rule" />
        <div className="c-stack" style={{ gap: '10px' }}>
          <div className="c-row">
            <span className="c-label" style={{ margin: 0 }}>
              <Icon name="fact_check" size={16} /> Your Review Decision (The User Decides)
            </span>
            {pathway.review && (
              <span className={`c-review-badge c-review-${pathway.review.state}`}>
                Status: {pathway.review.state.replace('-', ' ')}
              </span>
            )}
          </div>
          <p className="c-caption">
            The assessment engine never forces a career ranking. Record your intentional stance on this trajectory.
          </p>

          <div className="c-row" style={{ gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`c-btn ${pathway.review?.state === 'pursuing' ? 'c-btn-primary' : 'c-btn-secondary'}`}
              onClick={() => handleReview('pursuing')}
            >
              <Icon name="flag" size={16} /> Pursuing
            </button>
            <button
              type="button"
              className={`c-btn ${pathway.review?.state === 'interesting' ? 'c-btn-primary' : 'c-btn-secondary'}`}
              onClick={() => handleReview('interesting')}
            >
              <Icon name="star" size={16} /> Interesting
            </button>
            <button
              type="button"
              className={`c-btn ${pathway.review?.state === 'deferred' ? 'c-btn-primary' : 'c-btn-secondary'}`}
              onClick={() => handleReview('deferred')}
            >
              <Icon name="pending" size={16} /> Deferred
            </button>
            <button
              type="button"
              className={`c-btn ${pathway.review?.state === 'not-a-fit' ? 'c-btn-danger' : 'c-btn-secondary'}`}
              onClick={() => handleReview('not-a-fit')}
            >
              <Icon name="cancel" size={16} /> Not a Fit
            </button>
          </div>

          {editingRationale ? (
            <div className="c-stack" style={{ marginTop: '8px' }}>
              <textarea
                className="c-input c-textarea"
                rows={3}
                value={rationale}
                placeholder="Add notes, trade-offs, or personal reasons for this decision..."
                onChange={(e) => setRationale(e.target.value)}
              />
              <div className="c-row" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="c-btn c-btn-secondary" onClick={() => setEditingRationale(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="c-btn c-btn-primary"
                  onClick={() => {
                    if (pathway.review && pathway.review.state !== 'unreviewed') {
                      void api.setReview(pathway.id, pathway.review.state, rationale.trim() || undefined);
                    }
                    setEditingRationale(false);
                  }}
                >
                  Save Note
                </button>
              </div>
            </div>
          ) : (
            <div className="c-row" style={{ marginTop: '6px' }}>
              <span className="c-caption">
                {pathway.review?.rationale ? `Note: “${pathway.review.rationale}”` : 'No rationale recorded yet.'}
              </span>
              <button type="button" className="c-link" onClick={() => setEditingRationale(true)}>
                <Icon name="edit" size={14} /> {pathway.review?.rationale ? 'Edit Note' : 'Add Note'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Requirements Breakdown */}
      <section className="c-card">
        <h2 className="c-h2">Criterion Requirements Analysis</h2>
        <p className="c-body-sm" style={{ marginBottom: '14px' }}>
          Detailed mapping against verified constructs and logged self-description evidence.
        </p>

        <div className="c-stack" style={{ gap: '10px' }}>
          {pathway.requirements.map((req, idx) => (
            <RequirementRow key={idx} requirement={req} />
          ))}
        </div>
      </section>

      {/* Trade-offs & Considerations */}
      {pathway.tradeoffs && pathway.tradeoffs.length > 0 && (
        <section className="c-card">
          <h2 className="c-h2">Identified Trade-offs & Considerations</h2>
          <div className="c-stack" style={{ marginTop: '10px', gap: '8px' }}>
            {pathway.tradeoffs.map((to, idx) => (
              <div key={idx} className="c-row c-top" style={{ gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--ledger)' }}>
                <Icon name="contrast" size={18} />
                <div style={{ flex: 1 }}>
                  <strong>{to.statement}</strong>
                  <p className="c-caption" style={{ margin: '2px 0 0' }}>{to.costsWhat}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RequirementRow({ requirement }: { requirement: PathwayRequirement }): ReactNode {
  const isSupported = requirement.status === 'supported';
  const isConflicting = requirement.status === 'conflicting';
  const isGap = requirement.status === 'gap';

  const badgeClass = isSupported
    ? 'c-chip-met'
    : isConflicting
      ? 'c-chip-conflict'
      : isGap
        ? 'c-chip-gap'
        : 'c-chip-open';

  return (
    <div
      style={{
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid var(--surface-dim)',
        background: 'var(--surface-lowest)',
      }}
    >
      <div className="c-row">
        <div className="c-row" style={{ gap: '8px' }}>
          <span className={`c-chip ${badgeClass}`}>
            {isSupported && <Icon name="check" size={12} />}
            {isConflicting && <Icon name="warning" size={12} />}
            {isGap && <Icon name="cancel" size={12} />}
            <span>{requirement.status.toUpperCase()}</span>
          </span>
          <strong style={{ fontSize: '14px' }}>{requirement.statement}</strong>
        </div>
        <span className="c-caption">{requirement.kind}</span>
      </div>

      <p className="c-caption" style={{ margin: '6px 0 0', color: 'var(--on-surface-variant)' }}>
        {requirement.rationale}
      </p>

      {requirement.observations && requirement.observations.length > 0 && (
        <div className="c-caption" style={{ marginTop: '4px', color: 'var(--secondary)' }}>
          Observations: {requirement.observations.map((o) => o.value).join(', ')}
        </div>
      )}
    </div>
  );
}
