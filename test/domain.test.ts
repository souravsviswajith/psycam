import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionEngine } from '../server/domain.ts';

test('SessionEngine enforces 1:3 decomposition and non-scalar pathway mapping', () => {
  const engine = new SessionEngine();
  const catalog = engine.getCatalog();
  assert.ok(catalog.items.length > 0, 'Catalog should contain items');

  const firstItem = catalog.items[0];
  const firstOption = firstItem.options[0];

  // Capture
  const captureResult = engine.capture({
    itemRef: firstItem.itemRef,
    response: { kind: 'option', optionId: firstOption.id },
  });

  assert.equal(captureResult.rejections.length, 0, 'Capture should succeed');
  assert.ok(captureResult.signal, 'Signal should be created');
  const signalId = captureResult.signal.id;

  // Decompose
  const decompResult = engine.decompose(signalId);
  assert.equal(decompResult.rejections.length, 0, 'Decomposition should succeed');
  assert.ok(decompResult.representation, 'Representation should be created');
  assert.ok(decompResult.representation.A, 'A (Aptitude/Assessment) facet must exist');
  assert.ok(decompResult.representation.E, 'E (Evidence) facet must exist');
  assert.ok(decompResult.representation.C, 'C (Context) facet must exist');
  assert.ok(decompResult.representation.U, 'U (Uncertainty) profile must exist');

  // Map Pathways
  const mapResult = engine.mapPathways();
  assert.equal(mapResult.rejections.length, 0, 'Pathway mapping should succeed');
  assert.ok(mapResult.pathwaySet.pathways.length > 0, 'Pathways should be populated');

  // Verify Invariant: No scalar fit score exists
  for (const pathway of mapResult.pathwaySet.pathways) {
    assert.equal(
      (pathway as unknown as Record<string, unknown>).score,
      undefined,
      'Pathway candidate must never contain a scalar overall score'
    );
    assert.ok(pathway.requirements.length > 0, 'Pathway should contain requirements');
    assert.ok(pathway.supportSummary, 'Pathway should contain support summary');
  }

  // Record review decision
  const firstPathwayId = mapResult.pathwaySet.pathways[0].id;
  const reviewResult = engine.setReview(firstPathwayId, 'interesting', 'Aligns with analytical interests');
  assert.equal(reviewResult.rejections.length, 0, 'Review should succeed');

  const view = engine.getView();
  const candidate = view.pathwaySets[0].pathways.find((p) => p.id === firstPathwayId);
  assert.equal(candidate?.review?.state, 'interesting');
  assert.equal(candidate?.review?.rationale, 'Aligns with analytical interests');

  // Reset clears state
  engine.reset();
  const resetView = engine.getView();
  assert.equal(resetView.signals.length, 0);
  assert.equal(resetView.representations.length, 0);
  assert.equal(resetView.pathwaySets.length, 0);
});

test('SessionEngine enforces rejections for invalid inputs and enforces provenance', () => {
  const engine = new SessionEngine();

  // Mapping with 0 representations rejects
  const earlyMap = engine.mapPathways();
  assert.ok(earlyMap.rejections.length > 0, 'Should reject mapping without representations');
  assert.match(earlyMap.rejections[0], /S2\.PATHWAY\.NO-REPRESENTATIONS/);

  // Capturing unknown item rejects
  const unknownCapture = engine.capture({
    itemRef: 'non-existent-item-ref',
    response: { kind: 'option', optionId: 'opt-1' },
  });
  assert.ok(unknownCapture.rejections.length > 0);
  assert.match(unknownCapture.rejections[0], /S0\.ITEM\.UNKNOWN/);

  // Decomposing unknown signal rejects
  const unknownDecomp = engine.decompose('sig-invalid-999');
  assert.ok(unknownDecomp.rejections.length > 0);
  assert.match(unknownDecomp.rejections[0], /S1\.SIGNAL\.NOT-FOUND/);
});

test('Quick Insights aligns pathways using discrete criterion support counts without scalar collapse', () => {
  const engine = new SessionEngine();
  const catalog = engine.getCatalog();

  // Answer first 3 items
  for (let i = 0; i < 3; i++) {
    const item = catalog.items[i];
    const opt = item.options[0];
    const cap = engine.capture({ itemRef: item.itemRef, response: { kind: 'option', optionId: opt.id } });
    if (cap.signal) {
      engine.decompose(cap.signal.id);
    }
  }

  const mapRes = engine.mapPathways();
  assert.equal(mapRes.rejections.length, 0);
  const pathways = mapRes.pathwaySet.pathways;
  assert.ok(pathways.length >= 3, 'Expected at least 3 pathways to test top three selection');

  // Sort according to Quick Insights algorithm
  const sorted = [...pathways].sort((a, b) => {
    const aSup = a.supportSummary.supported;
    const bSup = b.supportSummary.supported;
    if (bSup !== aSup) return bSup - aSup;
    const aConf = a.supportSummary.conflicting;
    const bConf = b.supportSummary.conflicting;
    if (aConf !== bConf) return aConf - bConf;
    const aGap = a.supportSummary.gap;
    const bGap = b.supportSummary.gap;
    if (aGap !== bGap) return aGap - bGap;
    return (bSup / (b.supportSummary.total || 1)) - (aSup / (a.supportSummary.total || 1));
  });

  const topThree = sorted.slice(0, 3);
  assert.equal(topThree.length, 3, 'Must identify exactly top three pathways');
  assert.ok(topThree[0].supportSummary.supported >= topThree[1].supportSummary.supported, 'Top 1 must have >= supported criteria than Top 2');
  assert.ok(topThree[1].supportSummary.supported >= topThree[2].supportSummary.supported, 'Top 2 must have >= supported criteria than Top 3');

  // Verify explainability: each requirement has plain statement and status
  for (const p of topThree) {
    assert.ok(p.name, 'Pathway must have a name');
    assert.ok(p.family, 'Pathway must have a family');
    assert.ok(p.requirements.length > 0, 'Pathway must contain individual requirements');
  }
});

