import { useState, type ReactNode } from 'react';
import type { SessionApi } from '../state/runtime.ts';
import { Icon } from './icons.tsx';
import {
  batteryOrder,
  candidateId,
  exportDossierJson,
  exportDossierMarkdown,
  formatDate,
  latestAnswers,
  strengths,
  type Profile,
} from './shared.tsx';

export function DossierCard(props: { api: SessionApi; profile: Profile }): ReactNode {
  const { api, profile } = props;
  const items = batteryOrder(api.catalog.items);
  const answers = latestAnswers(api.view);
  const representations = api.view.representations;
  const signals = api.view.signals;
  const candidateRef = candidateId(api.view);
  const candidateStrengths = strengths(api.view, items);

  const [activeTab, setActiveTab] = useState<'summary' | 'representations' | 'uncertainty'>('summary');

  return (
    <div className="c-stack-lg">
      {/* Dossier Certificate Header */}
      <section className="c-card c-card-highlight">
        <div className="c-row c-top">
          <div>
            <div className="c-row" style={{ justifyContent: 'flex-start', gap: '8px', marginBottom: '6px' }}>
              <span className="c-tag">
                <Icon name="assignment_turned_in" size={14} /> Official Psychometric Dossier
              </span>
              <span className="c-chip c-chip-met">
                <Icon name="verified" size={12} /> Non-Scalar Model Validated
              </span>
            </div>
            <h1 className="c-h1">Evaluation Dossier for {profile.name || 'Candidate'}</h1>
            <p className="c-body-sm">
              Standardized psychological evidence collection decomposed into <strong>(A, E, C) | U</strong> structural representations without forced scalar ranking.
            </p>
          </div>

          <div className="c-stat" style={{ textAlign: 'right', minWidth: '130px' }}>
            <strong style={{ fontSize: '18px', fontFamily: 'var(--mono)' }}>{candidateRef}</strong>
            <span>Candidate Ref</span>
            <div className="c-caption">{formatDate(new Date().toISOString())}</div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="c-rule" />
        <div className="c-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div className="c-segmented-control">
            <button
              type="button"
              className={activeTab === 'summary' ? 'is-active' : ''}
              onClick={() => setActiveTab('summary')}
            >
              <Icon name="insights" size={16} /> Summary &amp; Strengths
            </button>
            <button
              type="button"
              className={activeTab === 'representations' ? 'is-active' : ''}
              onClick={() => setActiveTab('representations')}
            >
              <Icon name="hub" size={16} /> (A, E, C) Representations ({representations.length})
            </button>
            <button
              type="button"
              className={activeTab === 'uncertainty' ? 'is-active' : ''}
              onClick={() => setActiveTab('uncertainty')}
            >
              <Icon name="psychology" size={16} /> Uncertainty Profile
            </button>
          </div>

          <div className="c-row" style={{ gap: '8px' }}>
            <button
              type="button"
              className="c-btn c-btn-secondary"
              onClick={() => exportDossierMarkdown(api.view, profile)}
              title="Download human-readable markdown dossier"
            >
              <Icon name="description" size={16} /> Markdown
            </button>
            <button
              type="button"
              className="c-btn c-btn-primary"
              onClick={() => exportDossierJson(api.view, profile)}
              title="Download structured JSON machine record"
            >
              <Icon name="download" size={16} /> Export JSON
            </button>
          </div>
        </div>
      </section>

      {/* Summary View */}
      {activeTab === 'summary' && (
        <div className="c-stack-lg">
          <div className="c-grid-2">
            <section className="c-card">
              <h2 className="c-h2">Empirical Behavioral Observations</h2>
              <p className="c-caption" style={{ marginBottom: '12px' }}>
                {answers.size} of {items.length} standardized assessment items answered.
              </p>
              <div className="c-stack" style={{ gap: '8px' }}>
                {items.slice(0, 8).map((it, idx) => {
                  const sig = answers.get(it.itemRef);
                  return (
                    <div
                      key={it.itemRef}
                      className="c-row"
                      style={{
                        padding: '8px 10px',
                        background: 'var(--surface-lowest)',
                        border: '1px solid var(--surface-dim)',
                        borderRadius: '4px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="c-caption c-strong">Item {idx + 1}: {it.constructs[0]?.label}</span>
                        <div className="c-caption" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {it.promptText}
                        </div>
                      </div>
                      <span className="c-chip c-chip-met" style={{ fontSize: '11px' }}>
                        {sig ? 'Logged' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="c-card">
              <h2 className="c-h2">Demonstrated Affinities &amp; Strengths</h2>
              <p className="c-caption" style={{ marginBottom: '12px' }}>
                Constructs with highest self-reported endorsement across standardized matrix.
              </p>
              <div className="c-stack" style={{ gap: '8px' }}>
                {candidateStrengths.map((str, idx) => (
                  <div
                    key={idx}
                    className="c-row"
                    style={{
                      padding: '8px 10px',
                      background: 'var(--surface-lowest)',
                      border: '1px solid var(--surface-dim)',
                      borderRadius: '4px',
                    }}
                  >
                    <div>
                      <strong className="c-strong">{str.label}</strong>
                    </div>
                    <span className="c-match-pill">{str.percent}%</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Full 1:3 (A, E, C) | U Representation Matrix */}
      {activeTab === 'representations' && (
        <section className="c-card">
          <h2 className="c-h2">(A, E, C) | U Decomposed Representations</h2>
          <p className="c-body-sm" style={{ marginBottom: '14px' }}>
            Pipeline invariant: every raw signal S0 decomposes 1:3 into Assessment (A), Evidence (E), Context (C) with explicit Uncertainty (U).
          </p>

          <div className="c-table-responsive">
            <table className="c-table">
              <thead>
                <tr>
                  <th>Signal Ref</th>
                  <th>Construct</th>
                  <th>A (Assessment)</th>
                  <th>E (Evidence Provenance)</th>
                  <th>C (Context)</th>
                  <th>U (Uncertainty)</th>
                </tr>
              </thead>
              <tbody>
                {representations.map((rep) => (
                  <tr key={rep.id}>
                    <td className="c-mono-sm">{rep.signalId}</td>
                    <td>
                      <strong>{rep.A.constructs[0]?.label ?? 'Construct'}</strong>
                      <div className="c-caption">{rep.A.constructs[0]?.kind ?? 'Factor'}</div>
                    </td>
                    <td>
                      <span className="c-chip c-chip-met">{rep.A.response.kind}</span>
                      <div className="c-caption">{rep.A.instrument.promptText}</div>
                    </td>
                    <td>
                      <div className="c-mono-sm">{rep.E.primaryEvidenceId}</div>
                      <div className="c-caption">{rep.E.bundle.length} bundle record(s)</div>
                    </td>
                    <td>
                      <div className="c-caption">{rep.C.kind || 'Standard Context'}</div>
                    </td>
                    <td>
                      <span className="c-mono-sm">v{rep.U.profileVersion}</span>
                      <div className="c-caption">{rep.U.coverage}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Uncertainty View */}
      {activeTab === 'uncertainty' && (
        <section className="c-card">
          <h2 className="c-h2">Explicit Uncertainty &amp; Boundary Conditions</h2>
          <p className="c-body-sm" style={{ marginBottom: '14px' }}>
            In accordance with the 107 Invariants, uncertainty is never obscured or averaged out.
          </p>

          <div className="c-grid-2">
            <div className="c-card c-card-compact">
              <Icon name="contrast" size={24} />
              <h3 className="c-h3" style={{ marginTop: '6px' }}>Observation Count</h3>
              <p className="c-body-sm">{signals.length} recorded behavioral signals.</p>
              <div className="c-caption">Confidence intervals tighten as evidence signals accumulate across domains.</div>
            </div>

            <div className="c-card c-card-compact">
              <Icon name="lock" size={24} />
              <h3 className="c-h3" style={{ marginTop: '6px' }}>Verification Boundaries</h3>
              <p className="c-body-sm">Zero Forced Classification</p>
              <div className="c-caption">No candidate is categorized into a single persona or universal ranking.</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
