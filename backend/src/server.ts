import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase';
import projectsRoutes from './routes/projects.routes';
import evidenceRoutes from './routes/evidence.routes';
import riskRoutes from './routes/risk.routes';
import verifiersRoutes from './routes/verifiers.routes';
import marketplaceRoutes from './routes/marketplace.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api/projects', projectsRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/verifiers', verifiersRoutes);
app.use('/api/marketplace', marketplaceRoutes);

app.get('/health', async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let dbError = null;

  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const { data, error } = await supabase.from('projects').select('count', { count: 'exact', head: true });
      if (error) {
        dbError = error.message;
      } else {
        dbStatus = 'connected';
      }
    } catch (err: any) {
      dbError = err.message;
    }
  }

  res.json({
    status: 'online',
    service: 'Carbonyx Backend Orchestrator',
    database: {
      status: dbStatus,
      error: dbError
    },
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[Carbonyx Backend] Server running on http://localhost:${PORT}`);
});
