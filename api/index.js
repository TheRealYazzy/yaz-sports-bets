import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import scrapers
import { getMLBGames, parseMLBGames } from '../backend/api/mlb.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Store edges in memory (in production would be database)
let cachedEdges = [];
let lastUpdate = null;

// Function to refresh edges
async function refreshEdges() {
  try {
    console.log('Refreshing edges from live data...');
    
    const newEdges = [];
    
    // Get MLB edges
    const mlbGames = await getMLBGames();
    const mlbEdges = parseMLBGames(mlbGames);
    newEdges.push(...mlbEdges);
    
    console.log(`Found ${mlbEdges.length} MLB edges`);
    
    // Sort by confidence
    cachedEdges = newEdges.sort((a, b) => b.confidence - a.confidence);
    lastUpdate = new Date();
    
    console.log(`Total edges: ${cachedEdges.length}`);
    
  } catch (error) {
    console.error('Error refreshing edges:', error);
  }
}

// ============ API ROUTES ============

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Yaz Sports Bets API - Live Scraping',
    features: [
      'Live MLB data (statsapi.mlb.com)',
      'Real-time edge detection',
      'Confidence-based filtering'
    ],
    lastUpdate,
    edgesCached: cachedEdges.length
  });
});

app.get('/api/edges/today', async (req, res) => {
  const sport = req.query.sport || 'all';
  const minConfidence = parseInt(req.query.confidence) || 75;
  
  try {
    // Refresh if cache is stale (older than 5 minutes)
    if (!lastUpdate || Date.now() - lastUpdate.getTime() > 5 * 60 * 1000) {
      await refreshEdges();
    }
    
    let edges = cachedEdges;
    
    // Filter by sport
    if (sport !== 'all') {
      edges = edges.filter(e => e.sport === sport);
    }
    
    // Filter by confidence
    edges = edges.filter(e => e.confidence >= minConfidence);
    
    res.json({
      timestamp: new Date().toISOString(),
      sport,
      minConfidence,
      edgesFound: edges.length,
      edges: edges.slice(0, 20),
      source: 'statsapi.mlb.com + analysis',
      cacheAge: lastUpdate ? Math.round((Date.now() - lastUpdate.getTime()) / 1000) : 'unknown'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/edges/sport/:sport', async (req, res) => {
  const { sport } = req.params;
  
  try {
    if (!lastUpdate || Date.now() - lastUpdate.getTime() > 5 * 60 * 1000) {
      await refreshEdges();
    }
    
    const edges = cachedEdges.filter(e => e.sport === sport.toLowerCase());
    
    res.json({
      sport,
      found: edges.length,
      edges,
      source: 'Live data'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/edges/stats', async (req, res) => {
  try {
    if (!lastUpdate || Date.now() - lastUpdate.getTime() > 5 * 60 * 1000) {
      await refreshEdges();
    }
    
    const edges = cachedEdges;
    
    const stats = {
      timestamp: new Date().toISOString(),
      totalEdgesDetected: edges.length,
      averageConfidence: edges.length > 0
        ? (edges.reduce((sum, e) => sum + e.confidence, 0) / edges.length).toFixed(1)
        : 0,
      edgesByType: {},
      edgesBySport: {},
      highConfidenceEdges: edges.filter(e => e.confidence >= 85).length
    };
    
    edges.forEach(e => {
      stats.edgesByType[e.type] = (stats.edgesByType[e.type] || 0) + 1;
      stats.edgesBySport[e.sport] = (stats.edgesBySport[e.sport] || 0) + 1;
    });
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Yaz Sports Bets API - Live Edition',
    endpoints: {
      health: '/api/health',
      edgesToday: '/api/edges/today?sport=mlb&confidence=75',
      edgesByType: '/api/edges/sport/mlb',
      stats: '/api/edges/stats'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initial refresh on startup
refreshEdges();

export default app;
