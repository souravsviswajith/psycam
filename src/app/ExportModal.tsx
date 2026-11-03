import { useState, type ReactNode } from 'react';
import { Icon } from './icons.tsx';
import type { SessionApi } from '../state/runtime.ts';
import {
  exportDossierJson,
  exportDossierMarkdown,
  type Profile,
} from './shared.tsx';

interface ExportModalProps {
  api: SessionApi;
  profile: Profile;
  onClose: () => void;
  onResetAll: () => void;
}

export function ExportModal({ api, profile, onClose, onResetAll }: ExportModalProps): ReactNode {
  const [tab, setTab] = useState<'export' | 'delete'>('export');
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="c-modal-backdrop" onClick={onClose}>
      <div className="c-modal c-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="c-row">
          <div>
            <h2 className="c-h2">Data Management & Dossier Export</h2>
            <div className="c-caption">Documented Export (FR-022) and Local Data Deletion (FR-023)</div>
          </div>
          <button type="button" className="c-icon-btn" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="c-segmented-control" style={{ marginTop: '14px' }}>
          <button
            type="button"
            className={tab === 'export' ? 'is-active' : ''}
            onClick={() => setTab('export')}
          >
            <Icon name="download" size={16} /> Export Dossier
          </button>
          <button
            type="button"
            className={tab === 'delete' ? 'is-active' : ''}
            onClick={() => setTab('delete')}
          >
            <Icon name="delete" size={16} /> Delete Local Data
          </button>
        </div>

        <div className="c-rule" />

        {tab === 'export' ? (
          <div className="c-stack">
            <p className="c-body-sm">
              Your career assessment records, profile data, evidence references, and development plan are preserved locally.
              You can export everything in open, portable formats without relying on external servers.
            </p>

            <div className="c-grid-2" style={{ marginTop: '10px' }}>
              <div className="c-card c-card-compact">
                <Icon name="description" size={24} />
                <h3 className="c-h3" style={{ marginTop: '6px' }}>JSON Machine Record</h3>
                <p className="c-caption">
                  Full structured JSON document including all signals, (A, E, C) representations, uncertainty profiles,
                  attached evidence, and user decision records.
                </p>
                <button
                  type="button"
                  className="c-btn c-btn-primary c-btn-block"
                  style={{ marginTop: '12px' }}
                  onClick={() => exportDossierJson(api.view, profile)}
                >
                  <Icon name="download" size={16} /> Download JSON
                </button>
              </div>

              <div className="c-card c-card-compact">
                <Icon name="menu_book" size={24} />
                <h3 className="c-h3" style={{ marginTop: '6px' }}>Markdown Report</h3>
                <p className="c-caption">
                  Human-readable dossier formatted in clean Markdown. Includes candidate context, direction summaries,
                  evidence tables, and the development plan.
                </p>
                <button
                  type="button"
                  className="c-btn c-btn-secondary c-btn-block"
                  style={{ marginTop: '12px' }}
                  onClick={() => exportDossierMarkdown(api.view, profile)}
                >
                  <Icon name="download" size={16} /> Download Markdown
                </button>
              </div>
            </div>

            <div className="c-row" style={{ marginTop: '14px' }}>
              <button
                type="button"
                className="c-btn c-btn-secondary"
                onClick={() => window.print()}
              >
                <Icon name="print" size={16} /> Print / Save PDF
              </button>
              <button type="button" className="c-btn c-btn-secondary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="c-stack">
            <div className="c-banner c-banner-warning">
              <Icon name="warning" size={20} />
              <div>
                <strong>Local Data Deletion Control (FR-023)</strong>
                <p className="c-caption" style={{ marginTop: '2px' }}>
                  This action permanently deletes all recorded answers, profile qualifications, attached evidence records,
                  and development plan milestones stored in this browser session.
                </p>
              </div>
            </div>

            <p className="c-body-sm">
              Because data is kept strictly private on your device, deletion cannot be undone. If you need a backup, please
              export your dossier first.
            </p>

            <label className="c-checkbox-label" style={{ marginTop: '10px' }}>
              <input
                type="checkbox"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
              />
              <span>I understand that this will erase all my assessment data and cannot be recovered.</span>
            </label>

            <div className="c-row" style={{ marginTop: '16px' }}>
              <button type="button" className="c-btn c-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="c-btn c-btn-danger"
                disabled={!confirmDelete}
                onClick={() => {
                  onResetAll();
                  onClose();
                }}
              >
                <Icon name="delete_forever" size={16} /> Erase All Local Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
