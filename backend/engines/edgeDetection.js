import axios from 'axios';
import { calculateConfidence } from './confidence.js';
import { analyzeMatchup } from './matchups.js';
import { analyzeInjuries } from './injuries.js';
import { analyzeTrends } from './trends.js';

// Main edge detection function
export async function detectEdges(options = {}) {
  const { sport = 'all', minConfidence = 75, date = new Date() } = options;

  const edges = [];

  try {
    // 1. INJURY IMPACT EDGES
    const injuryEdges = await detectInjuryEdges(sport);
    edges.push(...injuryEdges);

    // 2. MATCHUP EDGES
    const matchupEdges = await detectMatchupEdges(sport);
    edges.push(...matchupEdges);

    // 3. USAGE/ROLE EDGES
    const usageEdges = await detectUsageEdges(sport);
    edges.push(...usageEdges);

    // 4. STATISTICAL ANOMALIES
    const statEdges = await detectStatisticialEdges(sport);
    edges.push(...statEdges);

    // 5. ENVIRONMENTAL EDGES
    const envEdges = await detectEnvironmentalEdges(sport);
    edges.push(...envEdges);

    // 6. REST ADVANTAGE
    const restEdges = await detectRestEdges(sport);
    edges.push(...restEdges);

    // 7. HOME/AWAY SPLIT EDGES
    const homeAwayEdges = await detectHomeAwayEdges(sport);
    edges.push(...homeAwayEdges);

    // Filter by minimum confidence
    const filteredEdges = edges.filter(edge => edge.confidence >= minConfidence);

    return filteredEdges;
  } catch (error) {
    console.error('Error in edge detection:', error);
    return [];
  }
}

// 1. INJURY IMPACT EDGES
async function detectInjuryEdges(sport) {
  const edges = [];
  try {
    const injuryData = await analyzeInjuries(sport);
    
    injuryData.forEach(injury => {
      if (injury.impactScore > 7) { // High impact injury
        edges.push({
          type: 'Injury Impact',
          sport: injury.sport,
          player: injury.player,
          team: injury.team,
          status: injury.status,
          impactScore: injury.impactScore,
          edge: `${injury.team} losing ${injury.player} (${injury.status}) - team will perform worse`,
          confidence: calculateConfidence({
            edgeType: 'injury',
            sampleSize: injury.sampleSize,
            historicalHitRate: injury.historicalHitRate
          }),
          prediction: 'Team performance down, backup production up',
          timestamp: new Date()
        });
      }
    });
  } catch (error) {
    console.error('Error detecting injury edges:', error);
  }
  return edges;
}

// 2. MATCHUP EDGES
async function detectMatchupEdges(sport) {
  const edges = [];
  try {
    const matchups = await analyzeMatchup(sport);
    
    matchups.forEach(matchup => {
      if (matchup.mismatchScore > 65) { // Significant mismatch
        edges.push({
          type: 'Positional Mismatch',
          sport: matchup.sport,
          player: matchup.offensivePlayer,
          defender: matchup.defensivePlayer,
          edge: `${matchup.offensivePlayer} (elite scorer) guarded by ${matchup.defensivePlayer} (defensive liability)`,
          mismatchScore: matchup.mismatchScore,
          confidence: calculateConfidence({
            edgeType: 'matchup',
            sampleSize: matchup.sampleSize,
            historicalHitRate: matchup.historicalHitRate
          }),
          prediction: `${matchup.offensivePlayer} likely to have above-average game`,
          avgPointsInMismatch: matchup.avgPoints,
          propLine: matchup.propLine,
          timestamp: new Date()
        });
      }
    });
  } catch (error) {
    console.error('Error detecting matchup edges:', error);
  }
  return edges;
}

// 3. USAGE/ROLE EDGES
async function detectUsageEdges(sport) {
  const edges = [];
  try {
    const usageData = await fetchUsageData(sport);
    
    usageData.forEach(player => {
      const usageChange = player.usageCurrentWeek - player.usagePreviousMonth;
      
      if (usageChange > 5) { // Usage spike of 5%+
        edges.push({
          type: 'Usage Rate Spike',
          sport: player.sport,
          player: player.name,
          team: player.team,
          position: player.position,
          previousUsage: player.usagePreviousMonth,
          currentUsage: player.usageCurrentWeek,
          usageChange,
          edge: `${player.name} usage up ${usageChange.toFixed(1)}% - likely minutes increase`,
          confidence: calculateConfidence({
            edgeType: 'usage',
            sampleSize: 10,
            historicalHitRate: 0.68
          }),
          prediction: 'Scoring props likely to go over',
          propLine: player.propLine,
          timestamp: new Date()
        });
      }
    });
  } catch (error) {
    console.error('Error detecting usage edges:', error);
  }
  return edges;
}

