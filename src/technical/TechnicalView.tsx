import { useState, type ReactNode } from 'react';
import type { SessionApi } from '../state/runtime.ts';
import { Icon } from '../app/icons.tsx';

interface TechnicalViewProps {
  api: SessionApi;
  onClose: () => void;
}

export function TechnicalView({ api, onClose }: TechnicalViewProps): ReactNode {
  const [researchReport, setResearchReport] = useState<string | undefined>(undefined);
  const [running, setRunning] = useState(false);

  const signals = api.view.signals;
  const representations = api.view.representations;
  const pathwaySets = api.view.pathwaySets;
  const decisions = api.view.decisions;

  const handleRunResearch = async (): Promise<void> => {
    setRunning(true);
    try {
      const data = await api.runResearch();
      setResearchReport(data.report);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="c-app" style={{ minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto' }} className="c-stack-lg">
        {/* Masthead */}
        <div className="c-row" style={{ borderBottom: '1px solid var(--ledger)', paddingBottom: '16px' }}>
          <div>
            <button type="button" className="c-link" onClick={onClose} style={{ marginBottom: '8px' }}>
              <Icon name="arrow_back" size={16} /> Return to Desktop Workspace
            </button>
            <h1 className="c-h1">Career Assessment 107 · Technical Projection</h1>
            <p className="c-body-sm" style={{ fontFamily: 'var(--mono)' }}>
              0<sub>User</sub> → 1:3<sub>Infrastructure</sub> → Information → 0<sub>User</sub> · <strong>The User Decides</strong>
            </p>
          </div>
          <span className="c-tag">
            <Icon name="terminal" size={14} /> Invariants Engine v2.0
          </span>
        </div>

        {/* 1:3 Pipeline Architecture Invariant Banner */}
        <section className="c-card c-card-highlight">
          <h2 className="c-h2">Pipeline &amp; Representation Invariants</h2>
          <div className="c-mono-sm" style={{ padding: '10px 14px', background: 'var(--surface-low)', borderRadius: '6px', margin: '10px 0' }}>
            Pipeline: I_t → S_0 → S_1 → S_2 → S_3 → S_4 → O_t → I_(t+1)
            <br />
            Model: x_i → (A_i, E_i, C_i) | U_i
          </div>
          <div className="c-grid-2">
            <div className="c-card c-card-compact">
              <strong>Invariant 1: Non-Scalar Representation</strong>
              <div className="c-caption">
                (A, E, C) | U structural facets are preserved. Career pathways are criterion-referenced and never collapsed into a single forced scalar score.
              </div>
            </div>
            <div className="c-card c-card-compact">
              <strong>Invariant 2: Decision Authority</strong>
              <div className="c-caption">
                The user owns their trajectory review records. The system provides decision-support evidence, not automated destiny assignment.
              </div>
            </div>
          </div>
        </section>

        {/* Live Inspection Stats */}
        <div className="c-grid-2">
          <section className="c-card">
            <h3 className="c-h3">Current Session Counters</h3>
            <div className="c-row" style={{ marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div className="c-stat">
                <strong>{signals.length}</strong>
                <span>S0 Signals</span>
              </div>
              <div className="c-stat">
                <strong>{representations.length}</strong>
                <span>(A,E,C)|U Reps</span>
              </div>
              <div className="c-stat">
                <strong>{pathwaySets.length}</strong>
                <span>Pathway Sets</span>
              </div>
              <div className="c-stat">
                <strong>{decisions.length}</strong>
                <span>User Decisions</span>
              </div>
            </div>
          </section>

          <section className="c-card">
            <h3 className="c-h3">Research Parity Verification</h3>
            <p className="c-caption" style={{ margin: '8px 0 12px' }}>
              Execute committed research fixture parity checks to confirm reproducible mathematical behavior.
            </p>
            <button
              type="button"
              className="c-btn c-btn-primary"
              disabled={running}
              onClick={() => void handleRunResearch()}
            >
              <Icon name="science" size={16} /> {running ? 'Running Parity Checks...' : 'Run Research Parity Checks'}
            </button>
          </section>
        </div>

        {/* Research Report Output */}
        {researchReport && (
          <section className="c-card">
            <h2 className="c-h2">Research Verification Report</h2>
            <pre
              className="c-mono-sm"
              style={{
                marginTop: '10px',
                padding: '14px',
                background: 'var(--surface-low)',
                borderRadius: '6px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {researchReport}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
}
