// Calculation utilities for statistics and math

// Calculate standard deviation
export function standardDeviation(values) {
  if (values.length === 0) return 0;

  const mean = values.reduce((a, b) => a + b) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / values.length;

  return Math.sqrt(avgSquareDiff);
}

// Calculate Z-score
export function zScore(value, mean, stdDev) {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

// Calculate win probability from point spread
export function winProbabilityFromSpread(spread) {
  // Approximate conversion from points to win probability
  // 3-point spread ≈ 55% win probability, etc.
  return 0.5 + (spread / 10) * 0.05;
}

// Calculate Expected Value
export function calculateEV(winProb, odds) {
  // American odds to decimal
  const decimalOdds = odds < 0 ? 1 + (100 / Math.abs(odds)) : 1 + (odds / 100);

  // EV = (Win Prob * (Odds - 1)) - (Loss Prob * 1)
  const ev = (winProb * (decimalOdds - 1)) - ((1 - winProb) * 1);

  return ev.toFixed(4);
}

// Calculate Kelly Criterion (optimal bet sizing)
export function kellyCriterion(winProb, odds) {
  // Kelly % = (BP - Q) / B
  // B = odds - 1, P = win prob, Q = 1 - P

  const b = odds < 0 ? Math.abs(odds) / 100 : odds / 100;
  const p = winProb;
  const q = 1 - p;

  const kelly = (b * p - q) / b;

  // Cap at 25% to avoid overestimation
  return Math.min(Math.max(kelly, 0), 0.25);
}

// Calculate moving average
export function movingAverage(values, period) {
  if (values.length < period) return values;

  const result = [];
  for (let i = 0; i <= values.length - period; i++) {
    const window = values.slice(i, i + period);
    const avg = window.reduce((a, b) => a + b) / period;
    result.push(avg);
  }

  return result;
}

// Calculate momentum (trend)
export function calculateMomentum(values, period = 10) {
  if (values.length < period) return 0;

  const recent = values.slice(-period);
  const older = values.slice(-period * 2, -period);

  const recentAvg = recent.reduce((a, b) => a + b) / period;
  const olderAvg = older.reduce((a, b) => a + b) / period;

  return ((recentAvg - olderAvg) / olderAvg) * 100;
}

// Calculate win rate
export function calculateWinRate(wins, total) {
  if (total === 0) return 0;
  return (wins / total * 100).toFixed(2);
}

// Calculate ROI
export function calculateROI(wins, losses, avgOdds = -110) {
  const totalBets = wins + losses;
  if (totalBets === 0) return 0;

  // -110 odds: Win = +100/110, Loss = -100/110
  const oddsMultiplier = avgOdds < 0 ? 100 / Math.abs(avgOdds) : avgOdds / 100;

  const winUnits = wins * oddsMultiplier;
  const lossUnits = losses * 1.0;

  const roi = ((winUnits - lossUnits) / totalBets) * 100;

  return roi.toFixed(2);
}

// Calculate confidence interval (95%)
export function confidenceInterval(mean, stdDev, sampleSize) {
  const marginOfError = 1.96 * (stdDev / Math.sqrt(sampleSize));

  return {
    lower: (mean - marginOfError).toFixed(2),
    upper: (mean + marginOfError).toFixed(2),
    marginOfError: marginOfError.toFixed(2)
  };
}

// Calculate point differential impact
export function pointDiffentialImpact(pointDiff, gamesPlayed = 20) {
  // Teams with -5 or worse point diff typically regress
  // Calculate regression probability

  if (pointDiff >= -1) return 0;
  if (pointDiff <= -10) return 0.85; // 85% likely to regress

  return (Math.abs(pointDiff) - 1) / 9 * 0.85;
}

// Convert between pace and game length
export function adjustForPace(stat, teamPace, leagueAveragePace = 100) {
  return stat * (leagueAveragePace / teamPace);
}

// Calculate usage impact
export function usageImpact(usagePercent, previousUsage) {
  const increase = usagePercent - previousUsage;

  // Rough estimate: 1% usage = 1-1.5 additional points per 36 minutes
  // Adjust based on player role
  return increase * 1.2;
}
