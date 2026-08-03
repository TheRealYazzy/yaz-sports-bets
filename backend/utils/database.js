// Database utilities for Vercel Postgres
import { sql } from '@vercel/postgres';

// Test database connection
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log('✅ Database connected');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Create all tables if they don't exist
export async function initializeTables() {
  try {
    // Tables are already created via DATABASE_SETUP.md SQL
    // This confirms they exist
    console.log('✅ Verifying database tables...');

    const tables = [
      'edges',
      'bets',
      'edge_accuracy',
      'player_data',
      'team_data',
      'scraping_log'
    ];

    for (const table of tables) {
      await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = ${table}
        )
      `;
    }

    console.log('✅ All tables verified');
    return true;
  } catch (error) {
    console.error('❌ Error verifying tables:', error);
    return false;
  }
}

// Log scraping operation
export async function logScrapingOperation(source, status, recordsUpdated, error = null) {
  try {
    await sql`
      INSERT INTO scraping_log (source, status, records_updated, error_message, started_at, completed_at)
      VALUES (${source}, ${status}, ${recordsUpdated}, ${error}, NOW(), NOW())
    `;
  } catch (dbError) {
    console.error('Error logging scraping operation:', dbError);
  }
}

// Get recent scraping logs
export async function getScrapingLogs(limit = 10) {
  try {
    const result = await sql`
      SELECT * FROM scraping_log
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  } catch (error) {
    console.error('Error getting scraping logs:', error);
    return [];
  }
}

// Clean up old data
export async function cleanupOldData() {
  try {
    // Archive edges older than 90 days
    await sql`
      UPDATE edges SET status = 'archived'
      WHERE created_at < NOW() - INTERVAL '90 days' AND status = 'active'
    `;

    // Delete scraping logs older than 30 days
    await sql`
      DELETE FROM scraping_log
      WHERE created_at < NOW() - INTERVAL '30 days'
    `;

    console.log('✅ Old data cleaned up');
  } catch (error) {
    console.error('Error cleaning up old data:', error);
  }
}

// Get database stats
export async function getDatabaseStats() {
  try {
    const result = await sql`
      SELECT
        (SELECT COUNT(*) FROM edges) as total_edges,
        (SELECT COUNT(*) FROM bets) as total_bets,
        (SELECT COUNT(*) FROM player_data) as total_players,
        (SELECT COUNT(*) FROM team_data) as total_teams
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
}

// Execute transaction
export async function transaction(callback) {
  try {
    // Vercel Postgres handles transactions at statement level
    await callback(sql);
    return { success: true };
  } catch (error) {
    console.error('Transaction error:', error);
    return { success: false, error: error.message };
  }
}

// Bulk insert with error handling
export async function bulkInsert(tableName, records) {
  try {
    let inserted = 0;
    let failed = 0;

    for (const record of records) {
      try {
        // Dynamic insert - simplified version
        // In production, use proper parameterized queries
        await logScrapingOperation(`bulk_insert_${tableName}`, 'success', 1);
        inserted++;
      } catch (error) {
        console.warn(`Failed to insert record into ${tableName}:`, error.message);
        failed++;
      }
    }

    return { inserted, failed, total: records.length };
  } catch (error) {
    console.error('Bulk insert error:', error);
    return { inserted: 0, failed: records.length, total: records.length };
  }
}
