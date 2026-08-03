// Injury impact analysis engine
export async function analyzeInjuries(sport) {
  const injuries = [];

  try {
    if (sport === 'nba' || sport === 'all') {
      const nbaInjuries = await analyzeNBAInjuries();
      injuries.push(...nbaInjuries);
    }

    if (sport === 'nfl' || sport === 'all') {
      const nflInjuries = await analyzeNFLInjuries();
      injuries.push(...nflInjuries);
    }

    if (sport === 'mlb' || sport === 'all') {
      const mlbInjuries = await analyzeMLBInjuries();
      injuries.push(...mlbInjuries);
    }

    return injuries;
  } catch (error) {
    console.error('Error analyzing injuries:', error);
    return [];
  }
}

// NBA Injury Analysis
async function analyzeNBAInjuries() {
  const injuries = [];

  try {
    // Placeholder structure for NBA injuries
    // Impact factors:
    // 1. Player's normal PPG/APG/RPG
    // 2. Team performance without player (historical)
    // 3. Backup player's stats
    // 4. Usage rate changes

    const exampleInjury = {
      sport: 'nba',
      player: 'Placeholder Star',
      team: 'Team Name',
      position: 'PG',
      status: 'Out',
      expectedMissedGames: 4,
      normalPPG: 28.5,
      normalAPG: 7.2,
      normalRPG: 4.1,
      backupPlayer: 'Backup Name',
      backupPPG: 12.3,
      backupAPG: 3.1,
      teamPointDiffWithoutPlayer: -8.5, // pts/100 poss
      impactScore: 8.5, // 0-10 scale
      sampleSize: 30,
      historicalHitRate: 0.71,
      expectedBackupUsageIncrease: 0.25 // 25% more minutes
    };

    return injuries;
  } catch (error) {
    console.error('Error analyzing NBA injuries:', error);
    return [];
  }
}

// NFL Injury Analysis
async function analyzeNFLInjuries() {
  const injuries = [];

  try {
    // NFL injuries focus on:
    // 1. WR - impact on receiving yards/touchdowns
    // 2. RB - impact on rushing yards
    // 3. QB - massive impact on scoring
    // 4. Pass rushers - impact on sack rate
    // 5. CBs - impact on opposing passing

    return injuries;
  } catch (error) {
    console.error('Error analyzing NFL injuries:', error);
    return [];
  }
}

// MLB Injury Analysis
async function analyzeMLBInjuries() {
  const injuries = [];

  try {
    // MLB injuries focus on:
    // 1. Starting pitcher - direct game impact
    // 2. Star batter - lineup change impact
    // 3. Closer - bullpen impact
    // 4. Position player depth

    return injuries;
  } catch (error) {
    console.error('Error analyzing MLB injuries:', error);
    return [];
  }
}

// Calculate injury severity
export function calculateInjurySeverity(statusString) {
  const status = statusString.toLowerCase();

  if (status.includes('out')) {
    return { severity: 100, label: 'Out', confidence: 0.95 };
  }
  if (status.includes('doubtful')) {
    return { severity: 70, label: 'Doubtful', confidence: 0.60 };
  }
  if (status.includes('day-to-day') || status.includes('day to day')) {
    return { severity: 40, label: 'Day-to-Day', confidence: 0.45 };
  }
  if (status.includes('probable')) {
    return { severity: 20, label: 'Probable', confidence: 0.80 };
  }
  if (status.includes('questionable')) {
    return { severity: 50, label: 'Questionable', confidence: 0.50 };
  }

  return { severity: 0, label: 'Healthy', confidence: 1.0 };
}

// Calculate impact on team performance
export function calculateTeamImpact(playerPPG, playerAPG, playerRPG, backupStats) {
  const ppgDelta = playerPPG - backupStats.ppg;
  const apgDelta = playerAPG - backupStats.apg;
  const rpgDelta = playerRPG - backupStats.rpg;

  // Weighted impact score
  const impactScore = (ppgDelta * 0.5) + (apgDelta * 0.3) + (rpgDelta * 0.2);

  return {
    ppgDelta,
    apgDelta,
    rpgDelta,
    totalImpactScore: Math.abs(impactScore),
    severity: impactScore > 10 ? 'High' : impactScore > 5 ? 'Medium' : 'Low'
  };
}

// Predict backup performance
export function predictBackupPerformance(backupNormalStats, extraMinutes) {
  // Assuming 5 point increase per 10 minutes for scoring props
  const minuteIncrease = extraMinutes * 0.5; // Conservative estimate

  return {
    normalPPG: backupNormalStats.ppg,
    projectedPPG: backupNormalStats.ppg + minuteIncrease,
    minuteIncrease,
    propLine: backupNormalStats.propLine || backupNormalStats.ppg - 1,
    likelihood: 'High' // If minutes are confirmed
  };
}
