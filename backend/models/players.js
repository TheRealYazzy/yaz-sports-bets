// Player model for database operations
import { sql } from '@vercel/postgres';

export async function getPlayer(playerId, sport) {
  try {
    const result = await sql`
      SELECT * FROM player_data
      WHERE player_id = ${playerId} AND sport = ${sport}
      LIMIT 1
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting player:', error);
    return null;
  }
}

export async function updatePlayerStats(playerData) {
  try {
    const result = await sql`
      INSERT INTO player_data 
      (player_id, player_name, sport, position, team, games_played, ppg, apg, rpg, usage_rate, efficiency_rating, last_10_games_ppg, injury_status)
      VALUES 
      (${playerData.playerId}, ${playerData.name}, ${playerData.sport}, ${playerData.position}, ${playerData.team}, ${playerData.gamesPlayed}, ${playerData.ppg}, ${playerData.apg}, ${playerData.rpg}, ${playerData.usageRate}, ${playerData.efficiency}, ${playerData.last10Ppg}, ${playerData.injuryStatus})
      ON CONFLICT (player_id, sport) DO UPDATE SET
      games_played = ${playerData.gamesPlayed},
      ppg = ${playerData.ppg},
      apg = ${playerData.apg},
      rpg = ${playerData.rpg},
      usage_rate = ${playerData.usageRate},
      efficiency_rating = ${playerData.efficiency},
      last_10_games_ppg = ${playerData.last10Ppg},
      injury_status = ${playerData.injuryStatus},
      updated_at = CURRENT_TIMESTAMP
    `;
    return result;
  } catch (error) {
    console.error('Error updating player stats:', error);
    return null;
  }
}

export async function getPlayersByTeam(teamId, sport) {
  try {
    const result = await sql`
      SELECT * FROM player_data
      WHERE team = ${teamId} AND sport = ${sport}
      ORDER BY ppg DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error getting players by team:', error);
    return [];
  }
}

export async function getPlayerInjuries(sport) {
  try {
    const result = await sql`
      SELECT * FROM player_data
      WHERE sport = ${sport} AND injury_status != 'Healthy'
      ORDER BY updated_at DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error getting player injuries:', error);
    return [];
  }
}
