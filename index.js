import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Import routers
import nbaRouter from '../backend/api/nba.js';
import nflRouter from '../backend/api/nfl.js';
import mlbRouter from '../backend/api/mlb.js';
import linesRouter from '../backend/api/lines.js';
import edgesRouter from '../backend/api/edges.js';

// API Routes
app.use('/api/nba', nbaRouter);
app.use('/api/nfl', nflRouter);
app.use('/api/mlb', mlbRouter);
app.use('/api/lines', linesRouter);
app.use('/api/edges', edgesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    service: 'Yaz Sports Bets'
  });
});

// Root route serves frontend
app.get('/', (req, res) => {
  res.sendFile('frontend/index.html', { root: '.' });
});

// Scheduled Jobs
// Hourly edge detection
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Running hourly edge detection...');
  try {
    await import('../backend/jobs/hourly.js');
  } catch (error) {
    console.error('Hourly job error:', error);
  }
});

// Daily analysis (8am, 2pm, 8pm ET)
cron.schedule('0 8,14,20 * * *', async () => {
  console.log('[CRON] Running daily analysis...');
  try {
    await import('../backend/jobs/daily.js');
  } catch (error) {
    console.error('Daily job error:', error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🎯 YAZ SPORTS BETS running on port ${PORT}`);
  console.log(`📊 Edge detection engine active`);
});

export default app;
export const handler = app;
