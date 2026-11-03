import { useState, type ReactNode } from 'react';
import type { PathwayCandidate, ReviewState } from '../api/types.ts';
import type { SessionApi } from '../state/runtime.ts';
import { Icon } from './icons.tsx';
import {
  DECISIONS,
  FAMILY_ICON,
  latestAnswers,
  plainReason,
  type PlanItem,
  type Profile,
} from './shared.tsx';
import { latestSet } from './Pathways.tsx';

interface QuickInsightsProps {
  api: SessionApi;
  profile: Profile;
  onOpenPathway: (id: string) => void;
  onNavigate: (tab: 'dashboard' | 'profile' | 'assess' | 'pathways' | 'plan' | 'dossier' | 'syllabus') => void;
  onOpenItem: (index: number) => void;
  onUpdateProfile?: (profile: Profile) => void;
}

export function QuickInsightsModule({
  api,
  profile,
  onOpenPathway,
  onNavigate,
  onOpenItem,
  onUpdateProfile,
}: QuickInsightsProps): ReactNode {
  const currentSet = latestSet(api);
  const pathways = currentSet?.pathways ?? [];
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | undefined>(undefined);

  // Criterion-referenced alignment sorting without scalar score collapse:
  // 1. Most supported criteria (primary)
  // 2. Fewest conflicting criteria (least ambivalent)
  // 3. Fewest gap criteria
  // 4. Higher ratio of met vs total criteria
  const filteredPathways = selectedFamily === 'all'
    ? pathways
    : pathways.filter((p) => p.family.toLowerCase() === selectedFamily.toLowerCase());

  const sortedPathways = [...filteredPathways].sort((a, b) => {
    const aSup = a.supportSummary.supported;
    const bSup = b.supportSummary.supported;
    if (bSup !== aSup) return bSup - aSup;

    const aConf = a.supportSummary.conflicting;
    const bConf = b.supportSummary.conflicting;
    if (aConf !== bConf) return aConf - bConf;

    const aGap = a.supportSummary.gap;
    const bGap = b.supportSummary.gap;
    if (aGap !== bGap) return aGap - bGap;

    const aRatio = a.supportSummary.total > 0 ? aSup / a.supportSummary.total : 0;
    const bRatio = b.supportSummary.total > 0 ? bSup / b.supportSummary.total : 0;
    return bRatio - aRatio;
  });

  const topThree = sortedPathways.slice(0, 3);
  const answersMap = latestAnswers(api.view);
  const totalAnswered = answersMap.size;
  const totalItems = api.catalog.items.length;

  // Find next unanswered question index
  const firstUnansweredIndex = api.catalog.items.findIndex((item) => !answersMap.has(item.itemRef));
  const resumeIndex = firstUnansweredIndex < 0 ? 0 : firstUnansweredIndex;

  // Check if a pathway already has a milestone in the candidate's development plan
  const hasPlanItem = (pathwayId: string): boolean => {
    return (profile.planItems ?? []).some((item) => item.targetPathwayId === pathwayId);
  };

  const handleAddToPlan = (pathway: PathwayCandidate): void => {
    if (!onUpdateProfile) return;
    if (hasPlanItem(pathway.pathwayId)) {
      setActionSuccessNotice(`A milestone for ${pathway.name} already exists in your Development Plan.`);
      setTimeout(() => setActionSuccessNotice(undefined), 3500);
      return;
    }

    // Find the first gap or unassessed requirement to target
    const targetReq = pathway.requirements.find((r) => r.status === 'gap' || r.status === 'undetermined')
      ?? pathway.requirements[0];

    const newPlanItem: PlanItem = {
      id: `plan-${Date.now()}`,
      title: `Develop foundational capability for ${pathway.name}`,
      description: targetReq ? `Address requirement: ${targetReq.statement}` : `Explore core competencies for ${pathway.name}`,
      kind: 'learning-activity',
      status: 'planned',
      targetPathwayId: pathway.pathwayId,
      tiedGapOrConstruct: targetReq?.constructId ?? pathway.family,
      userConfirmedCompleted: false,
      isSuggestion: false,
      order: (profile.planItems ?? []).length + 1,
    };

    const updatedProfile: Profile = {
      ...profile,
      planItems: [...(profile.planItems ?? []), newPlanItem],
    };

    onUpdateProfile(updatedProfile);
    setActionSuccessNotice(`Added development goal for "${pathway.name}" to your Plan!`);
    setTimeout(() => setActionSuccessNotice(undefined), 3500);
  };

  const handleReviewState = async (pathwayId: string, state: Exclude<ReviewState, 'unreviewed'>): Promise<void> => {
    const success = await api.setReview(pathwayId, state);
    if (success) {
      setActionSuccessNotice(`Marked pathway as ${state.toUpperCase()}`);
      setTimeout(() => setActionSuccessNotice(undefined), 2500);
    }
  };

  // Distinct families for filtering
  const availableFamilies = Array.from(new Set(pathways.map((p) => p.family)));

  return (
    <section className="c-card c-quick-insights-container">
      {/* Module Header */}
      <div className="c-row c-top" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <div className="c-row" style={{ justifyContent: 'flex-start', gap: '8px', marginBottom: '6px' }}>
            <span className="c-badge c-badge-insights">
              <Icon name="insights" size={15} /> QUICK INSIGHTS
            </span>
            <span className="c-tag">
              <Icon name="verified" size={13} /> Live Assessment Signals: {totalAnswered} of {totalItems}
            </span>
          </div>
          <h2 className="c-h2">Top Aligned Career Pathways</h2>
          <p className="c-body-sm" style={{ marginTop: '2px', color: 'var(--on-surface-variant)' }}>
            Real-time criterion matching based on your recent answers. Pathways with the highest satisfied capability requirements and lowest friction.
          </p>
        </div>

        {/* Filter & Jump to Pathways */}
        <div className="c-row" style={{ gap: '8px', alignItems: 'center' }}>
          {availableFamilies.length > 1 && (
            <div className="c-family-filter-bar">
              <button
                type="button"
                className={`c-family-filter-btn ${selectedFamily === 'all' ? 'is-active' : ''}`}
                onClick={() => setSelectedFamily('all')}
              >
                All Families
              </button>
              {availableFamilies.map((fam) => (
                <button
                  key={fam}
                  type="button"
                  className={`c-family-filter-btn ${selectedFamily === fam ? 'is-active' : ''}`}
                  onClick={() => setSelectedFamily(fam)}
                >
                  <Icon name={FAMILY_ICON[fam] ?? 'work'} size={14} />
                  <span>{fam}</span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            className="c-btn c-btn-secondary"
            onClick={() => onNavigate('pathways')}
            title="Browse full catalog of career pathways"
          >
            All Pathways ({pathways.length})
            <Icon name="arrow_forward" size={15} />
          </button>
        </div>
      </div>

      {actionSuccessNotice && (
        <div className="c-banner c-banner-success" style={{ marginTop: '12px' }}>
          <Icon name="check_circle" size={18} />
          <span>{actionSuccessNotice}</span>
        </div>
      )}

      <div className="c-rule" style={{ margin: '14px 0 18px' }} />

      {/* Content: Empty State or 3 Top Aligned Cards */}
      {pathways.length === 0 || totalAnswered === 0 ? (
        <div className="c-quick-insights-empty">
          <div className="c-empty-icon-circle">
            <Icon name="psychology" size={36} />
          </div>
          <div style={{ maxWidth: '520px', textAlign: 'center' }}>
            <h3 className="c-h3">Assessment Responses Needed</h3>
            <p className="c-body-sm" style={{ marginTop: '6px', color: 'var(--on-surface-variant)' }}>
              Quick Insights analyzes your specific answers to 19 criterion-referenced items to determine pathway compatibility. Complete questions in the Assessment Battery to generate your top 3 aligned pathways.
            </p>
          </div>
          <button
            type="button"
            className="c-btn c-btn-primary"
            onClick={() => onOpenItem(resumeIndex)}
            style={{ marginTop: '8px' }}
          >
            <Icon name="quiz" size={18} />
            Start Self-Description Battery
          </button>
        </div>
      ) : topThree.length === 0 ? (
        <div className="c-empty-state">
          <Icon name="filter_alt_off" size={28} />
          <p className="c-body-sm">No pathways found for the selected family filter.</p>
          <button
            type="button"
            className="c-btn c-btn-secondary"
            onClick={() => setSelectedFamily('all')}
          >
            Reset to All Families
          </button>
        </div>
      ) : (
        <div className="c-quick-insights-grid">
          {topThree.map((pathway, index) => {
            const { supported, conflicting, gap, undetermined, total } = pathway.supportSummary;
            const rankLabel = index === 0 ? '#1 Most Aligned' : index === 1 ? '#2 Strong Match' : '#3 Plausible Fit';
            const rankClass = index === 0 ? 'c-rank-primary' : index === 1 ? 'c-rank-secondary' : 'c-rank-tertiary';

            // Extract the top 2 supported requirements as concrete evidence
            const supportedReqs = pathway.requirements
              .filter((r) => r.status === 'supported')
              .slice(0, 2);

            // Extract a gap or undetermined requirement as growth context
            const growthReq = pathway.requirements.find((r) => r.status === 'gap')
              ?? pathway.requirements.find((r) => r.status === 'undetermined');

            const isPlanned = hasPlanItem(pathway.pathwayId);

            return (
              <div key={pathway.id} className={`c-insight-card ${rankClass}`}>
                {/* Card Top: Rank + Family Badge */}
                <div className="c-insight-card-header">
                  <div className="c-row" style={{ width: '100%' }}>
                    <span className="c-insight-rank-tag">
                      <Icon name={index === 0 ? 'emoji_events' : index === 1 ? 'verified' : 'auto_graph'} size={15} />
                      {rankLabel}
                    </span>

                    <span className={`c-review-badge c-review-${pathway.review.state}`}>
                      {pathway.review.state === 'unreviewed' ? 'Unreviewed' : pathway.review.state}
                    </span>
                  </div>

                  <div className="c-row" style={{ marginTop: '10px', alignItems: 'center', gap: '10px' }}>
                    <div className="c-family-icon">
                      <Icon name={FAMILY_ICON[pathway.family] ?? 'work'} size={22} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        className="c-h3 c-insight-title"
                        title={pathway.name}
                        onClick={() => onOpenPathway(pathway.pathwayId)}
                      >
                        {pathway.name}
                      </h3>
                      <div className="c-caption" style={{ textTransform: 'capitalize' }}>
                        Family: {pathway.family}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alignment Metrics Strip */}
                <div className="c-insight-metrics-strip">
                  <div className="c-row" style={{ marginBottom: '6px' }}>
                    <span className="c-caption" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      Criterion Support:
                    </span>
                    <span className="c-insight-ratio-pill">
                      <strong>{supported}</strong> of <strong>{total}</strong> verified
                    </span>
                  </div>

                  {/* Visual Segmented Progress Bar */}
                  <div className="c-segmented-meter" title={`${supported} met, ${gap} gaps, ${conflicting} mixed, ${undetermined} undetermined`}>
                    <div
                      className="c-seg-fill c-seg-met"
                      style={{ width: `${total > 0 ? (supported / total) * 100 : 0}%` }}
                    />
                    <div
                      className="c-seg-fill c-seg-conflict"
                      style={{ width: `${total > 0 ? (conflicting / total) * 100 : 0}%` }}
                    />
                    <div
                      className="c-seg-fill c-seg-gap"
                      style={{ width: `${total > 0 ? (gap / total) * 100 : 0}%` }}
                    />
                  </div>

                  {/* Status counts pills */}
                  <div className="c-row" style={{ marginTop: '8px', gap: '4px', flexWrap: 'wrap' }}>
                    <span className="c-mini-stat c-stat-met">
                      <Icon name="check_circle" size={12} /> {supported} Met
                    </span>
                    {gap > 0 && (
                      <span className="c-mini-stat c-stat-gap">
                        <Icon name="cancel" size={12} /> {gap} {gap === 1 ? 'Gap' : 'Gaps'}
                      </span>
                    )}
                    {conflicting > 0 && (
                      <span className="c-mini-stat c-stat-conflict">
                        <Icon name="contrast" size={12} /> {conflicting} Mixed
                      </span>
                    )}
                    {undetermined > 0 && (
                      <span className="c-mini-stat c-stat-open">
                        <Icon name="pending" size={12} /> {undetermined} Open
                      </span>
                    )}
                  </div>
                </div>

                {/* Evidence & Alignment Rationale */}
                <div className="c-insight-evidence-box">
                  <div className="c-caption" style={{ fontWeight: 600, color: 'var(--primary-container)', marginBottom: '4px' }}>
                    <Icon name="fact_check" size={13} /> Why this direction aligns:
                  </div>

                  {supportedReqs.length > 0 ? (
                    <ul className="c-insight-req-list">
                      {supportedReqs.map((req) => (
                        <li key={req.requirementId} className="c-insight-req-item">
                          <strong className="c-strong" style={{ fontSize: '13px' }}>{req.statement}</strong>
                          <p className="c-caption" style={{ margin: '2px 0 0', color: 'var(--on-surface-variant)' }}>
                            {plainReason(req)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="c-caption" style={{ margin: 0, fontStyle: 'italic', color: 'var(--on-surface-variant)' }}>
                      Initial alignment from baseline criteria. Continue battery to log explicit supporting observations.
                    </p>
                  )}

                  {/* Growth Edge / Actionable Opportunity */}
                  {growthReq && (
                    <div className="c-insight-growth-edge">
                      <div className="c-row" style={{ gap: '6px', justifyContent: 'flex-start' }}>
                        <span className={growthReq.status === 'gap' ? 'c-icon-warn' : 'c-icon-info'}>
                          <Icon
                            name={growthReq.status === 'gap' ? 'flag' : 'tips_and_updates'}
                            size={13}
                          />
                        </span>
                        <span className="c-caption" style={{ fontWeight: 600 }}>
                          {growthReq.status === 'gap' ? 'Capability Gap to Address:' : 'Exploration Opportunity:'}
                        </span>
                      </div>
                      <p className="c-caption" style={{ margin: '2px 0 0', color: 'var(--on-surface)' }}>
                        {growthReq.statement}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Decision Review Actions */}
                <div className="c-insight-decision-row">
                  <span className="c-caption" style={{ fontWeight: 600 }}>Status:</span>
                  <div className="c-row" style={{ gap: '4px', flexWrap: 'wrap' }}>
                    {DECISIONS.slice(0, 3).map((dec) => {
                      const isSelected = pathway.review.state === dec.state;
                      return (
                        <button
                          key={dec.state}
                          type="button"
                          className={`c-decision-mini-btn ${isSelected ? 'is-active' : ''}`}
                          disabled={api.busy}
                          title={dec.hint}
                          onClick={() => handleReviewState(pathway.pathwayId, dec.state)}
                        >
                          {isSelected && <Icon name="check" size={11} />}
                          {dec.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer CTAs */}
                <div className="c-insight-card-footer">
                  <button
                    type="button"
                    className="c-btn c-btn-primary c-btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => onOpenPathway(pathway.pathwayId)}
                  >
                    Deep Dive Pathway
                    <Icon name="arrow_forward" size={15} />
                  </button>

                  {onUpdateProfile && (
                    <button
                      type="button"
                      className={`c-btn c-btn-sm ${isPlanned ? 'c-btn-secondary' : 'c-btn-outline'}`}
                      onClick={() => handleAddToPlan(pathway)}
                      title={isPlanned ? 'Milestone already in plan' : 'Add capability development goal to Plan'}
                    >
                      <Icon name={isPlanned ? 'task_alt' : 'playlist_add'} size={15} />
                      {isPlanned ? 'In Plan' : '+ Plan Goal'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Epistemic Non-Scalar Guarantee Notice */}
      <div className="c-insight-footer-notice">
        <div className="c-row" style={{ gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--secondary)', flexShrink: 0, marginTop: '2px' }}>
            <Icon name="balance" size={18} />
          </span>
          <div style={{ flex: 1 }}>
            <strong className="c-strong" style={{ fontSize: '13px' }}>
              Explainable Criterion-Referenced Methodology:
            </strong>
            <span className="c-caption" style={{ marginLeft: '6px', color: 'var(--on-surface-variant)' }}>
              Career Assessment 107 ranks alignment through discrete, verifiable criteria satisfaction rather than an opaque percentage fit score. You retain complete agency over your career direction.
            </span>
          </div>

          <button
            type="button"
            className="c-link"
            style={{ whiteSpace: 'nowrap', fontSize: '12px' }}
            onClick={() => onNavigate('syllabus')}
          >
            Review Assessment Scope
            <Icon name="chevron_right" size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
