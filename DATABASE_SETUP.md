# Database Setup - Yaz Sports Bets

This guide covers setting up Vercel Postgres for Yaz Sports Bets.

## Quick Start

### 1. Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `yaz-sports-bets` project
3. Click "Storage" tab → "Create Database"
4. Select "Postgres" → Create
5. Copy the connection string to your `.env` file as `DATABASE_URL`

### 2. Run Schema Setup

Either:

**Option A: Use Vercel CLI**
```bash
vercel env pull
npm install @vercel/postgres
node setup-database.js
```

**Option B: Manual SQL in Vercel Dashboard**
1. Go to Vercel Dashboard → Your Project → Storage → Postgres
2. Click "Query" tab
3. Paste the SQL schema below
4. Execute

---

## Database Schema

### Core Tables

```sql
-- ============================================
-- EDGES TABLE - Detected betting opportunities
-- ============================================
CREATE TABLE IF NOT EXISTS edges (
    id SERIAL PRIMARY KEY,
    
    -- Basic Info
    sport VARCHAR(50) NOT NULL,              -- 'nba', 'nfl', 'mlb'
    edge_type VARCHAR(100) NOT NULL,         -- 'Injury Impact', 'Matchup', etc
    
    -- Player/Team Info
    player_name VARCHAR(255),                -- Player involved in edge
    team_name VARCHAR(255),                  -- Team name
    opponent_name VARCHAR(255),              -- Opponent
    
    -- Edge Details
    edge_description TEXT NOT NULL,          -- Description of the edge
    prediction TEXT,                         -- What we predict will happen
    confidence INTEGER NOT NULL,             -- 0-100 confidence score
    
    -- Data Points
    sample_size INTEGER,                     -- Number of historical games analyzed
    historical_hit_rate DECIMAL(5,4),        -- 0.00-1.00 (65% = 0.65)
    
    -- Props/Lines
    prop_line DECIMAL(10,2),                 -- Player prop line (e.g., 26.5 points)
    predicted_value DECIMAL(10,2),           -- Our predicted value
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',     -- 'active', 'expired', 'archived'
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,                    -- When edge expires (game time)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- BETS TABLE - User's recorded bets
-- ============================================
CREATE TABLE IF NOT EXISTS bets (
    id SERIAL PRIMARY KEY,
    
    -- Link to Edge
    edge_id INTEGER REFERENCES edges(id),
    
    -- Bet Info
    sport VARCHAR(50) NOT NULL,
    player_name VARCHAR(255),
    team_name VARCHAR(255),
    bet_type VARCHAR(100),                   -- 'Over/Under', 'Props', 'Spread', etc
    
    -- Sportsbook
    book VARCHAR(50) NOT NULL,               -- 'draftkings', 'fanduel', 'bovada'
    odds INTEGER,                            -- American odds: -110, +150, etc
    
    -- Confidence
    edge_confidence INTEGER,                 -- Confidence at time of bet
    
    -- Tracking
    status VARCHAR(50) DEFAULT 'pending',    -- 'pending', 'won', 'lost', 'push'
    result VARCHAR(50),                      -- Final result
    
    -- Win/Loss (if known)
    wager_amount DECIMAL(10,2),              -- Amount wagered (optional)
    win_amount DECIMAL(10,2),                -- Amount won (if applicable)
    
    -- Timestamps
    placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EDGE_ACCURACY TABLE - Backtesting results
-- ============================================
CREATE TABLE IF NOT EXISTS edge_accuracy (
    id SERIAL PRIMARY KEY,
    
    -- Edge Type
    edge_type VARCHAR(100) NOT NULL,
    sport VARCHAR(50),
    
    -- Accuracy Stats
    total_edges_tested INTEGER,              -- Total edges of this type detected
    edges_that_hit INTEGER,                  -- How many won
    hit_rate DECIMAL(5,4),                   -- Percentage hit rate
    
    -- Data Period
    test_period_days INTEGER,                -- Days of data tested
    sample_size INTEGER,
    
    -- Stats
    confidence_score INTEGER,                -- Final confidence (0-100)
    expected_value DECIMAL(5,4),             -- EV per bet
    
    -- Last Updated
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(edge_type, sport)
);

-- ============================================
-- PLAYER_DATA TABLE - Cached player stats
-- ============================================
CREATE TABLE IF NOT EXISTS player_data (
    id SERIAL PRIMARY KEY,
    
    -- Player Info
    player_id VARCHAR(50) NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    sport VARCHAR(50) NOT NULL,
    position VARCHAR(50),
    team VARCHAR(100),
    
    -- Season Stats (Latest)
    games_played INTEGER,
    ppg DECIMAL(5,2),                        -- Points per game (basketball/baseball)
    apg DECIMAL(5,2),                        -- Assists per game
    rpg DECIMAL(5,2),                        -- Rebounds per game
    
    -- Advanced Stats
    usage_rate DECIMAL(5,2),                 -- Usage % (NBA)
    efficiency_rating DECIMAL(5,1),          -- Overall efficiency
    
    -- Recent Form (Last 10 games)
    last_10_games_ppg DECIMAL(5,2),
    last_10_games_apg DECIMAL(5,2),
    
    -- Injury Status
    injury_status VARCHAR(50),               -- 'Healthy', 'Out', 'Questionable', etc
    
    -- Last Updated
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(player_id, sport)
);

-- ============================================
-- TEAM_DATA TABLE - Cached team stats
-- ============================================
CREATE TABLE IF NOT EXISTS team_data (
    id SERIAL PRIMARY KEY,
    
    -- Team Info
    team_id VARCHAR(50) NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    sport VARCHAR(50) NOT NULL,
    
    -- Record
    wins INTEGER,
    losses INTEGER,
    win_pct DECIMAL(5,4),
    
    -- Performance Metrics
    point_differential DECIMAL(6,2),         -- Points per 100 possessions (NBA) or per game
    offensive_rating DECIMAL(6,1),
    defensive_rating DECIMAL(6,1),
    net_rating DECIMAL(6,1),
    
    -- Advanced
    pace DECIMAL(5,2),                       -- Possessions per 48 (NBA) or plays per game (NFL)
    
    -- Recent Form
    last_10_record VARCHAR(10),              -- "7-3"
    last_10_ppg DECIMAL(5,2),
    
    -- Home/Away Splits
    home_record VARCHAR(10),
    away_record VARCHAR(10),
    
    -- Last Updated
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(team_id, sport)
);

-- ============================================
-- SCRAPING_LOG TABLE - Track what was scraped
-- ============================================
CREATE TABLE IF NOT EXISTS scraping_log (
    id SERIAL PRIMARY KEY,
    
    -- Source Info
    source VARCHAR(100),                     -- 'espn_nba', 'draftkings_lines', etc
    sport VARCHAR(50),
    
    -- Status
    status VARCHAR(50),                      -- 'success', 'failed', 'partial'
    records_updated INTEGER,
    error_message TEXT,
    
    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES - Optimize queries
-- ============================================

-- Edges indexes
CREATE INDEX idx_edges_sport ON edges(sport);
CREATE INDEX idx_edges_type ON edges(edge_type);
CREATE INDEX idx_edges_confidence ON edges(confidence);
CREATE INDEX idx_edges_created ON edges(created_at DESC);
CREATE INDEX idx_edges_status ON edges(status);

-- Bets indexes
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_book ON bets(book);
CREATE INDEX idx_bets_placed ON bets(placed_at DESC);
CREATE INDEX idx_bets_edge_id ON bets(edge_id);
CREATE INDEX idx_bets_sport ON bets(sport);

-- Player data indexes
CREATE INDEX idx_player_sport ON player_data(sport);
CREATE INDEX idx_player_team ON player_data(team);
CREATE INDEX idx_player_name ON player_data(player_name);

-- Team data indexes
CREATE INDEX idx_team_sport ON team_data(sport);
CREATE INDEX idx_team_name ON team_data(team_name);

-- Scraping log index
CREATE INDEX idx_scraping_log_created ON scraping_log(created_at DESC);
```

