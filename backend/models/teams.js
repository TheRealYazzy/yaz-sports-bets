// Team model for database operations
import { sql } from '@vercel/postgres';

export async function getTeam(teamId, sport) {
  try {
    const result = await sql`
      SELECT * FROM team_data
      WHERE team_id = ${teamId} AND sport = ${sport}
      LIMIT 1
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting team:', error);
    return null;
  }
}

export async function updateTeamStats(teamData) {
  try {
    const result = await sql`
      INSERT INTO team_data 
      (team_id, team_name, sport, wins, losses, win_pct, point_differential, offensive_rating, defensive_rating, net_rating, pace, last_10_record, last_10_ppg, home_record, away_record)
      VALUES 
      (${teamData.teamId}, ${teamData.name}, ${teamData.sport}, ${teamData.wins}, ${teamData.losses}, ${teamData.winPct}, ${teamData.pointDiff}, ${teamData.offRating}, ${teamData.defRating}, ${teamData.netRating}, ${teamData.pace}, ${teamData.last10Record}, ${teamData.last10Ppg}, ${teamData.homeRecord}, ${teamData.awayRecord})
      ON CONFLICT (team_id, sport) DO UPDATE SET
      wins = ${teamData.wins},
      losses = ${teamData.losses},
      win_pct = ${teamData.winPct},
      point_differential = ${teamData.pointDiff},
      offensive_rating = ${teamData.offRating},
      defensive_rating = ${teamData.defRating},
      net_rating = ${teamData.netRating},
      pace = ${teamData.pace},
      last_10_record = ${teamData.last10Record},
      last_10_ppg = ${teamData.last10Ppg},
      home_record = ${teamData.homeRecord},
      away_record = ${teamData.awayRecord},
      updated_at = CURRENT_TIMESTAMP
    `;
    return result;
  } catch (error) {
    console.error('Error updating team stats:', error);
    return null;
  }
}

export async function getAllTeams(sport) {
  try {
    const result = await sql`
      SELECT * FROM team_data
      WHERE sport = ${sport}
      ORDER BY win_pct DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error getting all teams:', error);
    return [];
  }
}

export async function getTeamsByRecord(sport, minWins, maxWins) {
  try {
    const result = await sql`
      SELECT * FROM team_data
      WHERE sport = ${sport} AND wins >= ${minWins} AND wins <= ${maxWins}
      ORDER BY wins DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error getting teams by record:', error);
    return [];
  }
}
