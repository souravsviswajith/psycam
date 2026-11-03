import { useState, type ReactNode } from 'react';
import type { SessionApi } from '../state/runtime.ts';
import { Icon } from './icons.tsx';
import {
  MODULES,
  batteryOrder,
  latestAnswers,
  moduleIndex,
  type Profile,
} from './shared.tsx';

export function Registration(props: {
  questionCount: number;
  onSubmit: (profile: Profile) => void;
}): ReactNode {
  const [name, setName] = useState('');
  const [context, setContext] = useState('exploring new career directions');
  const [degree, setDegree] = useState('');
  const [institution, setInstitution] = useState('');

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    props.onSubmit({
      name: name.trim() || 'Candidate',
      setting: 'studying',
      careerStage: context,
      education: degree && institution ? [{ degree, institution, year: '2025' }] : [],
      qualifications: [],
      workHistory: [],
      skills: [],
      projects: [],
      achievements: [],
      interests: [],
      constraints: [],
      userEvidence: [],
      planItems: [],
    });
  };

  return (
    <div className="c-screen c-center" style={{ maxWidth: '480px', margin: '40px auto' }}>
      <section className="c-card c-card-highlight">
        <div className="c-row" style={{ marginBottom: '8px' }}>
          <span className="c-tag">
            <Icon name="account_balance" size={14} /> Career Assessment 107
          </span>
          <span className="c-chip c-chip-met">
            <Icon name="lock" size={12} /> Local-First Storage
          </span>
        </div>

        <h1 className="c-h1">Welcome to Career Intelligence</h1>
        <p className="c-body-sm" style={{ marginBottom: '16px' }}>
          A criterion-referenced psychometric assessment preserving multi-dimensional structural facets without forced scalar score reduction.
        </p>

        <form onSubmit={handleSubmit} className="c-stack" style={{ gap: '12px' }}>
          <div className="c-field">
            <label className="c-label" htmlFor="candidate-name">Candidate Name</label>
            <input
              id="candidate-name"
              className="c-input"
              value={name}
              placeholder="e.g. Alex Morgan"
              required
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="c-field">
            <label className="c-label" htmlFor="candidate-context">Current Career Stage</label>
            <select
              id="candidate-context"
              className="c-input"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            >
              <option value="exploring new career directions">Exploring new career directions</option>
              <option value="university student / recent graduate">University student / Recent graduate</option>
              <option value="mid-career professional transition">Mid-career professional transition</option>
              <option value="returning to workforce">Returning to workforce</option>
              <option value="seeking leadership / specialized mastery">Seeking leadership / Specialized mastery</option>
            </select>
          </div>

          <div className="c-grid-2">
            <div className="c-field">
              <label className="c-label" htmlFor="candidate-degree">Highest Degree (Optional)</label>
              <input
                id="candidate-degree"
                className="c-input"
                value={degree}
                placeholder="e.g. B.Sc. Computing"
                onChange={(e) => setDegree(e.target.value)}
              />
            </div>
            <div className="c-field">
              <label className="c-label" htmlFor="candidate-inst">Institution (Optional)</label>
              <input
                id="candidate-inst"
                className="c-input"
                value={institution}
                placeholder="e.g. University College"
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>
          </div>

          <div className="c-banner c-banner-warning" style={{ marginTop: '8px' }}>
            <Icon name="info" size={18} />
            <div>
              <strong>Candidate Privacy Guarantee</strong>
              <div className="c-caption">
                All data remains on your local browser device. The assessment battery comprises {props.questionCount} standardized items across 5 core domains.
              </div>
            </div>
          </div>

          <button type="submit" className="c-btn c-btn-primary c-btn-block" style={{ marginTop: '14px' }}>
            Begin Assessment Battery <Icon name="arrow_forward" size={18} />
          </button>
        </form>
      </section>
    </div>
  );
}

export function Syllabus(props: {
  api: SessionApi;
  onItem: (index: number) => void;
}): ReactNode {
  const items = batteryOrder(props.api.catalog.items);
  const answers = latestAnswers(props.api.view);

  return (
    <div className="c-stack-lg">
      <section className="c-card c-card-highlight">
        <span className="c-tag">
          <Icon name="menu_book" size={14} /> Scope & Assessment Syllabus
        </span>
        <h1 className="c-h1">19-Item Diagnostic Instrument Battery</h1>
        <p className="c-body-sm">
          Standardized psychometric inventory spanning 5 orthogonal behavioral modules. You may inspect or review any item directly.
        </p>
      </section>

      {MODULES.map((mod, modIdx) => {
        const modItems = items
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => moduleIndex(item) === modIdx);

        const modAnswered = modItems.filter(({ item }) => answers.has(item.itemRef)).length;

        return (
          <section key={modIdx} className="c-card">
            <div className="c-row">
              <div>
                <span className="c-tag c-tag-soft">Module {modIdx + 1}</span>
                <h2 className="c-h2" style={{ marginTop: '4px' }}>{mod.title}</h2>
              </div>
              <span className="c-mono-sm c-strong">
                {modAnswered}/{modItems.length} Complete
              </span>
            </div>

            <div className="c-bar" style={{ margin: '12px 0 16px' }}>
              <div style={{ width: `${modItems.length > 0 ? (modAnswered / modItems.length) * 100 : 0}%` }} />
            </div>

            <div className="c-stack" style={{ gap: '8px' }}>
              {modItems.map(({ item, index }) => {
                const isAnswered = answers.has(item.itemRef);
                return (
                  <div
                    key={item.itemRef}
                    className="c-row"
                    style={{
                      padding: '10px 14px',
                      background: 'var(--surface-lowest)',
                      border: '1px solid var(--surface-dim)',
                      borderRadius: '6px',
                    }}
                  >
                    <div className="c-row" style={{ gap: '10px', flex: 1, minWidth: 0 }}>
                      <span className="c-mono c-caption" style={{ minWidth: '48px' }}>
                        Item {index + 1}
                      </span>
                      <span className="c-body-sm" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.promptText}
                      </span>
                    </div>

                    <div className="c-row" style={{ gap: '8px' }}>
                      {isAnswered ? (
                        <span className="c-tag-done">
                          <Icon name="check" size={12} /> Recorded
                        </span>
                      ) : (
                        <span className="c-caption" style={{ color: 'var(--on-surface-variant)' }}>
                          Pending
                        </span>
                      )}
                      <button
                        type="button"
                        className="c-btn c-btn-secondary c-btn-sm"
                        onClick={() => props.onItem(index)}
                      >
                        {isAnswered ? 'Review' : 'Answer'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