// 4. STATISTICAL ANOMALIES
async function detectStatisticialEdges(sport) {
  const edges = [];
  try {
    const trends = await analyzeTrends(sport);
    
    trends.forEach(team => {
      // Negative point differential regression
      if (team.wins >= 10 && team.pointDifferential < -5) {
        edges.push({
          type: 'Negative Point Differential Regression',
          sport: team.sport,
          team: team.name,
          record: `${team.wins}-${team.losses}`,
          pointDifferential: team.pointDifferential,
          edge: `${team.name} winning despite negative point diff - regression likely`,
          confidence: calculateConfidence({
            edgeType: 'regression',
            sampleSize: 50,
            historicalHitRate: 0.73
          }),
          prediction: 'Team likely to lose next games / hit unders',
          timestamp: new Date()
        });
      }

      // High efficiency trends
      if (team.efgTrend > 3 && team.recentGames > 15) {
        edges.push({
          type: 'Efficiency Trend',
          sport: team.sport,
          team: team.name,
          efgTrend: team.efgTrend,
          edge: `${team.name} eFG% trending +${team.efgTrend.toFixed(1)}% - hot shooting`,
          confidence: calculateConfidence({
            edgeType: 'trend',
            sampleSize: 20,
            historicalHitRate: 0.65
          }),
          prediction: 'Team likely to beat spread, overs more likely',
          timestamp: new Date()
        });
      }
    });
  } catch (error) {
    console.error('Error detecting statistical edges:', error);
  }
  return edges;
}

// 5. ENVIRONMENTAL EDGES
async function detectEnvironmentalEdges(sport) {
  const edges = [];
  try {
    if (sport === 'nfl' || sport === 'all') {
      const weatherData = await fetchWeatherData();
      
      weatherData.forEach(game => {
        if (game.windSpeed > 15) {
          edges.push({
            type: 'Weather Impact (Wind)',
            sport: 'nfl',
            game: `${game.awayTeam} @ ${game.homeTeam}`,
            windSpeed: game.windSpeed,
            windDirection: game.windDirection,
            edge: `High wind (${game.windSpeed} mph) will impact passing game`,
            confidence: calculateConfidence({
              edgeType: 'weather',
              sampleSize: 38,
              historicalHitRate: 0.65
            }),
            prediction: 'Passing yards under, rushing yards over',
            timestamp: new Date()
          });
        }
      });
    }
  } catch (error) {
    console.error('Error detecting environmental edges:', error);
  }
  return edges;
}

// 6. REST ADVANTAGE
async function detectRestEdges(sport) {
  const edges = [];
  try {
    const scheduleData = await fetchScheduleData(sport);
    
    scheduleData.forEach(game => {
      const restDiff = game.homeTeamRestDays - game.awayTeamRestDays;
      
      if (restDiff >= 2) {
        edges.push({
          type: 'Rest Advantage',
          sport: game.sport,
          game: `${game.awayTeam} @ ${game.homeTeam}`,
          homeTeamRestDays: game.homeTeamRestDays,
          awayTeamRestDays: game.awayTeamRestDays,
          restDifference: restDiff,
          edge: `${game.homeTeam} has ${restDiff} more days rest than ${game.awayTeam}`,
          confidence: calculateConfidence({
            edgeType: 'rest',
            sampleSize: 50,
            historicalHitRate: 0.68
          }),
          prediction: `${game.homeTeam} likely to cover spread by +${(restDiff * 1.5).toFixed(1)} points`,
          timestamp: new Date()
        });
      }
    });
  } catch (error) {
    console.error('Error detecting rest edges:', error);
  }
  return edges;
}

// 7. HOME/AWAY SPLIT
async function detectHomeAwayEdges(sport) {
  const edges = [];
  try {
    const teamStats = await fetchTeamStats(sport);
    
    teamStats.forEach(team => {
      const homeAwayDiff = team.homeWinPct - team.awayWinPct;
      
      if (homeAwayDiff > 0.12) { // 12%+ difference
        edges.push({
          type: 'Home/Away Split',
          sport: team.sport,
          team: team.name,
          homeWinPct: team.homeWinPct,
          awayWinPct: team.awayWinPct,
          difference: homeAwayDiff,
          edge: `${team.name} plays significantly better at home (${(homeAwayDiff * 100).toFixed(1)}% difference)`,
          confidence: calculateConfidence({
            edgeType: 'homeAway',
            sampleSize: 20,
            historicalHitRate: 0.62
          }),
          prediction: `${team.name} home games favorable, away games risky`,
          timestamp: new Date()
        });
      }
    });
  } catch (error) {
    console.error('Error detecting home/away edges:', error);
  }
  return edges;
}

// Helper function to fetch usage data
async function fetchUsageData(sport) {
  try {
    // Placeholder - would connect to NBA/NFL/MLB APIs
    return [];
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return [];
  }
}

// Helper function to fetch weather data
async function fetchWeatherData() {
  try {
    // Placeholder - would fetch from weather API
    return [];
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return [];
  }
}

// Helper function to fetch schedule data
async function fetchScheduleData(sport) {
  try {
    // Placeholder - would fetch from sports APIs
    return [];
  } catch (error) {
    console.error('Error fetching schedule data:', error);
    return [];
  }
}

// Helper function to fetch team stats
async function fetchTeamStats(sport) {
  try {
    // Placeholder - would fetch from sports APIs
    return [];
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return [];
  }
}
