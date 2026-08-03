// Hourly scraping and edge detection job
import { detectEdges } from '../engines/edgeDetection.js';

export async function runHourlyJob() {
  console.log(`[${new Date().toISOString()}] Starting hourly edge detection job...`);

  try {
    // 1. Scrape latest data from all sources
    console.log('📥 Fetching latest data...');
    
    // Would call:
    // - NBA API for scores, injuries, player stats
    // - NFL API for games, injuries, weather
    // - MLB API for games, injuries, pitcher matchups
    // - Sportsbook lines (DraftKings, FanDuel, Bovada)

    // 2. Detect edges
    console.log('🔍 Detecting edges...');
    const edges = await detectEdges({
      sport: 'all',
      minConfidence: 75
    });

    // 3. Store in database (would connect to Vercel Postgres)
    console.log(`✅ Found ${edges.length} edges`);

    // 4. Send notifications (future feature)
    if (edges.length > 0) {
      const topEdge = edges[0];
      console.log(`🎯 Top edge: ${topEdge.player} - ${topEdge.confidence}% confidence`);
    }

    console.log(`[${new Date().toISOString()}] Hourly job completed`);
    return { status: 'success', edgesFound: edges.length };

  } catch (error) {
    console.error('Hourly job error:', error);
    return { status: 'error', error: error.message };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runHourlyJob().then(result => {
    console.log('Result:', result);
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
