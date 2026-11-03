import { useState, type ReactNode } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Icon } from './icons.tsx';
import type { SessionApi } from '../state/runtime.ts';
import {
  MODULES,
  batteryOrder,
  latestAnswers,
  moduleIndex,
} from './shared.tsx';

interface AssessmentProgressChartProps {
  api: SessionApi;
  onOpenItem: (index: number) => void;
  onNavigate: (tab: 'dashboard' | 'profile' | 'assess' | 'pathways' | 'plan' | 'dossier' | 'syllabus') => void;
  onCelebrate?: () => void;
}

type ChartViewMode = 'all' | 'gauge' | 'breakdown';

export function AssessmentProgressChart({
  api,
  onOpenItem,
  onNavigate,
  onCelebrate,
}: AssessmentProgressChartProps): ReactNode {
  const [viewMode, setViewMode] = useState<ChartViewMode>('all');
  const items = batteryOrder(api.catalog.items);
  const answers = latestAnswers(api.view);
  const totalItems = items.length;
  const answeredCount = answers.size;
  const remainingCount = Math.max(0, totalItems - answeredCount);
  const percent = totalItems > 0 ? Math.round((answeredCount / totalItems) * 100) : 0;

  // Find next unanswered item index
  const firstOpenIndex = items.findIndex((it) => !answers.has(it.itemRef));
  const resumeIndex = firstOpenIndex < 0 ? 0 : firstOpenIndex;
  const nextItem = items[resumeIndex];

  // Colors aligned with Academic Prestige design system
  const COMPLETED_COLOR = '#133e87'; // primary-hover / dark authoritative blue
  const REMAINING_COLOR = '#cbdceb'; // surface-dim / ledger soft blue-gray
  const ACCENT_COLOR = '#1e6b3c';    // success green for completed states

  // Donut chart dataset
  const pieData = totalItems === 0
    ? [{ name: 'No Items', value: 1, fill: REMAINING_COLOR }]
    : answeredCount === 0
      ? [{ name: 'Remaining', value: totalItems, fill: REMAINING_COLOR }]
      : [
          { name: 'Completed', value: answeredCount, fill: percent === 100 ? ACCENT_COLOR : COMPLETED_COLOR },
          { name: 'Remaining', value: remainingCount, fill: REMAINING_COLOR },
        ];

  // Module level breakdown dataset
  const moduleShortNames = [
    'Interests',
    'Values',
    'Work Style',
    'Skills',
    'Constraints',
  ];

  const moduleData = MODULES.map((mod, idx) => {
    const itemsInMod = items.filter((candidate) => moduleIndex(candidate) === idx);
    const modTotal = itemsInMod.length;
    const modCompleted = itemsInMod.filter((candidate) => answers.has(candidate.itemRef)).length;
    const modRemaining = Math.max(0, modTotal - modCompleted);
    const modPercent = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0;

    return {
      id: `mod-${idx}`,
      name: mod.title,
      shortName: moduleShortNames[idx] ?? `M${idx + 1}`,
      moduleNumber: idx + 1,
      total: modTotal,
      completed: modCompleted,
      remaining: modRemaining,
      percent: modPercent,
    };
  });

  // Calculate unique measured constructs so far
  const uniqueConstructsCount = new Set(
    Array.from(answers.keys()).flatMap((itemRef) => {
      const match = items.find((it) => it.itemRef === itemRef);
      return match ? match.constructs.map((c) => c.label) : [];
    })
  ).size;

  // Assessment status label
  const statusLabel =
    percent === 100
      ? 'Fully Calibrated'
      : percent >= 75
        ? 'Final Section'
        : percent >= 40
          ? 'Well Underway'
          : percent > 0
            ? 'In Progress'
            : 'Not Started';

  const statusClass =
    percent === 100
      ? 'c-chip-completed'
      : percent > 0
        ? 'c-chip-in-progress'
        : 'c-chip-planned';

  return (
    <section className="c-card" aria-label="Assessment Progress Tracking">
      {/* Header with Title and Mode Switcher */}
      <div className="c-row" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="c-row" style={{ justifyContent: 'flex-start', gap: '8px', marginBottom: '4px' }}>
            <span className="c-tag">
              <Icon name="donut_large" size={14} /> Progress Intelligence
            </span>
            <span className={`c-chip ${statusClass}`}>
              <Icon name={percent === 100 ? 'check_circle' : 'timelapse'} size={12} /> {statusLabel}
            </span>
          </div>
          <h2 className="c-h2">Assessment Completion Matrix</h2>
          <p className="c-body-sm">
            Tracking completed items across 5 core psychometric modules without scalar reduction.
          </p>
        </div>

        {/* View Toggle */}
        <div className="c-row" style={{ gap: '4px', background: 'var(--surface-low)', padding: '3px', borderRadius: '4px' }}>
          <button
            type="button"
            className={`c-btn c-btn-sm ${viewMode === 'all' ? 'c-btn-secondary' : 'c-btn-ghost'}`}
            style={{ padding: '4px 10px', fontSize: '13px' }}
            onClick={() => setViewMode('all')}
          >
            Combined
          </button>
          <button
            type="button"
            className={`c-btn c-btn-sm ${viewMode === 'gauge' ? 'c-btn-secondary' : 'c-btn-ghost'}`}
            style={{ padding: '4px 10px', fontSize: '13px' }}
            onClick={() => setViewMode('gauge')}
          >
            Completion Gauge
          </button>
          <button
            type="button"
            className={`c-btn c-btn-sm ${viewMode === 'breakdown' ? 'c-btn-secondary' : 'c-btn-ghost'}`}
            style={{ padding: '4px 10px', fontSize: '13px' }}
            onClick={() => setViewMode('breakdown')}
          >
            By Module
          </button>
        </div>
      </div>

      <div className="c-rule" />

      {/* 100% Milestone Celebration Callout */}
      {percent === 100 && (
        <div
          className="c-row"
          style={{
            background: '#fdf8ed',
            border: '1px solid rgba(212, 175, 55, 0.45)',
            borderLeft: '4px solid #d4af37',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div className="c-row" style={{ gap: '10px' }}>
            <span className="c-celebration-pill" style={{ margin: 0 }}>
              <Icon name="verified" size={14} /> 100% Calibrated
            </span>
            <span className="c-body-sm c-strong" style={{ color: 'var(--primary)' }}>
              All {totalItems} items completed! Criterion-referenced Results Dossier is ready.
            </span>
          </div>
          {onCelebrate && (
            <button
              type="button"
              className="c-btn c-celebration-primary-btn c-btn-sm"
              onClick={onCelebrate}
            >
              <Icon name="star" size={14} /> View Milestone Celebration
            </button>
          )}
        </div>
      )}

      {/* Main Visual Tracking Charts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            viewMode === 'all'
              ? 'repeat(auto-fit, minmax(300px, 1fr))'
              : '1fr',
          gap: '24px',
          alignItems: 'center',
          marginTop: '8px',
        }}
      >
        {/* Left: Overall Completion Gauge (Donut Chart) */}
        {(viewMode === 'all' || viewMode === 'gauge') && (
          <div
            style={{
              background: 'var(--surface-lowest)',
              padding: '16px',
              borderRadius: '4px',
              border: '1px solid var(--ledger)',
            }}
          >
            <div className="c-row" style={{ marginBottom: '8px' }}>
              <strong className="c-strong" style={{ fontSize: '14px' }}>
                Overall Assessment Gauge
              </strong>
              <span className="c-mono-sm c-strong" style={{ color: percent === 100 ? 'var(--success)' : 'var(--primary-hover)' }}>
                {percent}%
              </span>
            </div>

            <div style={{ position: 'relative', height: '200px', width: '100%' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={answeredCount > 0 && remainingCount > 0 ? 3 : 0}
                    dataKey="value"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`pie-cell-${idx}`} fill={entry.fill} stroke="var(--surface-lowest)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [
                      `${val} items (${Math.round((Number(val) / (totalItems || 1)) * 100)}%)`,
                      String(name),
                    ]}
                    contentStyle={{
                      background: 'var(--primary)',
                      color: '#ffffff',
                      borderRadius: '4px',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Central Stat Readout */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  lineHeight: 1.1,
                }}
              >
                <div
                  style={{
                    fontSize: '30px',
                    fontWeight: 700,
                    color: percent === 100 ? 'var(--success)' : 'var(--primary)',
                    fontFamily: 'var(--serif)',
                  }}
                >
                  {percent}%
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--on-surface-variant)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginTop: '2px',
                  }}
                >
                  {answeredCount} / {totalItems} Done
                </div>
              </div>
            </div>

            {/* Donut Legend */}
            <div
              className="c-row"
              style={{
                justifyContent: 'center',
                gap: '16px',
                marginTop: '4px',
                fontSize: '12px',
              }}
            >
              <div className="c-row" style={{ gap: '6px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: percent === 100 ? ACCENT_COLOR : COMPLETED_COLOR,
                    display: 'inline-block',
                  }}
                />
                <span>Completed: <strong>{answeredCount}</strong></span>
              </div>
              <div className="c-row" style={{ gap: '6px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: REMAINING_COLOR,
                    display: 'inline-block',
                  }}
                />
                <span>Remaining: <strong>{remainingCount}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Right: Module-Level Breakdown Stacked Bar Chart */}
        {(viewMode === 'all' || viewMode === 'breakdown') && (
          <div
            style={{
              background: 'var(--surface-lowest)',
              padding: '16px',
              borderRadius: '4px',
              border: '1px solid var(--ledger)',
            }}
          >
            <div className="c-row" style={{ marginBottom: '8px' }}>
              <strong className="c-strong" style={{ fontSize: '14px' }}>
                Progress by Battery Module
              </strong>
              <span className="c-caption">5 Psychometric Domains</span>
            </div>

            <div style={{ height: '200px', width: '100%' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={moduleData}
                  layout="vertical"
                  margin={{ top: 6, right: 20, left: 10, bottom: 6 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5edf5" />
                  <XAxis
                    type="number"
                    domain={[0, 'dataMax']}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    tick={{ fontSize: 12, fill: '#1e293b' }}
                    width={82}
                  />
                  <Tooltip
                    formatter={(val, name, entry) => {
                      const payload = entry?.payload as typeof moduleData[number] | undefined;
                      const count = Number(val);
                      const total = payload?.total ?? 1;
                      return [
                        `${count} of ${total} items (${Math.round((count / total) * 100)}%)`,
                        String(name),
                      ];
                    }}
                    labelFormatter={(label) => {
                      const mod = moduleData.find((m) => m.shortName === label);
                      return mod ? `${mod.name} (Module ${mod.moduleNumber})` : String(label);
                    }}
                    contentStyle={{
                      background: 'var(--primary)',
                      color: '#ffffff',
                      borderRadius: '4px',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Bar
                    dataKey="completed"
                    stackId="a"
                    fill={COMPLETED_COLOR}
                    name="Completed"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="remaining"
                    stackId="a"
                    fill={REMAINING_COLOR}
                    name="Remaining"
                    radius={[0, 3, 3, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Legend */}
            <div
              className="c-row"
              style={{
                justifyContent: 'center',
                gap: '16px',
                marginTop: '4px',
                fontSize: '12px',
              }}
            >
              <div className="c-row" style={{ gap: '6px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: COMPLETED_COLOR,
                    display: 'inline-block',
                  }}
                />
                <span>Completed Items</span>
              </div>
              <div className="c-row" style={{ gap: '6px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: REMAINING_COLOR,
                    display: 'inline-block',
                  }}
                />
                <span>Pending Items</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Module Quick-Pills Breakdown Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px',
          marginTop: '16px',
        }}
      >
        {moduleData.map((mod) => (
          <div
            key={mod.id}
            style={{
              padding: '8px 10px',
              borderRadius: '4px',
              background: mod.completed === mod.total && mod.total > 0 ? 'var(--success-container)' : 'var(--surface-low)',
              border: '1px solid var(--ledger)',
            }}
          >
            <div className="c-row" style={{ marginBottom: '4px' }}>
              <span className="c-caption" style={{ fontWeight: 600 }}>
                {mod.shortName}
              </span>
              <span className="c-mono-sm">
                {mod.completed}/{mod.total}
              </span>
            </div>
            <div className="c-meter" style={{ height: '4px' }}>
              <div
                className="c-meter-fill"
                style={{
                  width: `${mod.percent}%`,
                  background: mod.completed === mod.total ? 'var(--success)' : 'var(--primary-hover)',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Summary Strip & Action CTAs */}
      <div
        className="c-row"
        style={{
          marginTop: '16px',
          paddingTop: '14px',
          borderTop: '1px solid var(--ledger)',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'space-between',
        }}
      >
        <div className="c-row" style={{ gap: '16px', flexWrap: 'wrap' }}>
          <div className="c-caption">
            <strong>{totalItems}</strong> Total Battery Items
          </div>
          <div className="c-caption">
            <strong>{answeredCount}</strong> Logged Responses
          </div>
          <div className="c-caption">
            <strong>{remainingCount}</strong> Remaining
          </div>
          <div className="c-caption">
            <strong>{uniqueConstructsCount}</strong> Active Constructs Mapped
          </div>
          {remainingCount > 0 && (
            <div className="c-caption" style={{ color: 'var(--secondary)' }}>
              <Icon name="schedule" size={14} /> Est. ~{Math.ceil(remainingCount * 0.75)} min to finish
            </div>
          )}
        </div>

        <div className="c-row" style={{ gap: '8px' }}>
          {answeredCount === totalItems && onCelebrate && (
            <button
              type="button"
              className="c-btn c-celebration-primary-btn"
              onClick={onCelebrate}
            >
              <Icon name="star" size={16} /> Celebration Milestone
            </button>
          )}

          <button
            type="button"
            className="c-btn c-btn-secondary"
            onClick={() => onNavigate('syllabus')}
          >
            <Icon name="menu_book" size={16} /> Syllabus Details
          </button>

          <button
            type="button"
            className="c-btn c-btn-primary"
            onClick={() => {
              if (answeredCount === totalItems) {
                onNavigate('dossier');
              } else {
                onOpenItem(resumeIndex);
              }
            }}
          >
            {answeredCount === 0
              ? 'Begin Assessment'
              : answeredCount === totalItems
                ? 'View Results Dossier'
                : `Resume at Item ${resumeIndex + 1}${nextItem?.constructs[0]?.label ? `: ${nextItem.constructs[0].label}` : ''}`}
            <Icon name="arrow_forward" size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