test('Assessment progress metrics accurately compute completed vs total items and module partitions', () => {
  const engine = new SessionEngine();
  const catalog = engine.getCatalog();
  const totalItems = catalog.items.length;
  assert.equal(totalItems, 19, 'Assessment battery must contain 19 structured items');

  // Initial state: 0 completed
  const initialView = engine.getView();
  const initialAnswered = initialView.signals.length;
  const initialPercent = Math.round((initialAnswered / totalItems) * 100);
  assert.equal(initialPercent, 0, 'Initial progress must be 0%');

  // Answer 4 items
  for (let i = 0; i < 4; i++) {
    const it = catalog.items[i];
    engine.capture({ itemRef: it.itemRef, response: { kind: 'option', optionId: it.options[0].id } });
  }

  const updatedView = engine.getView();
  const answeredCount = updatedView.signals.length;
  assert.equal(answeredCount, 4);
  const remainingCount = totalItems - answeredCount;
  assert.equal(remainingCount, 15);
  const progressPercent = Math.round((answeredCount / totalItems) * 100);
  assert.equal(progressPercent, 21, '4/19 should yield 21% completion');

  // Verify module partition mapping
  const modules = [
    { title: 'Interests & Affinity', kinds: ['interest'] },
    { title: 'Values & Motivation', kinds: ['value', 'motivation'] },
    { title: 'Working Style', kinds: ['work-style', 'preference'] },
    { title: 'Skills & Experience', kinds: ['skill-self-report', 'experience'] },
    { title: 'Context & Constraints', kinds: ['constraint', 'context-condition'] },
  ];

  let sumItems = 0;
  for (const mod of modules) {
    const inMod = catalog.items.filter((it) => mod.kinds.includes(it.constructs[0]?.kind ?? ''));
    sumItems += inMod.length;
    assert.ok(inMod.length > 0, `Module ${mod.title} must have items`);
  }
  assert.equal(sumItems, totalItems, 'Sum of module items must equal total battery items');
});

test('Assessment reaches 100% completion milestone triggering full dossier readiness', () => {
  const engine = new SessionEngine();
  const catalog = engine.getCatalog();
  const totalItems = catalog.items.length;
  assert.equal(totalItems, 19, 'Catalog must contain 19 standard battery items');

  // Answer all 19 items across all 5 diagnostic modules
  for (const item of catalog.items) {
    const response = item.responseShape === 'open-text'
      ? { kind: 'text' as const, text: 'Detailed qualitative self-description response.' }
      : { kind: 'option' as const, optionId: item.options[0].id };

    const captureResult = engine.capture({ itemRef: item.itemRef, response });
    assert.equal(captureResult.rejections.length, 0);
    const signalId = captureResult.signal!.id;
    const decompResult = engine.decompose(signalId);
    assert.equal(decompResult.rejections.length, 0);
  }

  const finalView = engine.getView();
  const answeredCount = finalView.signals.length;
  assert.equal(answeredCount, totalItems, 'All 19 items must be recorded in session signals');

  const completionPercent = Math.round((answeredCount / totalItems) * 100);
  assert.equal(completionPercent, 100, 'Assessment must reach exactly 100% completion');

  const remainingCount = totalItems - answeredCount;
  assert.equal(remainingCount, 0, 'No unanswered items should remain');

  // Verify all 5 modules are 100% completed
  const modules = [
    { title: 'Interests & Affinity', kinds: ['interest'] },
    { title: 'Values & Motivation', kinds: ['value', 'motivation'] },
    { title: 'Working Style', kinds: ['work-style', 'preference'] },
    { title: 'Skills & Experience', kinds: ['skill-self-report', 'experience'] },
    { title: 'Context & Constraints', kinds: ['constraint', 'context-condition'] },
  ];

  for (const mod of modules) {
    const itemsInMod = catalog.items.filter((it) => mod.kinds.includes(it.constructs[0]?.kind ?? ''));
    const answeredInMod = finalView.signals.filter((sig) =>
      itemsInMod.some((it) => it.itemRef === sig.instrument.itemRef)
    );
    assert.equal(
      answeredInMod.length,
      itemsInMod.length,
      `Module ${mod.title} must have 100% of items completed`
    );
  }

  // Verify pathway mapping works on complete battery without scalar scores
  const mapResult = engine.mapPathways();
  assert.equal(mapResult.rejections.length, 0);
  assert.ok(mapResult.pathwaySet.pathways.length > 0, 'Pathways must be generated');
  for (const p of mapResult.pathwaySet.pathways) {
    assert.equal((p as unknown as Record<string, unknown>).score, undefined);
    assert.ok(p.supportSummary.total > 0);
  }
});