---

## Connecting to Database

### From Node.js

```javascript
import { sql } from '@vercel/postgres';

// Simple query
const result = await sql`SELECT * FROM edges WHERE confidence >= 75`;

// With parameters (safe from SQL injection)
const edges = await sql`
  SELECT * FROM edges 
  WHERE sport = ${sport} 
  AND confidence >= ${minConfidence}
  ORDER BY confidence DESC
`;
```

### Example Queries

```javascript
// Get today's edges
const todayEdges = await sql`
  SELECT * FROM edges
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND status = 'active'
  ORDER BY confidence DESC
`;

// Record a bet
await sql`
  INSERT INTO bets (edge_id, sport, player_name, book, odds, status)
  VALUES (${edgeId}, ${sport}, ${player}, ${book}, ${odds}, 'pending')
`;

// Get bet history
const history = await sql`
  SELECT * FROM bets
  WHERE placed_at >= NOW() - INTERVAL '30 days'
  ORDER BY placed_at DESC
`;

// Calculate ROI
const roi = await sql`
  SELECT
    COUNT(*) as total,
    SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as losses
  FROM bets
  WHERE placed_at >= NOW() - INTERVAL '7 days'
`;
```

---

## Maintenance

### Backup

Vercel Postgres automatically creates backups. To export:

1. Vercel Dashboard → Project → Storage → Postgres
2. Click "...menu" → "Export"

### Cleanup (Optional)

Delete old edges/bets to save space:

```sql
-- Archive edges older than 90 days
UPDATE edges SET status = 'archived' 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete old scraping logs
DELETE FROM scraping_log 
WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## Troubleshooting

**Connection refused**
- Verify `DATABASE_URL` in Vercel environment
- Check that database exists in Vercel dashboard
- Ensure IP is whitelisted (Vercel handles this automatically)

**Table doesn't exist**
- Run schema SQL in Vercel dashboard
- Check database name in connection string

**Slow queries**
- Add indexes (provided above)
- Limit `ORDER BY` to indexed columns
- Use LIMIT for pagination

---

**Setup complete!** Your database is ready for edge detection.
