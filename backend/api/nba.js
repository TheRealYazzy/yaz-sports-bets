import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();
const STATS_API = 'https://stats.nba.com/stats';

// NBA API helper
const nbaCall = async (endpoint, params = {}) => {
  try {
    const response = await axios.get(`${STATS_API}/${endpoint}`, {
      params,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 8000
    });
    return response.data;
  } catch (error) {
    console.error(`NBA API error - ${endpoint}:`, error.message);
    return null;
  }
};

// Get scoreboard for today
router.get('/scoreboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const data = await nbaCall('scoreboard', {
      GameDate: today
    });

    if (!data || !data.resultSets) {
      return res.status(500).json({ error: 'Failed to fetch scoreboard' });
    }

    const games = data.resultSets[0].rowSet.map(game => ({
      gameId: game[2],
      homeTeam: game[5],
      awayTeam: game[3],
      gameStatus: game[4],
      startTime: game[0]
    }));

    res.json(games);
  } catch (error) {
    console.error('Error fetching NBA scoreboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get player stats
router.get('/player/:playerId/stats', async (req, res) => {
  try {
    const { playerId } = req.params;
    const season = new Date().getFullYear();
    const seasonStr = `${season - 1}-${String(season).slice(-2)}`;

    const data = await nbaCall('playergeneralstats', {
      PlayerID: playerId,
      Season: seasonStr
    });

    if (!data || !data.resultSets) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const stats = data.resultSets[0].rowSet.map(row => ({
      date: row[1],
      opponent: row[3],
      points: row[26],
      assists: row[4],
      rebounds: row[18],
      fgm: row[8],
      fga: row[9],
      fg3m: row[11],
      fg3a: row[12],
      ftm: row[14],
      fta: row[15]
    }));

    res.json(stats);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get team stats
router.get('/team/:teamId/stats', async (req, res) => {
  try {
    const { teamId } = req.params;
    const season = new Date().getFullYear();
    const seasonStr = `${season - 1}-${String(season).slice(-2)}`;

    const data = await nbaCall('teamgeneralstats', {
      TeamID: teamId,
      Season: seasonStr
    });

    if (!data || !data.resultSets) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamStats = data.resultSets[0].rowSet[0];

    res.json({
      teamId: teamStats[1],
      gamesPlayed: teamStats[2],
      wins: teamStats[3],
      losses: teamStats[4],
      pace: teamStats[16],
      offensiveRating: teamStats[19],
      defensiveRating: teamStats[20],
      netRating: teamStats[21]
    });
  } catch (error) {
    console.error('Error fetching team stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get player usage rate
router.get('/player/:playerId/usage', async (req, res) => {
  try {
    const { playerId } = req.params;

    const data = await nbaCall('playerdashptshots', {
      PlayerID: playerId
    });

    if (!data || !data.resultSets) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const usage = data.resultSets[0].rowSet[0];

    res.json({
      usageRate: usage[23],
      touchesPerGame: usage[24],
      elapsedTimePerGame: usage[25]
    });
  } catch (error) {
    console.error('Error fetching player usage:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get injuries from ESPN
router.get('/injuries', async (req, res) => {
  try {
    const response = await axios.get('https://www.espn.com/nba/injuries', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 8000
    });

    const $ = cheerio.load(response.data);
    const injuries = [];

    $('tr').each((i, elem) => {
      const cells = $(elem).find('td');
      if (cells.length > 0) {
        const player = $(cells[0]).text().trim();
        const team = $(cells[1]).text().trim();
        const status = $(cells[2]).text().trim();

        if (player) {
          injuries.push({ player, team, status });
        }
      }
    });

    res.json(injuries);
  } catch (error) {
    console.error('Error fetching NBA injuries:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
