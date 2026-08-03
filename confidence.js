// Confidence scoring algorithm
export function calculateConfidence(params) {
  const {
    edgeType,
    sampleSize = 20,
    historicalHitRate = 0.55,
    recencyBoost = 0,
    multipleEdges = false,
    lineMisspricing = 0,
    publicBiasFade = false,
    recentTrendStrength = 0,
    weatherImpact = false,
    injuryUncertainty = false
  } = params;

  let confidence = 50; // Base score

  // 1. Edge type base confidence (from backtesting)
  const edgeBaseScores = {
    injury: 35,
    matchup: 30,
    usage: 25,
    regression: 28,
    trend: 20,
    weather: 15,
    rest: 18,
    homeAway: 12,
    pace: 14,
    motivation: 10,
    primetime: 8
  };

  confidence += edgeBaseScores[edgeType] || 15;

  // 2. Sample size adjustment
  if (sampleSize >= 50) {
    confidence += 15;
  } else if (sampleSize >= 20) {
    confidence += 8;
  } else if (sampleSize >= 10) {
    confidence += 4;
  } else {
    confidence -= 10; // Small sample = risky
  }

  // 3. Historical hit rate
  // Formula: (hitRate - 50%) * 100 = basis points of edge
  const hitRateBps = (historicalHitRate - 0.5) * 100;
  confidence += hitRateBps / 10; // Scale down for confidence score

  // 4. Recency boost (recent trends matter more)
  if (recencyBoost > 0) {
    confidence += recencyBoost * 2;
  }

  // 5. Multiple edges concurring (strong signal)
  if (multipleEdges) {
    confidence += 12;
  }

  // 6. Line mispricing (positive EV)
  if (lineMisspricing > 3) {
    confidence += 10;
  } else if (lineMisspricing > 1) {
    confidence += 5;
  }

  // 7. Public bias fade (sharp money indicator)
  if (publicBiasFade) {
    confidence += 8;
  }

  // 8. Recent trend strength
  if (recentTrendStrength > 2) {
    confidence += 10;
  } else if (recentTrendStrength > 1) {
    confidence += 5;
  }

  // 9. Environmental factor (weather helps NFL/MLB)
  if (weatherImpact) {
    confidence += 6;
  }

  // 10. Injury uncertainty (reduces confidence)
  if (injuryUncertainty) {
    confidence -= 8;
  }

  // Cap between 0 and 99
  confidence = Math.max(0, Math.min(99, confidence));

  return Math.round(confidence);
}

// Determine risk level based on confidence
export function getRiskLevel(confidence) {
  if (confidence >= 85) return 'Low';
  if (confidence >= 75) return 'Medium';
  if (confidence >= 65) return 'Medium-High';
  return 'High';
}

// Calculate expected value
export function calculateExpectedValue(confidence, odds) {
  // Assuming American odds format
  const impliedProbability = odds < 0 
    ? Math.abs(odds) / (Math.abs(odds) + 100)
    : 100 / (odds + 100);

  const predictedWinRate = confidence / 100;
  const expectedValue = (predictedWinRate * 0.95) + ((1 - predictedWinRate) * -1.05);

  return {
    impliedProbability: (impliedProbability * 100).toFixed(2),
    predictedWinRate: (predictedWinRate * 100).toFixed(2),
    expectedValue: (expectedValue * 100).toFixed(2),
    verdict: expectedValue > 0 ? 'POSITIVE EV' : 'NEGATIVE EV'
  };
}
