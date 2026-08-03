// Bets model for database operations
import { sql } from '@vercel/postgres';

export async function recordBet(betData) {
  try {
    const result = await sql`
      INSERT INTO bets 
      (edge_id, sport, player_name, team_name, bet_type, book, odds, edge_confidence, status)
      VALUES 
      (${betData.edgeId}, ${betData.sport}, ${betData.player}, ${betData.team}, ${betData.type}, ${betData.book}, ${betData.odds}, ${betData.confidence}, 'pending')
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error recording bet:', error);
    return null;
  }
}

export async function updateBetResult(betId, result, winAmount = null) {
  try {
    const updateResult = await sql`
      UPDATE bets
      SET status = ${result}, win_amount = ${winAmount}, resolved_at = CURRENT_TIMESTAMP
      WHERE id = ${betId}
      RETURNING *
    `;
    return updateResult.rows[0];
  } catch (error) {
    console.error('Error updating bet:', error);
    return null;
  }
}

export async function getUserBets(status = null, days = 30) {
  try {
    let query = sql`
      SELECT * FROM bets
      WHERE placed_at >= NOW() - INTERVAL '${days} days'
    `;
    
    if (status) {
      query = sql`
        SELECT * FROM bets
        WHERE placed_at >= NOW() - INTERVAL '${days} days'
        AND status = ${status}
      `;
    }
    
    query = sql`...ORDER BY placed_at DESC`;
    const result = await query;
    return result.rows;
  } catch (error) {
    console.error('Error getting user bets:', error);
    return [];
  }
}

export async function calculateStats(days = 30) {
  try {
    const result = await sql`
      SELECT
        COUNT(*) as total_bets,
        SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN status = 'push' THEN 1 ELSE 0 END) as pushes,
        ROUND(AVG(edge_confidence), 2) as avg_confidence,
        ROUND((SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END)::decimal / COUNT(*)) * 100, 2) as win_rate
      FROM bets
      WHERE placed_at >= NOW() - INTERVAL '${days} days'
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error calculating stats:', error);
    return null;
  }
}

export async function calculateROI(days = 30) {
  try {
    // -110 odds: win = +0.909, loss = -1.0
    const result = await sql`
      SELECT
        SUM(CASE WHEN status = 'won' THEN 0.909 ELSE -1.0 END) as roi_units,
        COUNT(*) as total_bets
      FROM bets
      WHERE placed_at >= NOW() - INTERVAL '${days} days' AND status != 'push'
    `;
    
    const data = result.rows[0];
    return {
      roiUnits: data.roi_units || 0,
      roiPercent: data.total_bets > 0 ? ((data.roi_units / data.total_bets) * 100).toFixed(2) : 0,
      totalBets: data.total_bets
    };
  } catch (error) {
    console.error('Error calculating ROI:', error);
    return { roiUnits: 0, roiPercent: 0, totalBets: 0 };
  }
}

export async function getBetsByConfidence(minConfidence = 75) {
  try {
    const result = await sql`
      SELECT * FROM bets
      WHERE edge_confidence >= ${minConfidence} AND status = 'pending'
      ORDER BY edge_confidence DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error getting bets by confidence:', error);
    return [];
  }
}
