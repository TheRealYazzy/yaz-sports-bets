// Dashboard Component - Performance tracking

export function updateDashboard(stats) {
  updatePeriodStats('today', stats.today);
  updatePeriodStats('week', stats.week);
  updatePeriodStats('month', stats.month);
}

function updatePeriodStats(period, stats) {
  if (!stats) return;

  const taken = stats.total || 0;
  const wins = stats.wins || 0;
  const losses = stats.losses || 0;

  // Calculate ROI (-110 odds)
  const roi = taken === 0 ? 0 : ((wins / taken) * 0.95 - (losses / taken) * 1.05) * 100;

  document.getElementById(`${period}Taken`).textContent = taken;
  document.getElementById(`${period}Wins`).textContent = wins;
  document.getElementById(`${period}Losses`).textContent = losses;
  document.getElementById(`${period}ROI`).textContent = `ROI: ${roi.toFixed(1)}%`;
}

// Create stats card
export function createStatsCard(period, stats) {
  const taken = stats.total || 0;
  const wins = stats.wins || 0;
  const losses = stats.losses || 0;
  const roi = taken === 0 ? 0 : ((wins / taken) * 0.95 - (losses / taken) * 1.05) * 100;

  return `
    <div class="stat-card">
      <h3>${formatPeriodLabel(period)}</h3>
      <p class="stat-value">${taken}</p>
      <p class="stat-label">taken</p>
      <div class="stat-row">
        <span class="stat-win">✅ ${wins}</span>
        <span class="stat-loss">❌ ${losses}</span>
      </div>
      <p class="roi" style="${roi >= 0 ? 'color: #10b981;' : 'color: #ef4444;'}">${roi >= 0 ? '📈' : '📉'} ROI: ${roi.toFixed(1)}%</p>
    </div>
  `;
}

function formatPeriodLabel(period) {
  const labels = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
    allTime: 'All Time'
  };
  return labels[period] || period;
}

// Calculate and display win rate
export function calculateWinRate(wins, total) {
  if (total === 0) return '0%';
  return `${(wins / total * 100).toFixed(1)}%`;
}

// Calculate hot streak
export function calculateHotStreak(recentBets) {
  if (!recentBets || recentBets.length === 0) return 0;

  let streak = 0;
  for (let i = recentBets.length - 1; i >= 0; i--) {
    if (recentBets[i].status === 'won') {
      streak++;
    } else if (recentBets[i].status === 'lost') {
      break;
    }
  }

  return streak;
}

// Get dashboard insights
export function generateDashboardInsights(stats) {
  const insights = [];

  if (!stats || !stats.month) return insights;

  const { total, wins, losses } = stats.month;
  const winRate = wins / total;
  const roi = ((wins / total) * 0.95 - (losses / total) * 1.05) * 100;

  // Insight 1: Performance level
  if (winRate >= 0.55) {
    insights.push({
      type: 'positive',
      icon: '🟢',
      message: 'Your win rate is above 55% - excellent consistency!'
    });
  } else if (winRate >= 0.52) {
    insights.push({
      type: 'positive',
      icon: '🟡',
      message: 'Win rate is positive. Keep tracking to identify best edge types.'
    });
  } else {
    insights.push({
      type: 'warning',
      icon: '🔴',
      message: 'Win rate below 52%. Consider refining your strategy.'
    });
  }

  // Insight 2: ROI performance
  if (roi > 5) {
    insights.push({
      type: 'positive',
      icon: '💰',
      message: `Strong ROI at ${roi.toFixed(1)}%. Maintain current strategy.`
    });
  } else if (roi > 0) {
    insights.push({
      type: 'neutral',
      icon: '📊',
      message: `ROI is ${roi.toFixed(1)}%. Growing edge quality over time.`
    });
  }

  // Insight 3: Volume recommendation
  if (total < 20) {
    insights.push({
      type: 'neutral',
      icon: '📈',
      message: 'Need more data points. Track more bets for statistical confidence.'
    });
  }

  return insights;
}

// Render insights
export function renderInsights(insights) {
  if (!insights || insights.length === 0) {
    return '<p style="color: #a0a0a0;">No insights available yet. Start tracking bets!</p>';
  }

  return insights
    .map(insight => `
      <div style="background: #0f3460; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid ${
        insight.type === 'positive' ? '#10b981' :
        insight.type === 'warning' ? '#ef4444' : '#f59e0b'
      };">
        <p style="margin: 0; font-size: 13px;">
          ${insight.icon} ${insight.message}
        </p>
      </div>
    `)
    .join('');
}
