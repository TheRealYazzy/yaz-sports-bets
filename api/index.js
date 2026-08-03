import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Yaz Sports Bets API is running' });
});

// Placeholder edge detection endpoint
app.get('/api/edges/today', (req, res) => {
  res.json({
    timestamp: new Date(),
    sport: req.query.sport || 'all',
    minConfidence: req.query.confidence || 75,
    edgesFound: 0,
    edges: [],
    message: 'Edge detection coming soon. Database connection pending.'
  });
});

// Serve frontend index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Yaz Sports Bets API running on port ${PORT}`);
});

export default app;
