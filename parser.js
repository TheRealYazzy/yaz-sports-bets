// Parser utilities for normalizing data

// Parse American odds to implied probability
export function parseOdds(oddsString) {
  const odds = parseInt(oddsString);

  if (odds < 0) {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  } else {
    return 100 / (odds + 100);
  }
}

// Format odds from probability
export function formatOdds(probability) {
  if (probability >= 0.5) {
    return -Math.round((probability / (1 - probability)) * 100);
  } else {
    return Math.round(((1 - probability) / probability) * 100);
  }
}

// Parse player stats from various formats
export function normalizePlayerStats(player) {
  return {
    playerId: player.id || player.playerId || '',
    name: player.name || player.fullName || '',
    position: player.position || '',
    team: player.team || '',
    sport: player.sport || '',
    ppg: parseFloat(player.ppg || player.points || 0),
    apg: parseFloat(player.apg || player.assists || 0),
    rpg: parseFloat(player.rpg || player.rebounds || 0),
    gamesPlayed: parseInt(player.gamesPlayed || player.games || 0),
    usageRate: parseFloat(player.usage || player.usageRate || 0),
    efficiency: parseFloat(player.efficiency || player.efficiencyRating || 0)
  };
}

// Parse team stats
export function normalizeTeamStats(team) {
  return {
    teamId: team.id || team.teamId || '',
    name: team.name || team.teamName || '',
    sport: team.sport || '',
    wins: parseInt(team.wins || team.w || 0),
    losses: parseInt(team.losses || team.l || 0),
    winPct: parseFloat(team.winPct || (team.wins / (team.wins + team.losses)).toFixed(3)),
    pointDiff: parseFloat(team.pointDiff || team.pointDifferential || 0),
    offRating: parseFloat(team.offRating || team.offensiveRating || 0),
    defRating: parseFloat(team.defRating || team.defensiveRating || 0),
    netRating: parseFloat(team.netRating || (team.offRating - team.defRating).toFixed(1))
  };
}

// Parse injury status to severity score
export function parseInjurySeverity(status) {
  const s = status.toLowerCase();

  if (s.includes('out')) return { severity: 100, label: 'Out' };
  if (s.includes('doubtful')) return { severity: 70, label: 'Doubtful' };
  if (s.includes('questionable')) return { severity: 50, label: 'Questionable' };
  if (s.includes('day-to-day') || s.includes('day to day')) return { severity: 40, label: 'Day-to-Day' };
  if (s.includes('probable')) return { severity: 20, label: 'Probable' };

  return { severity: 0, label: 'Healthy' };
}

// Parse game score from various formats
export function parseGameResult(game) {
  return {
    gameId: game.id || game.gameId || '',
    homeTeam: game.homeTeam || game.home || '',
    awayTeam: game.awayTeam || game.away || '',
    homeScore: parseInt(game.homeScore || game.home_score || 0),
    awayScore: parseInt(game.awayScore || game.away_score || 0),
    totalScore: parseInt(game.homeScore || 0) + parseInt(game.awayScore || 0),
    winner: parseInt(game.homeScore || 0) > parseInt(game.awayScore || 0) ? 'home' : 'away',
    spread: parseFloat(game.spread || 0)
  };
}

// Parse weather data
export function parseWeather(weatherData) {
  return {
    temp: parseFloat(weatherData.temp || weatherData.main?.temp || 0),
    feelsLike: parseFloat(weatherData.feelsLike || weatherData.main?.feels_like || 0),
    windSpeed: parseFloat(weatherData.windSpeed || weatherData.wind?.speed || 0),
    windDirection: parseInt(weatherData.windDirection || weatherData.wind?.deg || 0),
    conditions: weatherData.conditions || weatherData.weather?.[0]?.main || 'Unknown',
    precipitation: parseFloat(weatherData.precipitation || weatherData.rain?.['1h'] || 0),
    humidity: parseInt(weatherData.humidity || weatherData.main?.humidity || 0)
  };
}

// Validate player stats
export function validatePlayerStats(player) {
  const errors = [];

  if (!player.name) errors.push('Missing player name');
  if (!player.sport) errors.push('Missing sport');
  if (player.ppg < 0 || player.ppg > 80) errors.push('Invalid PPG');
  if (player.gamesPlayed < 0) errors.push('Invalid games played');

  return { valid: errors.length === 0, errors };
}

// Validate team stats
export function validateTeamStats(team) {
  const errors = [];

  if (!team.name) errors.push('Missing team name');
  if (!team.sport) errors.push('Missing sport');
  if (team.wins < 0) errors.push('Invalid wins');
  if (team.losses < 0) errors.push('Invalid losses');

  return { valid: errors.length === 0, errors };
}

// Sanitize string data
export function sanitize(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 255);
}
