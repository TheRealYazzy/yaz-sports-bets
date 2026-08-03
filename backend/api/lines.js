import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

// DraftKings scraper - Most reliable
const scrapeDraftKings = async (sport) => {
  try {
    const sportMap = {
      nba: 'basketball/nba-basketball',
      nfl: 'football/nfl',
      mlb: 'baseball/mlb-baseball'
    };

    const url = `https://sportsbook.draftkings.com/leagues/${sportMap[sport]}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://sportsbook.draftkings.com/'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const odds = [];

    // Parse DraftKings structure - target game containers
    $('[class*="event"], [class*="game"], [class*="match"]').each((i, elem) => {
      const matchupText = $(elem).text();
      const dataAttr = $(elem).attr('data-testid');
      
      if (matchupText && matchupText.length > 5) {
        // Extract odds from nested elements
        $(elem).find('[class*="odd"], [class*="price"], [class*="line"]').each((j, cell) => {
          const oddsText = $(cell).text().trim();
          if (oddsText && (oddsText.includes('-') || oddsText.includes('+'))) {
            odds.push({
              matchup: matchupText.substring(0, 100),
              odds: oddsText,
              book: 'DraftKings',
              timestamp: new Date()
            });
          }
        });
      }
    });

    return odds.slice(0, 50); // Return top 50 odds
  } catch (error) {
    console.error('DraftKings scraping error:', error.message);
    return [];
  }
};

// FanDuel scraper
const scrapeFanDuel = async (sport) => {
  try {
    const sportMap = {
      nba: 'basketball',
      nfl: 'football',
      mlb: 'baseball'
    };

    const url = `https://sportsbook.fanduel.com/${sportMap[sport]}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const odds = [];

    // Parse FanDuel structure
    $('[class*="event"], [class*="game"]').each((i, elem) => {
      const matchupText = $(elem).text();
      
      if (matchupText && matchupText.length > 5) {
        $(elem).find('[class*="outcome"], [class*="line"]').each((j, cell) => {
          const text = $(cell).text().trim();
          if (text && (text.includes('-') || text.includes('+'))) {
            odds.push({
              matchup: matchupText.substring(0, 100),
              odds: text,
              book: 'FanDuel',
              timestamp: new Date()
            });
          }
        });
      }
    });

    return odds.slice(0, 50);
  } catch (error) {
    console.error('FanDuel scraping error:', error.message);
    return [];
  }
};

// Bovada scraper - Uses API endpoint
const scrapeBovada = async (sport) => {
  try {
    const sportMap = {
      nba: 'NBA',
      nfl: 'NFL',
      mlb: 'MLB'
    };

    const url = `https://www.bovada.lv/api/sports/${sportMap[sport]}/events/live/calendar`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 8000
    });

    const odds = [];

    if (response.data && Array.isArray(response.data)) {
      response.data.forEach(day => {
        if (day.events) {
          day.events.forEach(event => {
            const matchup = `${event.homeTeam || 'Home'} vs ${event.awayTeam || 'Away'}`;
            
            event.competitions?.forEach(comp => {
              comp.markets?.forEach(market => {
                market.selections?.forEach(selection => {
                  odds.push({
                    matchup,
                    type: market.type,
                    selection: selection.label,
                    odds: selection.price?.american || selection.price,
                    book: 'Bovada',
                    timestamp: new Date()
                  });
                });
              });
            });
          });
        }
      });
    }

    return odds.slice(0, 50);
  } catch (error) {
    console.error('Bovada scraping error:', error.message);
    return [];
  }
};

// API endpoint - Get all odds for a sport
router.get('/all/:sport', async (req, res) => {
  const { sport } = req.params;

  // Validate sport
  if (!['nba', 'nfl', 'mlb'].includes(sport)) {
    return res.status(400).json({ error: 'Invalid sport. Use: nba, nfl, mlb' });
  }

  try {
    // Scrape all three books in parallel
    const [dkOdds, fdOdds, bovadaOdds] = await Promise.all([
      scrapeDraftKings(sport),
      scrapeFanDuel(sport),
      scrapeBovada(sport)
    ]);

    const allOdds = {
      sport,
      timestamp: new Date(),
      draftkings: dkOdds,
      fanduel: fdOdds,
      bovada: bovadaOdds,
      totalOdds: dkOdds.length + fdOdds.length + bovadaOdds.length
    };

    res.json(allOdds);
  } catch (error) {
    console.error('Error fetching all odds:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get odds for specific book
router.get('/:book/:sport', async (req, res) => {
  const { book, sport } = req.params;

  if (!['nba', 'nfl', 'mlb'].includes(sport)) {
    return res.status(400).json({ error: 'Invalid sport' });
  }

  try {
    let odds = [];

    if (book.toLowerCase() === 'draftkings') {
      odds = await scrapeDraftKings(sport);
    } else if (book.toLowerCase() === 'fanduel') {
      odds = await scrapeFanDuel(sport);
    } else if (book.toLowerCase() === 'bovada') {
      odds = await scrapeBovada(sport);
    } else {
      return res.status(400).json({ error: 'Invalid book. Use: draftkings, fanduel, bovada' });
    }

    res.json({
      book,
      sport,
      odds,
      count: odds.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error(`Error fetching ${book} odds:`, error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
