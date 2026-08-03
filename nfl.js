import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

// Get games for specific week
router.get('/games/week/:week', async (req, res) => {
  try {
    const { week } = req.params;
    const year = new Date().getFullYear();

    const response = await axios.get(
      `https://www.pro-football-reference.com/years/${year}/week-${week}.htm`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 8000
      }
    );

    const $ = cheerio.load(response.data);
    const games = [];

    $('tr').each((i, elem) => {
      const cells = $(elem).find('td');
      if (cells.length > 0) {
        const day = $(cells[0]).attr('data-stat') === 'day_of_week' ? $(cells[0]).text() : '';
        const date = $(cells[1]).attr('data-stat') === 'date_game' ? $(cells[1]).text() : '';
        const homeTeam = $(cells[4]).attr('data-stat') === 'home_team' ? $(cells[4]).text() : '';
        const awayTeam = $(cells[2]).attr('data-stat') === 'vis_team' ? $(cells[2]).text() : '';
        const homeScore = parseInt($(cells[5]).text()) || null;

        if (homeTeam && awayTeam) {
          games.push({ 
            day, 
            date, 
            homeTeam, 
            awayTeam, 
            homeScore 
          });
        }
      }
    });

    res.json(games);
  } catch (error) {
    console.error('Error fetching NFL games:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get team stats
router.get('/team/:teamName/stats', async (req, res) => {
  try {
    const { teamName } = req.params;
    const year = new Date().getFullYear();

    const response = await axios.get(
      `https://www.pro-football-reference.com/years/${year}/`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 8000
      }
    );

    const $ = cheerio.load(response.data);
    const stats = {};

    // Parse team stats from table
    $(`tr`).each((i, elem) => {
      const text = $(elem).text();
      if (text.includes(teamName)) {
        $(elem).find('td').each((j, cell) => {
          stats[j] = $(cell).text();
        });
      }
    });

    if (Object.keys(stats).length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching NFL team stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get weather data for a game location
router.get('/weather/:location', async (req, res) => {
  try {
    const { location } = req.params;

    // Mapping of NFL cities to coordinates
    const cityCoords = {
      'arlington': { lat: 32.747, lon: -97.093 }, // Dallas
      'atlanta': { lat: 33.755, lon: -84.393 },
      'baltimore': { lat: 39.278, lon: -76.603 },
      'buffalo': { lat: 42.774, lon: -78.787 },
      'charlotte': { lat: 35.215, lon: -80.853 },
      'chicago': { lat: 41.862, lon: -87.617 },
      'cleveland': { lat: 41.506, lon: -81.699 },
      'denver': { lat: 39.756, lon: -104.992 },
      'detroit': { lat: 42.640, lon: -83.048 },
      'foxborough': { lat: 42.090, lon: -71.264 }, // New England
      'glendale': { lat: 33.393, lon: -112.265 }, // Phoenix
      'inglewood': { lat: 33.953, lon: -118.340 }, // LA
      'indianapolis': { lat: 39.761, lon: -86.324 },
      'jacksonville': { lat: 30.324, lon: -81.639 },
      'kansas city': { lat: 39.048, lon: -94.484 },
      'las vegas': { lat: 36.090, lon: -115.188 },
      'miami': { lat: 25.958, lon: -80.239 },
      'minneapolis': { lat: 44.973, lon: -93.262 },
      'new orleans': { lat: 29.951, lon: -90.071 },
      'new york': { lat: 40.815, lon: -74.074 },
      'philadelphia': { lat: 39.901, lon: -75.167 },
      'pittsburgh': { lat: 40.446, lon: -80.016 },
      'santa clara': { lat: 37.405, lon: -121.969 }, // San Francisco
      'seattle': { lat: 47.595, lon: -122.331 },
      'tampa': { lat: 27.976, lon: -82.503 },
      'tennessee': { lat: 36.167, lon: -86.771 },
      'washington': { lat: 38.908, lon: -77.019 }
    };

    const coords = cityCoords[location.toLowerCase()];
    if (!coords) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Weather API key not configured' });
    }

    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: {
        lat: coords.lat,
        lon: coords.lon,
        appid: apiKey,
        units: 'imperial'
      },
      timeout: 8000
    });

    const weather = {
      temp: response.data.main.temp,
      feelsLike: response.data.main.feels_like,
      windSpeed: response.data.wind.speed,
      windDirection: response.data.wind.deg,
      conditions: response.data.weather[0].main,
      precipitation: response.data.rain?.['1h'] || 0
    };

    res.json(weather);
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get injuries from ESPN
router.get('/injuries', async (req, res) => {
  try {
    const response = await axios.get('https://www.espn.com/nfl/injuries', {
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
    console.error('Error fetching NFL injuries:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
