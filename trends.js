// Trend analysis engine
export async function analyzeTrends(sport) {
  const trends = [];

  try {
    if (sport === 'nba' || sport === 'all') {
      const nbaTrends = await analyzeNBATrends();
      trends.push(...nbaTrends);
    }

    if (sport === 'nfl' || sport === 'all') {
      const nflTrends = await analyzeNFLTrends();
      trends.push(...nflTrends);
    }

    if (sport === 'mlb' || sport === 'all') {
      const mlbTrends = await analyzeMLBTrends();
      trends.push(...mlbTrends);
    }

    return trends;
  } catch (error) {
    console.error('Error analyzing trends:', error);
    return [];
  }
}

// NBA Trend Analysis
async function analyzeNBATrends() {
  const trends = [];

  try {
    // Placeholder structure - would analyze:
    // 1. Team point differential vs win-loss record
    // 2. Offensive efficiency trends (last 10 games)
    // 3. Defensive efficiency trends
    // 4. Three-point shooting trends
    // 5. Pace trends

    const exampleTrend = {
      sport: 'nba',
      name: 'Team Name',
      wins: 12,
      losses: 5,
      pointDifferential: -3.2, // Negative despite winning record
      pointDifferentialTrend: -4.5, // Getting worse
      offensiveRating: 108.2,
      defensiveRating: 111.4,
      ofTrend: -1.2, // Declining
      defTrend: 2.1, // Worsening
      efgTrend: 1.5, // Up 1.5% last 5 games
      threePTrend: -0.8,
      paceTrend: -1.2,
      recentGames: 20,
      winPctLast10: 0.60,
      winPctSeason: 0.705
    };

    return trends;
  } catch (error) {
    console.error('Error analyzing NBA trends:', error);
    return [];
  }
}

// NFL Trend Analysis
async function analyzeNFLTrends() {
  const trends = [];

  try {
    // NFL trend analysis focuses on:
    // 1. Point differential vs record (regression indicator)
    // 2. Offensive EPA trend
    // 3. Defensive EPA trend
    // 4. Turnovers (lucky/unlucky variance)
    // 5. Situational metrics (red zone, 3rd down conversion)

    return trends;
  } catch (error) {
    console.error('Error analyzing NFL trends:', error);
    return [];
  }
}

// MLB Trend Analysis
async function analyzeMLBTrends() {
  const trends = [];

  try {
    // MLB trend analysis focuses on:
    // 1. Run differential vs record
    // 2. Pythagorean win expectancy
    // 3. Batting average trend
    // 4. ERA trend
    // 5. WHIP trend
    // 6. Home run trend

    return trends;
  } catch (error) {
    console.error('Error analyzing MLB trends:', error);
    return [];
  }
}

// Calculate regression probability
export function calculateRegressionProbability(pointDifferential, wins, losses) {
  const winPct = wins / (wins + losses);
  
  // Pythagorean expectation
  const pythExpectation = 1 / (1 + Math.pow(((wins + losses) / (wins + losses)) / winPct, 1.5));
  
  // If negative diff but high record, regression likely
  const regressionLikelihood = Math.abs(pointDifferential) > 5 && winPct > 0.600
    ? (Math.abs(pointDifferential) / 10) * 0.8 // 50-80% regression likelihood
    : 0;

  return {
    pythExpectation: (pythExpectation * 100).toFixed(1),
    currentWinPct: (winPct * 100).toFixed(1),
    regressionLikelihood: Math.min(85, regressionLikelihood * 100).toFixed(1)
  };
}

// Detect hot streaks (momentum)
export function detectMomentum(last10Record, last20Record, currentEFG) {
  const last10Pct = last10Record.wins / (last10Record.wins + last10Record.losses);
  const last20Pct = last20Record.wins / (last20Record.wins + last20Record.losses);
  
  const improvement = last10Pct - last20Pct;
  const momentumScore = improvement * 100 + (currentEFG > 48 ? 10 : -10);

  return {
    last10WinPct: (last10Pct * 100).toFixed(1),
    last20WinPct: (last20Pct * 100).toFixed(1),
    improvement: (improvement * 100).toFixed(1),
    momentumScore: Math.max(-100, Math.min(100, momentumScore)).toFixed(1),
    trend: momentumScore > 15 ? 'Hot' : momentumScore < -15 ? 'Cold' : 'Neutral'
  };
}

// Detect shooting variance (luck factor)
export function detectShootingVariance(shootingPct, seasonAvg, sampleSize) {
  const zScore = (shootingPct - seasonAvg) / (Math.sqrt(seasonAvg * (1 - seasonAvg) / sampleSize));
  
  // If shooting significantly above average on small sample = likely regression
  if (zScore > 2 && sampleSize < 20) {
    return {
      variance: zScore.toFixed(2),
      likelihood: 'High',
      prediction: 'Shooting will regress toward mean'
    };
  }

  return {
    variance: zScore.toFixed(2),
    likelihood: 'Low',
    prediction: 'Shooting sustainable'
  };
}
