import express from 'express';
import { detectEdges } from '../engines/edgeDetection.js';

const router = express.Router();

// Get all edges for today
router.get('/today', async (req, res) => {
  try {
    const sport = req.query.sport || 'all'; // all, nba, nfl, mlb
    const minConfidence = parseFloat(req.query.confidence) || 75;

    const edges = await detectEdges({
      sport,
      minConfidence,
      date: new Date()
    });

    // Sort by confidence descending
    const sortedEdges = edges.sort((a, b) => b.confidence - a.confidence);

    res.json({
      timestamp: new Date(),
      sport,
      minConfidence,
      edgesFound: sortedEdges.length,
      edges: sortedEdges
    });
  } catch (error) {
    console.error('Error detecting edges:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get edges for specific game
router.get('/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const sport = req.query.sport || 'all';

    const edges = await detectEdges({
      gameId,
      sport
    });

    res.json({
      gameId,
      edges
    });
  } catch (error) {
    console.error('Error detecting game edges:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get edges for specific player
router.get('/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const sport = req.query.sport;

    const edges = await detectEdges({
      playerId,
      sport
    });

    res.json({
      playerId,
      edges
    });
  } catch (error) {
    console.error('Error detecting player edges:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get edge statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      totalEdgesDetected: 0,
      averageConfidence: 0,
      edgesByType: {},
      bestPerformingEdgeTypes: [],
      timestamp: new Date()
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching edge stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
