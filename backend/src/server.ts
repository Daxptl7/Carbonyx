import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase';
import { RelayerService } from './services/relayer.service';

import projectsRouter from './routes/projects.routes';
import evidenceRouter from './routes/evidence.routes';
import riskRouter from './routes/risk.routes';
import creditsRouter from './routes/credits.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

RelayerService.initialize(process.env.REGISTRY_CONTRACT_ADDRESS);

app.use('/api/projects', projectsRouter);
app.use('/api/evidence', evidenceRouter);
app.use('/api/risk', riskRouter);
app.use('/api/credits', creditsRouter);

app.get('/health', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('projects').select('count', { count: 'exact', head: true });
    
    return res.status(200).json({
      status: 'HEALTHY',
      service: 'carbonyx-backend',
      timestamp: new Date().toISOString(),
      supabaseConnected: !error,
      relayerConnected: RelayerService.isConnected(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'UNHEALTHY',
      error: err.message
    });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Carbonyx Backend Relayer running on http://localhost:${PORT}`);
  });
}

export default app;
