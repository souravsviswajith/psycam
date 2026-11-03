import { useState, type ReactNode } from 'react';
import { Icon } from './icons.tsx';
import {
  SETTING_OPTIONS,
  STAGE_OPTIONS,
  type Profile,
  type UserEvidence,
  type EducationEntry,
  type WorkHistoryEntry,
  type ProjectEntry,
} from './shared.tsx';

interface ProfileWorkspaceProps {
  profile: Profile;
  onUpdate: (updated: Profile) => void;
}

export function ProfileWorkspace({ profile, onUpdate }: ProfileWorkspaceProps): ReactNode {
  const [activeSection, setActiveSection] = useState<'profile' | 'evidence' | 'qualifications' | 'history'>('profile');
  
  // Evidence modal state
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const [evDesc, setEvDesc] = useState('');
  const [evSource, setEvSource] = useState('');
  const [evClaim, setEvClaim] = useState('');
  const [evDate, setEvDate] = useState('');
  const [evCategory, setEvCategory] = useState<UserEvidence['category']>('skill');
  const [evVerified, setEvVerified] = useState(false);

  // New item inputs
  const [newSkill, setNewSkill] = useState('');
  const [newDegree, setNewDegree] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [newEduYear, setNewEduYear] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newOrg, setNewOrg] = useState('');
  const [newPeriod, setNewPeriod] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const evidenceList = profile.userEvidence ?? [];
  const verifiedCount = evidenceList.filter((e) => e.verified).length;
  const unverifiedCount = evidenceList.filter((e) => !e.verified).length;

  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evDesc.trim() || !evSource.trim() || !evClaim.trim()) return;

    const newEntry: UserEvidence = {
      id: `ev-${Date.now()}`,
      description: evDesc.trim(),
      sourceRef: evSource.trim(),
      supportedClaim: evClaim.trim(),
      dateKnown: evDate.trim() || new Date().toISOString().split('T')[0],
      category: evCategory,
      verified: evVerified,
    };

    onUpdate({
      ...profile,
      userEvidence: [...evidenceList, newEntry],
    });

    setEvDesc('');
    setEvSource('');
    setEvClaim('');
    setEvDate('');
    setEvVerified(false);
    setIsAddingEvidence(false);
  };

  const handleRemoveEvidence = (id: string) => {
    onUpdate({
      ...profile,
      userEvidence: evidenceList.filter((e) => e.id !== id),
    });
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const skills = [...(profile.skills ?? [])];
    if (!skills.includes(newSkill.trim())) {
      skills.push(newSkill.trim());
      onUpdate({ ...profile, skills });
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    onUpdate({
      ...profile,
      skills: (profile.skills ?? []).filter((s) => s !== skill),
    });
  };

  const handleAddEducation = () => {
    if (!newDegree.trim() || !newInstitution.trim()) return;
    const edu: EducationEntry = {
      degree: newDegree.trim(),
      institution: newInstitution.trim(),
      year: newEduYear.trim() || undefined,
    };
    onUpdate({
      ...profile,
      education: [...(profile.education ?? []), edu],
    });
    setNewDegree('');
    setNewInstitution('');
    setNewEduYear('');
  };

  const handleRemoveEducation = (index: number) => {
    const next = [...(profile.education ?? [])];
    next.splice(index, 1);
    onUpdate({ ...profile, education: next });
  };

  const handleAddWork = () => {
    if (!newRole.trim() || !newOrg.trim()) return;
    const work: WorkHistoryEntry = {
      role: newRole.trim(),
      organization: newOrg.trim(),
      period: newPeriod.trim() || undefined,
    };
    onUpdate({
      ...profile,
      workHistory: [...(profile.workHistory ?? []), work],
    });
    setNewRole('');
    setNewOrg('');
    setNewPeriod('');
  };

  const handleRemoveWork = (index: number) => {
    const next = [...(profile.workHistory ?? [])];
    next.splice(index, 1);
    onUpdate({ ...profile, workHistory: next });
  };

  const handleAddProject = () => {
    if (!newProjectName.trim()) return;
    const proj: ProjectEntry = {
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'Applied practical initiative',
    };
    onUpdate({
      ...profile,
      projects: [...(profile.projects ?? []), proj],
    });
    setNewProjectName('');
    setNewProjectDesc('');
  };

  const handleRemoveProject = (index: number) => {
    const next = [...(profile.projects ?? [])];
    next.splice(index, 1);
    onUpdate({ ...profile, projects: next });
  };

  return (
    <div className="c-stack-lg">
      {/* Top Banner / Heading */}
      <section className="c-card c-card-highlight">
        <div className="c-row c-top">
          <div>
            <span className="c-tag">
              <Icon name="badge" size={14} /> Profile & Evidence Repository (FR-001 – FR-008)
            </span>
            <h1 className="c-h1">Candidate Profile & Grounded Evidence</h1>
            <p className="c-body-sm">
              Organize qualifications, work history, skills, and attach verifiable evidence records. Claims and self-descriptions
              remain distinguished from verified third-party records.
            </p>
          </div>
          <button
            type="button"
            className="c-btn c-btn-primary"
            onClick={() => setIsAddingEvidence(true)}
          >
            <Icon name="add" size={18} /> Attach Evidence
          </button>
        </div>

        {/* Evidence Tally Chips */}
        <div className="c-benchmarks" style={{ marginTop: '16px' }}>
          <div className="c-stat">
            <strong>{evidenceList.length}</strong>
            <span>Total Records</span>
          </div>
          <div className="c-stat">
            <strong style={{ color: 'var(--success)' }}>{verifiedCount}</strong>
            <span>Verified Credentials</span>
          </div>
          <div className="c-stat">
            <strong style={{ color: 'var(--amber)' }}>{unverifiedCount}</strong>
            <span>Self-Report Claims</span>
          </div>
          <div className="c-stat">
            <strong>{(profile.skills ?? []).length}</strong>
            <span>Recorded Skills</span>
          </div>
        </div>
      </section>

      {/* Material Gap / Information Warning (FR-008) */}
      {unverifiedCount > 0 && (
        <div className="c-banner c-banner-warning" role="region" aria-label="Evidence status notice">
          <Icon name="warning" size={20} />
          <div>
            <strong>FR-008 Transparency Notice:</strong> {unverifiedCount} self-reported claim(s) do not yet carry external
            validation references. Career direction requirements will treat unverified observations as hypotheses to test.
          </div>
        </div>
      )}

      {/* Tab Selector */}
      <div className="c-segmented-control" role="tablist">
        <button
          type="button"
          className={activeSection === 'profile' ? 'is-active' : ''}
          onClick={() => setActiveSection('profile')}
        >
          <Icon name="account_box" size={18} /> Basic Profile & Context
        </button>
        <button
          type="button"
          className={activeSection === 'evidence' ? 'is-active' : ''}
          onClick={() => setActiveSection('evidence')}
        >
          <Icon name="fact_check" size={18} /> Evidence Records ({evidenceList.length})
        </button>
        <button
          type="button"
          className={activeSection === 'qualifications' ? 'is-active' : ''}
          onClick={() => setActiveSection('qualifications')}
        >
          <Icon name="school" size={18} /> Education & Skills
        </button>
        <button
          type="button"
          className={activeSection === 'history' ? 'is-active' : ''}
          onClick={() => setActiveSection('history')}
        >
          <Icon name="history" size={18} /> Experience & Projects
        </button>
      </div>

      {/* SECTION 1: Basic Profile & Context */}
      {activeSection === 'profile' && (
        <div className="c-grid-2">
          <section className="c-card">
            <h2 className="c-h2">Personal Information</h2>
            <div className="c-rule" />
            <div className="c-stack">
              <label className="c-field">
                <span className="c-label">Full Name</span>
                <input
                  className="c-input"
                  value={profile.name}
                  onChange={(e) => onUpdate({ ...profile, name: e.target.value })}
                  placeholder="Candidate name"
                />
              </label>
              <label className="c-field">
                <span className="c-label">Email (Optional)</span>
                <input
                  className="c-input"
                  value={profile.email ?? ''}
                  onChange={(e) => onUpdate({ ...profile, email: e.target.value })}
                  placeholder="e.g. candidate@university.edu"
                />
              </label>
            </div>
          </section>

          <section className="c-card">
            <h2 className="c-h2">Declared Career Context</h2>
            <div className="c-rule" />
            <div className="c-stack">
              <div className="c-field">
                <span className="c-label">Current Situation</span>
                <div className="c-pills">
                  {SETTING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={profile.setting === opt.value ? 'is-active' : ''}
                      onClick={() => onUpdate({ ...profile, setting: opt.value })}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="c-field">
                <span className="c-label">Career Stage</span>
                <div className="c-pills">
                  {STAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={profile.careerStage === opt.value ? 'is-active' : ''}
                      onClick={() => onUpdate({ ...profile, careerStage: opt.value })}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* SECTION 2: Evidence Records (FR-005, FR-006, FR-007) */}
      {activeSection === 'evidence' && (
        <section className="c-card">
          <div className="c-row">
            <div>
              <h2 className="c-h2">Attached Evidence & Citations</h2>
              <p className="c-body-sm">
                Primary documentation supporting claims, experience, and capability assertions.
              </p>
            </div>
            <button
              type="button"
              className="c-btn c-btn-secondary"
              onClick={() => setIsAddingEvidence(true)}
            >
              <Icon name="add" size={16} /> Add Record
            </button>
          </div>
          <div className="c-rule" />

          {evidenceList.length === 0 ? (
            <div className="c-empty-state">
              <Icon name="description" size={36} />
              <p className="c-body">No evidence records attached yet.</p>
              <button
                type="button"
                className="c-btn c-btn-primary"
                onClick={() => setIsAddingEvidence(true)}
              >
                Attach First Evidence Record
              </button>
            </div>
          ) : (
            <div className="c-table-responsive">
              <table className="c-table">
                <thead>
                  <tr>
                    <th>Evidence Item</th>
                    <th>Category</th>
                    <th>Claim Supported</th>
                    <th>Source / Reference</th>
                    <th>Date</th>
                    <th>Verification</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {evidenceList.map((ev) => (
                    <tr key={ev.id}>
                      <td>
                        <strong className="c-strong">{ev.description}</strong>
                      </td>
                      <td>
                        <span className="c-badge">{ev.category}</span>
                      </td>
                      <td>{ev.supportedClaim}</td>
                      <td>
                        <code className="c-mono-sm">{ev.sourceRef}</code>
                      </td>
                      <td>{ev.dateKnown ?? '—'}</td>
                      <td>
                        {ev.verified ? (
                          <span className="c-chip c-chip-met">
                            <Icon name="check_circle" size={14} /> Verified Fact
                          </span>
                        ) : (
                          <span className="c-chip c-chip-open">
                            <Icon name="pending" size={14} /> User Assertion
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="c-icon-btn c-icon-btn-danger"
                          title="Remove evidence"
                          onClick={() => handleRemoveEvidence(ev.id)}
                        >
                          <Icon name="close" size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* SECTION 3: Education & Skills */}
      {activeSection === 'qualifications' && (
        <div className="c-grid-2">
          {/* Skills */}
          <section className="c-card">
            <h2 className="c-h2">Skills & Competencies</h2>
            <p className="c-body-sm">Capabilities identified through practice, coursework, or self-report.</p>
            <div className="c-rule" />

            <div className="c-row" style={{ marginBottom: '12px' }}>
              <input
                className="c-input"
                placeholder="e.g. Statistical Analysis, SQL, React"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
              />
              <button type="button" className="c-btn c-btn-primary" onClick={handleAddSkill}>
                Add
              </button>
            </div>

            <div className="c-chip-group">
              {(profile.skills ?? []).map((skill) => (
                <span key={skill} className="c-tag-pill">
                  {skill}
                  <button type="button" onClick={() => handleRemoveSkill(skill)}>
                    ×
                  </button>
                </span>
              ))}
              {(profile.skills ?? []).length === 0 && (
                <p className="c-caption">No skills listed yet.</p>
              )}
            </div>
          </section>

          {/* Education */}
          <section className="c-card">
            <h2 className="c-h2">Education & Credentials</h2>
            <p className="c-body-sm">Formal study and degree programs.</p>
            <div className="c-rule" />

            <div className="c-stack" style={{ marginBottom: '14px' }}>
              <input
                className="c-input"
                placeholder="Degree / Program (e.g. B.S. in Computer Science)"
                value={newDegree}
                onChange={(e) => setNewDegree(e.target.value)}
              />
              <div className="c-row">
                <input
                  className="c-input"
                  placeholder="Institution name"
                  value={newInstitution}
                  onChange={(e) => setNewInstitution(e.target.value)}
                />
                <input
                  className="c-input"
                  placeholder="Year"
                  style={{ width: '90px' }}
                  value={newEduYear}
                  onChange={(e) => setNewEduYear(e.target.value)}
                />
                <button type="button" className="c-btn c-btn-secondary" onClick={handleAddEducation}>
                  Add
                </button>
              </div>
            </div>

            <div className="c-ledger">
              {(profile.education ?? []).map((edu, idx) => (
                <div key={idx} className="c-ledger-row">
                  <div>
                    <strong className="c-strong">{edu.degree}</strong>
                    <div className="c-caption">{edu.institution} {edu.year ? `· ${edu.year}` : ''}</div>
                  </div>
                  <button
                    type="button"
                    className="c-icon-btn"
                    onClick={() => handleRemoveEducation(idx)}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* SECTION 4: Experience & Projects */}
      {activeSection === 'history' && (
        <div className="c-grid-2">
          {/* Work History */}
          <section className="c-card">
            <h2 className="c-h2">Work History & Roles</h2>
            <p className="c-body-sm">Professional postings, internships, and volunteer roles.</p>
            <div className="c-rule" />

            <div className="c-stack" style={{ marginBottom: '14px' }}>
              <input
                className="c-input"
                placeholder="Role title (e.g. Operations Coordinator)"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              />
              <div className="c-row">
                <input
                  className="c-input"
                  placeholder="Organization / Company"
                  value={newOrg}
                  onChange={(e) => setNewOrg(e.target.value)}
                />
                <input
                  className="c-input"
                  placeholder="Period (e.g. 2024–2025)"
                  style={{ width: '130px' }}
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value)}
                />
                <button type="button" className="c-btn c-btn-secondary" onClick={handleAddWork}>
                  Add
                </button>
              </div>
            </div>

            <div className="c-ledger">
              {(profile.workHistory ?? []).map((work, idx) => (
                <div key={idx} className="c-ledger-row">
                  <div>
                    <strong className="c-strong">{work.role}</strong>
                    <div className="c-caption">{work.organization} {work.period ? `· ${work.period}` : ''}</div>
                  </div>
                  <button
                    type="button"
                    className="c-icon-btn"
                    onClick={() => handleRemoveWork(idx)}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section className="c-card">
            <h2 className="c-h2">Projects & Portfolio</h2>
            <p className="c-body-sm">Practical demonstrations of capability (FR-006).</p>
            <div className="c-rule" />

            <div className="c-stack" style={{ marginBottom: '14px' }}>
              <input
                className="c-input"
                placeholder="Project title"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
              <div className="c-row">
                <input
                  className="c-input"
                  placeholder="Brief description & impact"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                />
                <button type="button" className="c-btn c-btn-secondary" onClick={handleAddProject}>
                  Add
                </button>
              </div>
            </div>

            <div className="c-ledger">
              {(profile.projects ?? []).map((proj, idx) => (
                <div key={idx} className="c-ledger-row">
                  <div>
                    <strong className="c-strong">{proj.name}</strong>
                    <div className="c-caption">{proj.description}</div>
                  </div>
                  <button
                    type="button"
                    className="c-icon-btn"
                    onClick={() => handleRemoveProject(idx)}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Modal: Attach Evidence Record (FR-005, FR-006, FR-007) */}
      {isAddingEvidence && (
        <div className="c-modal-backdrop" onClick={() => setIsAddingEvidence(false)}>
          <div className="c-modal" onClick={(e) => e.stopPropagation()}>
            <div className="c-row">
              <h2 className="c-h2">Attach Supporting Evidence</h2>
              <button
                type="button"
                className="c-icon-btn"
                onClick={() => setIsAddingEvidence(false)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <p className="c-body-sm">
              Connect skills, credentials, and achievements to tangible sources. Verified records require third-party accreditation.
            </p>
            <div className="c-rule" />

            <form onSubmit={handleAddEvidence} className="c-stack">
              <label className="c-field">
                <span className="c-label">Evidence Title / Description *</span>
                <input
                  className="c-input"
                  required
                  placeholder="e.g. Capstone Project Repository, Certificate"
                  value={evDesc}
                  onChange={(e) => setEvDesc(e.target.value)}
                />
              </label>

              <div className="c-row">
                <label className="c-field" style={{ flex: 1 }}>
                  <span className="c-label">Category</span>
                  <select
                    className="c-input"
                    value={evCategory}
                    onChange={(e) => setEvCategory(e.target.value as UserEvidence['category'])}
                  >
                    <option value="skill">Skill</option>
                    <option value="qualification">Qualification</option>
                    <option value="education">Education</option>
                    <option value="project">Project / Portfolio</option>
                    <option value="achievement">Achievement</option>
                    <option value="work-history">Work History</option>
                  </select>
                </label>

                <label className="c-field" style={{ flex: 1 }}>
                  <span className="c-label">Date of Record</span>
                  <input
                    type="date"
                    className="c-input"
                    value={evDate}
                    onChange={(e) => setEvDate(e.target.value)}
                  />
                </label>
              </div>

              <label className="c-field">
                <span className="c-label">Source or Reference *</span>
                <input
                  className="c-input"
                  required
                  placeholder="e.g. https://github.com/..., Certificate ID, Supervisor endorsement"
                  value={evSource}
                  onChange={(e) => setEvSource(e.target.value)}
                />
              </label>

              <label className="c-field">
                <span className="c-label">Claim or Capability Supported *</span>
                <input
                  className="c-input"
                  required
                  placeholder="e.g. Demonstrates quantitative analytical method"
                  value={evClaim}
                  onChange={(e) => setEvClaim(e.target.value)}
                />
              </label>

              <label className="c-checkbox-label">
                <input
                  type="checkbox"
                  checked={evVerified}
                  onChange={(e) => setEvVerified(e.target.checked)}
                />
                <span>
                  <strong>Independent Verification Available (FR-007)</strong>
                  <div className="c-caption">
                    Check if verified by an external issuing authority or third-party observer.
                  </div>
                </span>
              </label>

              <div className="c-row" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="c-btn c-btn-secondary"
                  onClick={() => setIsAddingEvidence(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="c-btn c-btn-primary">
                  Save Evidence Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
