import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import healthRoutes from './routes/healthRoutes';
import geminiRoutes from './routes/geminiRoutes';
import firmsRoutes from './routes/firmsRoutes';
import osmRoutes from './routes/osmRoutes';
import weatherRoutes from './routes/weatherRoutes';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Register API Routes
app.use('/api', healthRoutes);
app.use('/api', geminiRoutes);
app.use('/api', firmsRoutes);
app.use('/api', osmRoutes);
app.use('/api', weatherRoutes);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`NTRO ThermalPulse Server running on http://localhost:${PORT}`);
  });
}

startServer();
