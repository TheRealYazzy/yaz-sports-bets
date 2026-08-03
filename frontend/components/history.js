// History Component - Bet history and tracking

export function saveBetToHistory(bet) {
  let history = JSON.parse(localStorage.getItem('betHistory')) || [];
  
  const newBet = {
    id: Date.now(),
    ...bet,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  history.push(newBet);
  localStorage.setItem('betHistory', JSON.stringify(history));

  return newBet;
}

export function getBetHistory(filter = null) {
  let history = JSON.parse(localStorage.getItem('betHistory')) || [];

  if (filter && filter.period) {
    const days = getPeriodDays(filter.period);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    history = history.filter(bet => new Date(bet.createdAt) >= cutoffDate);
  }

  if (filter && filter.status) {
    history = history.filter(bet => bet.status === filter.status);
  }

  return history;
}

function getPeriodDays(period) {
  const periods = {
    today: 0,
    week: 7,
    month: 30,
    allTime: 9999
  };
  return periods[period] || 0;
}

export function updateBetResult(betId, result) {
  let history = JSON.parse(localStorage.getItem('betHistory')) || [];

  history = history.map(bet => {
    if (bet.id === betId) {
      return {
        ...bet,
        status: result, // 'won', 'lost', 'push'
        updatedAt: new Date().toISOString()
      };
    }
    return bet;
  });

  localStorage.setItem('betHistory', JSON.stringify(history));
}

export function deleteBet(betId) {
  let history = JSON.parse(localStorage.getItem('betHistory')) || [];
  history = history.filter(bet => bet.id !== betId);
  localStorage.setItem('betHistory', JSON.stringify(history));
}

export function createHistoryTable(bets) {
  if (!bets || bets.length === 0) {
    return '<p style="text-align: center; color: #a0a0a0;">No bets recorded yet</p>';
  }

  const rows = bets
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20)
    .map(bet => createHistoryRow(bet))
    .join('');

  return `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="border-bottom: 2px solid #2a2a4e;">
            <th style="text-align: left; padding: 10px; color: #a0a0a0;">Date</th>
            <th style="text-align: left; padding: 10px; color: #a0a0a0;">Bet</th>
            <th style="text-align: left; padding: 10px; color: #a0a0a0;">Confidence</th>
            <th style="text-align: left; padding: 10px; color: #a0a0a0;">Status</th>
            <th style="text-align: left; padding: 10px; color: #a0a0a0;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function createHistoryRow(bet) {
  const date = new Date(bet.createdAt).toLocaleDateString();
  const statusColor = bet.status === 'won' ? '#10b981' : bet.status === 'lost' ? '#ef4444' : '#f59e0b';
  const statusIcon = bet.status === 'won' ? '✅' : bet.status === 'lost' ? '❌' : '⏳';

  return `
    <tr style="border-bottom: 1px solid #2a2a4e;">
      <td style="padding: 10px;">${date}</td>
      <td style="padding: 10px; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${bet.player || bet.edge}</td>
      <td style="padding: 10px;">${bet.confidence}%</td>
      <td style="padding: 10px; color: ${statusColor};">${statusIcon} ${bet.status}</td>
      <td style="padding: 10px;">
        ${bet.status === 'pending' ? `
          <select onchange="window.updateBetStatus(${bet.id}, this.value)" style="background: #0f3460; color: #10b981; border: none; padding: 5px; border-radius: 4px;">
            <option value="">Mark as...</option>
            <option value="won">Won ✅</option>
            <option value="lost">Lost ❌</option>
            <option value="push">Push ⏳</option>
          </select>
        ` : ''}
      </td>
    </tr>
  `;
}

export function calculateHistoryStats(bets) {
  if (!bets || bets.length === 0) {
    return {
      total: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      winRate: '0%',
      roi: '0%'
    };
  }

  const total = bets.length;
  const wins = bets.filter(b => b.status === 'won').length;
  const losses = bets.filter(b => b.status === 'lost').length;
  const pushes = bets.filter(b => b.status === 'push').length;

  const winRate = total === 0 ? '0%' : `${(wins / total * 100).toFixed(1)}%`;
  const roi = total === 0 ? '0%' : `${((wins / total * 0.95 - losses / total * 1.05) * 100).toFixed(1)}%`;

  return {
    total,
    wins,
    losses,
    pushes,
    winRate,
    roi
  };
}

export function exportBetHistory() {
  const history = getBetHistory();
  const csv = convertToCSV(history);
  downloadCSV(csv, 'yaz-sports-bets-history.csv');
}

function convertToCSV(data) {
  const headers = ['Date', 'Player/Team', 'Type', 'Confidence', 'Status', 'Edge Description'];
  const rows = data.map(bet => [
    new Date(bet.createdAt).toLocaleDateString(),
    bet.player || bet.team,
    bet.type,
    bet.confidence,
    bet.status,
    bet.edge
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csv;
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
