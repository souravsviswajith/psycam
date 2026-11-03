import { useState, type ReactNode } from 'react';
import { Icon } from './icons.tsx';
import type { PlanItem, Profile } from './shared.tsx';
import type { SessionApi } from '../state/runtime.ts';
import type { PathwayCandidate } from '../api/types.ts';

interface DevelopmentPlanProps {
  api: SessionApi;
  profile: Profile;
  onUpdateProfile: (updated: Profile) => void;
  onExplorePathway?: (pathwayId: string) => void;
}

export function DevelopmentPlan({ api, profile, onUpdateProfile, onExplorePathway }: DevelopmentPlanProps): ReactNode {
  const [filterKind, setFilterKind] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New item form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newKind, setNewKind] = useState<PlanItem['kind']>('learning-activity');
  const [newPathwayId, setNewPathwayId] = useState<string>('');
  const [newGap, setNewGap] = useState('');

  const items = profile.planItems ?? [];
  const latestPathwaySet = api.view.pathwaySets[api.view.pathwaySets.length - 1];
  const pathways: readonly PathwayCandidate[] = latestPathwaySet?.pathways ?? [];

  // FR-021: Progress metrics distinguishing user-confirmed from suggestions
  const totalItems = items.length;
  const completedConfirmed = items.filter((i) => i.status === 'completed' && i.userConfirmedCompleted).length;
  const inProgress = items.filter((i) => i.status === 'in-progress').length;
  const planned = items.filter((i) => i.status === 'planned').length;
  const suggestions = items.filter((i) => i.isSuggestion).length;
  const completionPercent = totalItems === 0 ? 0 : Math.round((completedConfirmed / totalItems) * 100);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: PlanItem = {
      id: `plan-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      kind: newKind,
      status: 'planned',
      targetPathwayId: newPathwayId || undefined,
      tiedGapOrConstruct: newGap.trim() || undefined,
      userConfirmedCompleted: false,
      isSuggestion: false,
      order: items.length + 1,
    };

    onUpdateProfile({
      ...profile,
      planItems: [...items, newItem],
    });

    setNewTitle('');
    setNewDesc('');
    setNewPathwayId('');
    setNewGap('');
    setIsAdding(false);
  };

  const handleUpdateStatus = (id: string, status: PlanItem['status']) => {
    const next = items.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        status,
        userConfirmedCompleted: status === 'completed' ? true : false,
      };
    });
    onUpdateProfile({ ...profile, planItems: next });
  };

  const handleToggleConfirmed = (id: string) => {
    const next = items.map((item) => {
      if (item.id !== id) return item;
      const isConfirmed = !item.userConfirmedCompleted;
      return {
        ...item,
        userConfirmedCompleted: isConfirmed,
        status: isConfirmed ? ('completed' as const) : item.status,
      };
    });
    onUpdateProfile({ ...profile, planItems: next });
  };

  const handleDeleteItem = (id: string) => {
    const next = items.filter((item) => item.id !== id);
    onUpdateProfile({ ...profile, planItems: next });
  };

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const next = [...items];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved!);
    onUpdateProfile({ ...profile, planItems: next.map((it, i) => ({ ...it, order: i + 1 })) });
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filterKind !== 'all' && item.kind !== filterKind) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="c-stack-lg">
      {/* Header Banner */}
      <section className="c-card c-card-highlight">
        <div className="c-row c-top">
          <div>
            <span className="c-tag">
              <Icon name="assignment" size={14} /> Development Planning (FR-019 – FR-021)
            </span>
            <h1 className="c-h1">Personal Career Development Plan</h1>
            <p className="c-body-sm">
              Translate selected goals and identified requirements into editable learning activities, projects, and portfolio milestones.
              Progress metrics distinguish completed user-confirmed actions from suggestions.
            </p>
          </div>
          <button
            type="button"
            className="c-btn c-btn-primary"
            onClick={() => setIsAdding(true)}
          >
            <Icon name="add" size={18} /> Add Plan Action
          </button>
        </div>

        {/* Progress & Distinction Tally (FR-021) */}
        <div className="c-benchmarks" style={{ marginTop: '16px' }}>
          <div className="c-stat">
            <strong style={{ color: 'var(--success)' }}>{completedConfirmed}</strong>
            <span>User Confirmed Done</span>
          </div>
          <div className="c-stat">
            <strong style={{ color: 'var(--secondary)' }}>{inProgress}</strong>
            <span>In Progress</span>
          </div>
          <div className="c-stat">
            <strong>{planned}</strong>
            <span>Planned</span>
          </div>
          <div className="c-stat">
            <strong style={{ color: 'var(--amber)' }}>{suggestions}</strong>
            <span>System Suggestions</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '16px' }}>
          <div className="c-row" style={{ marginBottom: '6px' }}>
            <span className="c-label">Execution Progress</span>
            <span className="c-mono-sm c-strong">{completionPercent}% Confirmed Complete</span>
          </div>
          <div className="c-meter" role="progressbar" aria-valuenow={completionPercent} aria-valuemin={0} aria-valuemax={100}>
            <div className="c-meter-fill" style={{ width: `${completionPercent}%` }} />
          </div>
        </div>
      </section>

      {/* Filter Controls */}
      <div className="c-card c-card-compact">
        <div className="c-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div className="c-row" style={{ gap: '6px' }}>
            <span className="c-label" style={{ marginRight: '4px' }}>Type:</span>
            {(['all', 'learning-activity', 'project', 'portfolio-evidence', 'milestone'] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                className={`c-btn-pill ${filterKind === kind ? 'is-active' : ''}`}
                onClick={() => setFilterKind(kind)}
              >
                {kind === 'all' ? 'All Types' : kind.replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="c-row" style={{ gap: '6px' }}>
            <span className="c-label" style={{ marginRight: '4px' }}>Status:</span>
            {(['all', 'planned', 'in-progress', 'completed', 'deferred'] as const).map((status) => (
              <button
                key={status}
                type="button"
                className={`c-btn-pill ${filterStatus === status ? 'is-active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? 'All Status' : status.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Plan Items List */}
      <div className="c-stack">
        {filteredItems.length === 0 ? (
          <section className="c-card c-empty-state">
            <Icon name="assignment" size={40} />
            <h2 className="c-h2">No plan items match current filters</h2>
            <p className="c-body-sm">Create actionable milestones to develop capabilities for your targeted career directions.</p>
            <button type="button" className="c-btn c-btn-primary" onClick={() => setIsAdding(true)}>
              <Icon name="add" size={18} /> Create New Action
            </button>
          </section>
        ) : (
          filteredItems.map((item, idx) => {
            const targetPathway = pathways.find((p) => p.pathwayId === item.targetPathwayId);
            return (
              <section key={item.id} className={`c-card c-plan-card c-plan-${item.status}`}>
                <div className="c-row c-top">
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
                    {/* Confirmation Checkbox (FR-021) */}
                    <button
                      type="button"
                      className={`c-plan-checkbox ${item.userConfirmedCompleted ? 'is-checked' : ''}`}
                      title={item.userConfirmedCompleted ? 'Confirmed Completed by User' : 'Click to confirm completion'}
                      onClick={() => handleToggleConfirmed(item.id)}
                    >
                      {item.userConfirmedCompleted && <Icon name="check" size={16} />}
                    </button>

                    <div style={{ flex: 1 }}>
                      <div className="c-row" style={{ justifyContent: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                        <span className="c-badge">{item.kind.replace('-', ' ')}</span>
                        {item.isSuggestion ? (
                          <span className="c-chip c-chip-open">
                            <Icon name="insights" size={12} /> Suggestion
                          </span>
                        ) : (
                          <span className="c-chip c-chip-met">
                            <Icon name="verified" size={12} /> User Defined
                          </span>
                        )}
                        {item.userConfirmedCompleted && (
                          <span className="c-tag-done">
                            <Icon name="check_circle" size={12} /> Confirmed Complete
                          </span>
                        )}
                      </div>

                      <h3 className={`c-h3 ${item.status === 'completed' ? 'c-line-through' : ''}`}>
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="c-body-sm" style={{ marginTop: '4px' }}>
                          {item.description}
                        </p>
                      )}

                      {/* Associated Pathway or Gap metadata */}
                      <div className="c-row" style={{ marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        {targetPathway && (
                          <button
                            type="button"
                            className="c-link-button"
                            onClick={() => onExplorePathway?.(targetPathway.pathwayId)}
                          >
                            <Icon name="account_tree" size={14} /> Targeted: {targetPathway.name}
                          </button>
                        )}
                        {item.tiedGapOrConstruct && (
                          <span className="c-caption">
                            Addresses gap: <code>{item.tiedGapOrConstruct}</code>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions / Status transitions / Reordering (FR-020) */}
                  <div className="c-plan-actions">
                    <select
                      className="c-input c-input-sm"
                      value={item.status}
                      onChange={(e) => handleUpdateStatus(item.id, e.target.value as PlanItem['status'])}
                    >
                      <option value="planned">Planned</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="deferred">Deferred</option>
                    </select>

                    <div className="c-row" style={{ gap: '2px' }}>
                      <button
                        type="button"
                        className="c-icon-btn"
                        title="Move Up"
                        disabled={idx === 0}
                        onClick={() => handleReorder(item.id, 'up')}
                      >
                        <Icon name="arrow_upward" size={16} />
                      </button>
                      <button
                        type="button"
                        className="c-icon-btn"
                        title="Move Down"
                        disabled={idx === filteredItems.length - 1}
                        onClick={() => handleReorder(item.id, 'down')}
                      >
                        <Icon name="arrow_downward" size={16} />
                      </button>
                      <button
                        type="button"
                        className="c-icon-btn c-icon-btn-danger"
                        title="Delete Plan Item"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* Modal: Create Development Plan Action */}
      {isAdding && (
        <div className="c-modal-backdrop" onClick={() => setIsAdding(false)}>
          <div className="c-modal" onClick={(e) => e.stopPropagation()}>
            <div className="c-row">
              <h2 className="c-h2">Create Development Action</h2>
              <button
                type="button"
                className="c-icon-btn"
                onClick={() => setIsAdding(false)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <p className="c-body-sm">
              Tied to selected career directions or identified qualification gaps (FR-019).
            </p>
            <div className="c-rule" />

            <form onSubmit={handleAddItem} className="c-stack">
              <label className="c-field">
                <span className="c-label">Action Title *</span>
                <input
                  className="c-input"
                  required
                  placeholder="e.g. Complete practical SQL course on exploratory queries"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </label>

              <label className="c-field">
                <span className="c-label">Description / Practical Outcome</span>
                <textarea
                  className="c-input"
                  rows={3}
                  placeholder="What will be produced or demonstrated through this action?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </label>

              <div className="c-row">
                <label className="c-field" style={{ flex: 1 }}>
                  <span className="c-label">Action Kind (FR-020)</span>
                  <select
                    className="c-input"
                    value={newKind}
                    onChange={(e) => setNewKind(e.target.value as PlanItem['kind'])}
                  >
                    <option value="learning-activity">Learning Activity</option>
                    <option value="project">Applied Project</option>
                    <option value="portfolio-evidence">Portfolio Evidence</option>
                    <option value="milestone">Milestone / Review</option>
                  </select>
                </label>

                <label className="c-field" style={{ flex: 1 }}>
                  <span className="c-label">Target Direction (Optional)</span>
                  <select
                    className="c-input"
                    value={newPathwayId}
                    onChange={(e) => setNewPathwayId(e.target.value)}
                  >
                    <option value="">None / General</option>
                    {pathways.map((p) => (
                      <option key={p.pathwayId} value={p.pathwayId}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="c-field">
                <span className="c-label">Tied Requirement Gap (Optional)</span>
                <input
                  className="c-input"
                  placeholder="e.g. skill.quantitative, experience.applied-projects"
                  value={newGap}
                  onChange={(e) => setNewGap(e.target.value)}
                />
              </label>

              <div className="c-row" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="c-btn c-btn-secondary"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="c-btn c-btn-primary">
                  Save Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
