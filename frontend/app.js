// Yaz Sports Bets - Frontend Application
// Main app logic

// API Base URL
const API_BASE = '/api';

// State
let currentEdges = [];
let betHistory = JSON.parse(localStorage.getItem('betHistory')) || [];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Yaz Sports Bets Initialized');
    
    // Event listeners
    document.getElementById('refreshBtn').addEventListener('click', refreshEdges);
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('historyBtn').addEventListener('click', openHistory);
    
    document.getElementById('sportFilter').addEventListener('change', filterEdges);
    document.getElementById('confidenceFilter').addEventListener('change', filterEdges);
    document.getElementById('edgeTypeFilter').addEventListener('change', filterEdges);
    
    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('edgeModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Initial load
    refreshEdges();
    
    // Auto-refresh every hour
    setInterval(refreshEdges, 3600000);
    
    // Update stats every minute
    setInterval(updateStats, 60000);
    updateStats();
});

// Fetch and display edges
async function refreshEdges() {
    const statusIndicator = document.getElementById('statusIndicator');
    statusIndicator.textContent = 'Loading...';
    statusIndicator.className = 'status-loading';

    try {
        const sport = document.getElementById('sportFilter').value;
        const confidence = document.getElementById('confidenceFilter').value;
        
        const response = await fetch(`${API_BASE}/edges/today?sport=${sport}&confidence=${confidence}`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        currentEdges = data.edges || [];
        
        console.log(`📊 Found ${currentEdges.length} edges`);
        
        // Update UI
        displayEdges(currentEdges);
        document.getElementById('edgeCount').textContent = `${currentEdges.length} edges found`;
        document.getElementById('lastUpdate').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        
        statusIndicator.textContent = 'Ready';
        statusIndicator.className = 'status-ready';
        
    } catch (error) {
        console.error('Error fetching edges:', error);
        document.getElementById('edgesList').innerHTML = `
            <div class="loading-placeholder">
                <p>❌ Failed to load edges</p>
                <p style="font-size: 12px; color: #a0a0a0;">${error.message}</p>
            </div>
        `;
        
        statusIndicator.textContent = 'Error';
        statusIndicator.className = 'status-error';
    }
}

// Display edges in grid
function displayEdges(edges) {
    const edgesList = document.getElementById('edgesList');
    
    if (!edges || edges.length === 0) {
        edgesList.innerHTML = `
            <div class="loading-placeholder">
                <p>No edges found matching your criteria</p>
            </div>
        `;
        return;
    }
    
    edgesList.innerHTML = edges.map(edge => createEdgeCard(edge)).join('');
    
    // Add event listeners to cards
    document.querySelectorAll('.edge-card').forEach(card => {
        card.addEventListener('click', () => showEdgeDetails(card.dataset.edgeIndex));
    });
    
    // Add action button listeners
    document.querySelectorAll('.btn-take').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            recordBet(btn.dataset.edgeIndex);
        });
    });
    
    document.querySelectorAll('.btn-save').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            saveBet(btn.dataset.edgeIndex);
        });
    });
}

// Create edge card HTML
function createEdgeCard(edge) {
    const index = currentEdges.indexOf(edge);
    const confidenceClass = edge.confidence >= 85 ? 'confidence-high' : edge.confidence >= 80 ? 'confidence-medium' : 'confidence-low';
    
    return `
        <div class="edge-card" data-edge-index="${index}">
            <span class="confidence-badge ${confidenceClass}">🔥 ${edge.confidence}% CONFIDENCE</span>
            
            <h3 class="edge-title">${edge.player || edge.team || 'Unknown'}</h3>
            <span class="edge-sport">${(edge.sport || 'unknown').toUpperCase()}</span>
            
            <div class="edge-edge-text">
                <strong>EDGE:</strong> ${edge.edge}
            </div>
            
            <div class="edge-stats">
                <div class="edge-stat-item">
                    <div class="edge-stat-label">Type</div>
                    <div class="edge-stat-value">${edge.type}</div>
                </div>
                <div class="edge-stat-item">
                    <div class="edge-stat-label">Risk</div>
                    <div class="edge-stat-value">${edge.risk || 'Medium'}</div>
                </div>
                ${edge.propLine ? `
                <div class="edge-stat-item">
                    <div class="edge-stat-label">Prop Line</div>
                    <div class="edge-stat-value">${edge.propLine}</div>
                </div>
                ` : ''}
                ${edge.avgPointsInMismatch ? `
                <div class="edge-stat-item">
                    <div class="edge-stat-label">Historical Avg</div>
                    <div class="edge-stat-value">${edge.avgPointsInMismatch.toFixed(1)}</div>
                </div>
                ` : ''}
            </div>
            
            <div class="edge-actions">
                <button class="btn-take" data-edge-index="${index}">✅ TAKE BET</button>
                <button class="btn-save" data-edge-index="${index}">💾 SAVE</button>
            </div>
        </div>
    `;
}

