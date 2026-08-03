import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();
const STATS_API = 'https://statsapi.mlb.com/api/v1';

// Helper function for API calls
const mlbCall = async (endpoint, params = {}) => {
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
    console.error(`MLB API error - ${endpoint}:`, error.message);
    return null;
  }
};

// Get today's games
router.get('/games/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await mlbCall('schedule', {
      sportId: 1,
      date: today
    });

    if (!data) {
      return res.status(500).json({ error: 'Failed to fetch games' });
    }

    const games = data.map(game => ({
      gameId: game.gameId,
      homeTeam: game.teams.home.team.name,
      awayTeam: game.teams.away.team.name,
      homeTeamId: game.teams.home.team.id,
      awayTeamId: game.teams.away.team.id,
      startTime: game.gameDateTime,
      status: game.status.abstractGameState,
      venue: game.venue?.name || 'TBA',
      weather: game.weather || null
    }));

    res.json(games);
  } catch (error) {
    console.error('Error fetching MLB games:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get player stats
router.get('/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const data = await mlbCall(`people/${playerId}`, {
      hydrate: 'stats(group=[hitting,pitching],type=[season,last10,last30])'
    });

    if (!data || !data.people) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = data.people[0];
    const stats = {
      name: player.fullName,
      position: player.primaryPosition?.name || 'Unknown',
      team: player.currentTeam?.name || 'Free Agent',
      stats: player.stats || []
    };

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
    const data = await mlbCall(`teams/${teamId}`, {
      hydrate: 'stats(group=[hitting,pitching],type=[season])'
    });

    if (!data || !data.teams) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = data.teams[0];
    const stats = {
      teamName: team.name,
      teamId: team.id,
      record: team.record,
      stats: team.stats || []
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching team stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pitcher vs batter matchup
router.get('/matchup/:playerId/:oppTeamId', async (req, res) => {
  try {
    const { playerId, oppTeamId } = req.params;
    const data = await mlbCall(`people/${playerId}`, {
      hydrate: 'stats(group=[hitting,pitching],type=[vsTeam])'
    });

    if (!data || !data.people) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = data.people[0];
    const vsTeamStats = player.stats?.find(s => 
      s.stats?.team?.id === parseInt(oppTeamId)
    );

    res.json({
      player: player.fullName,
      team: oppTeamId,
      vsStats: vsTeamStats?.stats || null
    });
  } catch (error) {
    console.error('Error fetching matchup stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get injuries from ESPN
router.get('/injuries', async (req, res) => {
  try {
    const response = await axios.get('https://www.espn.com/mlb/injuries', {
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
        const position = $(cells[2]).text().trim();
        const status = $(cells[3]).text().trim();

        if (player) {
          injuries.push({ player, team, position, status });
        }
      }
    });

    res.json(injuries);
  } catch (error) {
    console.error('Error fetching injuries:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get live game data
router.get('/game/:gameId/live', async (req, res) => {
  try {
    const { gameId } = req.params;
    const data = await mlbCall(`game/${gameId}/live`);

    if (!data) {
      return res.status(500).json({ error: 'Failed to fetch game' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching live game:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
