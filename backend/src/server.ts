import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase';
import { RelayerService } from './services/relayer.service';

import projectsRouter from './routes/projects.routes';
import evidenceRouter from './routes/evidence.routes';
import riskRouter from './routes/risk.routes';
import creditsRouter from './routes/credits.routes';
import verifiersRouter from './routes/verifiers.routes';
import marketplaceRouter from './routes/marketplace.routes';
import satelliteRouter from './routes/satellite.routes';
import disputesRouter from './routes/disputes.routes';
import auditRouter from './routes/audit.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

RelayerService.initialize(process.env.REGISTRY_CONTRACT_ADDRESS);

// Mount API routes
app.use('/api/projects', projectsRouter);
app.use('/api/evidence', evidenceRouter);
app.use('/api/risk', riskRouter);
app.use('/api/credits', creditsRouter);
app.use('/api/verifiers', verifiersRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/satellite', satelliteRouter);
app.use('/api/disputes', disputesRouter);
app.use('/api/audit', auditRouter);

app.get('/health', async (_req: Request, res: Response) => {
  let supabaseConnected = false;
  let dbError = null;

  try {
    const { error } = await supabase.from('projects').select('count', { count: 'exact', head: true });
    if (!error) {
      supabaseConnected = true;
    } else {
      dbError = error.message;
    }
  } catch (err: any) {
    dbError = err.message;
  }

  const status = 'HEALTHY';
  return res.status(200).json({
    status,
    service: 'carbonyx-backend',
    timestamp: new Date().toISOString(),
    supabaseConnected,
    relayerConnected: RelayerService.isConnected(),
    database: {
      status: supabaseConnected ? 'connected' : 'disconnected',
      error: dbError
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Carbonyx Backend Relayer running on http://localhost:${PORT}`);
  });
}

export default app;
