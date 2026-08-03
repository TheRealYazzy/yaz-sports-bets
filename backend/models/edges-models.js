// Edges model for database operations
import { sql } from '@vercel/postgres';

export async function recordEdge(edgeData) {
  try {
    const result = await sql`
      INSERT INTO edges 
      (sport, edge_type, player_name, team_name, opponent_name, edge_description, prediction, confidence, sample_size, historical_hit_rate, prop_line, predicted_value, status)
      VALUES 
      (${edgeData.sport}, ${edgeData.type}, ${edgeData.player}, ${edgeData.team}, ${edgeData.opponent}, ${edgeData.edge}, ${edgeData.prediction}, ${edgeData.confidence}, ${edgeData.sampleSize}, ${edgeData.hitRate}, ${edgeData.propLine}, ${edgeData.predictedValue}, 'active')
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error recording edge:', error);
    return null;
  }
}

export async function getTodayEdges(sport = null, minConfidence = 75) {
  try {
    let query;
    if (sport && sport !== 'all') {
      query = sql`
        SELECT * FROM edges
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        AND confidence >= ${minConfidence}
        AND sport = ${sport}
        AND status = 'active'
        ORDER BY confidence DESC
      `;
    } else {
      query = sql`
        SELECT * FROM edges
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        AND confidence >= ${minConfidence}
        AND status = 'active'
        ORDER BY confidence DESC
      `;
    }
    
    const result = await query;
    return result.rows;
  } catch (error) {
    console.error('Error getting today edges:', error);
    return [];
  }
}

export async function getEdgesByType(edgeType, days = 30) {
  try {
    const result = await sql`
      SELECT * FROM edges
      WHERE edge_type = ${edgeType}
      AND created_at >= NOW() - INTERVAL '${days} days'
      ORDER BY created_at DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error getting edges by type:', error);
    return [];
  }
}

export async function getEdgeAccuracy(edgeType) {
  try {
    const result = await sql`
      SELECT * FROM edge_accuracy
      WHERE edge_type = ${edgeType}
      LIMIT 1
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting edge accuracy:', error);
    return null;
  }
}

export async function updateEdgeAccuracy(edgeType, sport, hitRate, sampleSize) {
  try {
    const result = await sql`
      INSERT INTO edge_accuracy (edge_type, sport, total_edges_tested, edges_that_hit, hit_rate, sample_size, confidence_score)
      VALUES (${edgeType}, ${sport}, ${sampleSize}, ${Math.round(sampleSize * hitRate)}, ${hitRate}, ${sampleSize}, ${Math.round(hitRate * 100)})
      ON CONFLICT (edge_type, sport) DO UPDATE SET
      total_edges_tested = ${sampleSize},
      edges_that_hit = ${Math.round(sampleSize * hitRate)},
      hit_rate = ${hitRate},
      sample_size = ${sampleSize},
      confidence_score = ${Math.round(hitRate * 100)},
      updated_at = CURRENT_TIMESTAMP
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error updating edge accuracy:', error);
    return null;
  }
}

export async function expireOldEdges(hoursOld = 24) {
  try {
    const result = await sql`
      UPDATE edges
      SET status = 'expired'
      WHERE created_at < NOW() - INTERVAL '${hoursOld} hours'
      AND status = 'active'
    `;
    return result.rowCount;
  } catch (error) {
    console.error('Error expiring edges:', error);
    return 0;
  }
}

export async function getEdgeStats() {
  try {
    const result = await sql`
      SELECT
        COUNT(*) as total_edges,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_edges,
        AVG(confidence) as avg_confidence,
        MAX(confidence) as max_confidence,
        COUNT(DISTINCT edge_type) as edge_types
      FROM edges
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error getting edge stats:', error);
    return null;
  }
}
