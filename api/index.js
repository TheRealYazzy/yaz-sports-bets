import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

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
    message: 'Edge detection coming soon'
  });
});

// Fallback
app.get('/', (req, res) => {
  res.json({ message: 'Yaz Sports Bets API - use /api/health or /api/edges/today' });
});

export default app;
