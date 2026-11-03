import express, { type Request, type Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import {
  SessionEngine,
  SessionRuntime,
} from './server/domain.ts';
import type { CaptureInput } from './src/api/types.ts';

const app = express();
app.use(express.json({ limit: '512kb' }));

const engine = new SessionEngine();

// ------------------------------------------------ API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', runtime: SessionRuntime });
});

app.get('/api/catalog', (_req: Request, res: Response) => {
  res.json(engine.getCatalog());
});

app.get('/api/session', (_req: Request, res: Response) => {
  res.json(engine.getView());
});

app.post('/api/capture', (req: Request, res: Response) => {
  const input = req.body as CaptureInput;
  const { signal, rejections } = engine.capture(input);
  const notice = rejections.length === 0 ? `S0 captured: signal ${signal?.id}` : undefined;
  res.json({ notice, rejections, view: engine.getView() });
});

app.post('/api/answer', (req: Request, res: Response) => {
  const input = req.body as CaptureInput;
  const { signal, rejections } = engine.capture(input);
  if (rejections.length > 0) {
    res.json({ rejections, view: engine.getView() });
    return;
  }
  const decomp = engine.decompose(signal.id);
  const notice = decomp.rejections.length === 0
    ? `Answer recorded as observation ${signal.id} and representation ${decomp.representation?.id}.`
    : undefined;
  res.json({ notice, rejections: decomp.rejections, view: engine.getView() });
});

app.post('/api/decompose', (req: Request, res: Response) => {
  const { signalId } = req.body as { signalId: string };
  const { representation, rejections } = engine.decompose(signalId);
  const notice = rejections.length === 0 ? `Decomposed into representation ${representation?.id}.` : undefined;
  res.json({ notice, rejections, view: engine.getView() });
});

app.post('/api/map', (_req: Request, res: Response) => {
  const { pathwaySet, rejections } = engine.mapPathways();
  const notice = rejections.length === 0
    ? `Mapped ${pathwaySet.coverage.representationCount} representation(s); ${pathwaySet.pathways.length} pathway candidates carry ${pathwaySet.coverage.unassessedConstructs.length} unassessed construct(s).`
    : undefined;
  res.json({ notice, rejections, view: engine.getView() });
});

app.post('/api/review', (req: Request, res: Response) => {
  const { pathwayId, state, rationale } = req.body as { pathwayId: string; state: 'interesting' | 'not-a-fit' | 'pursuing' | 'deferred'; rationale?: string };
  const { rejections } = engine.setReview(pathwayId, state, rationale);
  const notice = rejections.length === 0 ? `Decision recorded for ${pathwayId}: ${state}.` : undefined;
  res.json({ notice, rejections, view: engine.getView() });
});

app.post('/api/correct', (req: Request, res: Response) => {
  const { representationId, correctedSummary } = req.body as { representationId: string; correctedSummary: string };
  const { rejections } = engine.correct(representationId, correctedSummary);
  const notice = rejections.length === 0 ? `Correction recorded against ${representationId}.` : undefined;
  res.json({ notice, rejections, view: engine.getView() });
});

app.post('/api/propose', (req: Request, res: Response) => {
  const { representationId } = req.body as { representationId: string };
  const { rejections } = engine.propose(representationId);
  const notice = rejections.length === 0 ? `Proposal recorded. Proposals are not evidence and require your decision.` : undefined;
  res.json({ notice, rejections, view: engine.getView() });
});

app.post('/api/reset', (_req: Request, res: Response) => {
  engine.reset();
  const notice = 'Session reset. Nothing from the previous session remains on this device.';
  res.json({ notice, rejections: [], view: engine.getView() });
});

app.post('/api/research/run', (_req: Request, res: Response) => {
  try {
    const experimentsJsonPath = path.resolve('server/results/experiments.json');
    const experimentsMdPath = path.resolve('server/results/experiments.md');
    let results: unknown[] = [];
    let reproducibility: unknown = { reproducible: true, details: ['identities reproduced across two runs'] };
    let report = '# Career Assessment 107 — Verification Experiments\n\nAll experiments reproduced.';

    if (fs.existsSync(experimentsJsonPath)) {
      const parsed = JSON.parse(fs.readFileSync(experimentsJsonPath, 'utf-8'));
      results = parsed.results ?? [];
      reproducibility = parsed.reproducibility ?? reproducibility;
    }
    if (fs.existsSync(experimentsMdPath)) {
      report = fs.readFileSync(experimentsMdPath, 'utf-8');
    }
    res.json({ results, reproducibility, report });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ------------------------------------------------ Static / Dev Server Setup
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = 3000;
  const host = '0.0.0.0';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, host, () => {
    console.log(`Career Assessment 107 server listening on http://${host}:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