// Filter edges
function filterEdges() {
    const sport = document.getElementById('sportFilter').value;
    const confidence = parseInt(document.getElementById('confidenceFilter').value);
    const edgeType = document.getElementById('edgeTypeFilter').value;
    
    let filtered = currentEdges.filter(edge => {
        const sportMatch = sport === 'all' || edge.sport === sport;
        const confidenceMatch = edge.confidence >= confidence;
        const typeMatch = !edgeType || edge.type === edgeType;
        
        return sportMatch && confidenceMatch && typeMatch;
    });
    
    displayEdges(filtered);
}

// Show edge details in modal
function showEdgeDetails(index) {
    const edge = currentEdges[index];
    const modal = document.getElementById('edgeModal');
    const modalBody = document.getElementById('modalBody');
    
    const details = `
        <h2>${edge.player || edge.team}</h2>
        <p style="color: #a0a0a0; margin-bottom: 20px;">${edge.type} | ${(edge.sport || 'unknown').toUpperCase()}</p>
        
        <div style="background: #0f3460; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 3px solid #e94560;">
            <p><strong>Edge Analysis:</strong></p>
            <p>${edge.edge}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p><strong>Prediction:</strong> ${edge.prediction || 'N/A'}</p>
            <p style="color: #a0a0a0; margin-top: 10px;"><strong>Confidence:</strong> ${edge.confidence}%</p>
        </div>
        
        ${edge.sampleSize ? `
        <div style="background: #0f3460; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">
            <p><strong>Historical Data:</strong></p>
            <p>Sample Size: ${edge.sampleSize} games</p>
            <p>Hit Rate: ${(edge.historicalHitRate * 100).toFixed(1)}%</p>
        </div>
        ` : ''}
        
        <p style="color: #a0a0a0; font-size: 12px;">Found at: ${new Date(edge.timestamp).toLocaleString()}</p>
    `;
    
    modalBody.innerHTML = details;
    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('edgeModal').style.display = 'none';
}

// Record a bet
function recordBet(index) {
    const edge = currentEdges[index];
    
    const bet = {
        id: Date.now(),
        edge: edge.edge,
        type: edge.type,
        player: edge.player || edge.team,
        confidence: edge.confidence,
        timestamp: new Date().toISOString(),
        status: 'pending' // pending, won, lost
    };
    
    betHistory.push(bet);
    localStorage.setItem('betHistory', JSON.stringify(betHistory));
    
    alert(`✅ Bet recorded!\n\n${bet.player}\n${edge.type}\nConfidence: ${edge.confidence}%\n\nGo place this bet on your sportsbook now!`);
    
    updateStats();
}

// Save a bet for later
function saveBet(index) {
    const edge = currentEdges[index];
    console.log('Saved bet:', edge);
    alert('✅ Bet saved to your watchlist');
}

// Update statistics
function updateStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    // Calculate stats for each period
    const todayBets = betHistory.filter(b => new Date(b.timestamp) >= today);
    const weekBets = betHistory.filter(b => new Date(b.timestamp) >= weekAgo);
    const monthBets = betHistory.filter(b => new Date(b.timestamp) >= monthAgo);
    
    updatePeriodStats('today', todayBets);
    updatePeriodStats('week', weekBets);
    updatePeriodStats('month', monthBets);
}

function updatePeriodStats(period, bets) {
    const taken = bets.length;
    const wins = bets.filter(b => b.status === 'won').length;
    const losses = bets.filter(b => b.status === 'lost').length;
    
    // Rough ROI estimate (-110 odds)
    const roi = taken === 0 ? 0 : ((wins / taken) * 0.95 - (losses / taken) * 1.05) * 100;
    
    document.getElementById(`${period}Taken`).textContent = taken;
    document.getElementById(`${period}Wins`).textContent = wins;
    document.getElementById(`${period}Losses`).textContent = losses;
    document.getElementById(`${period}ROI`).textContent = `ROI: ${roi.toFixed(1)}%`;
}

// Open settings
function openSettings() {
    alert('⚙️ Settings\n\nFuture: Customize confidence thresholds, auto-notifications, sportsbook preferences');
}

// Open history
function openHistory() {
    console.log('Bet history:', betHistory);
    alert(`📊 Bet History\n\nTotal bets: ${betHistory.length}\n\nCheck browser console for full history`);
}
