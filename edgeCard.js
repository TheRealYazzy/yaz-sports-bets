// Edge Card Component - Renders individual edge cards

export function createEdgeCard(edge, index) {
  const confidenceClass = edge.confidence >= 85 
    ? 'confidence-high' 
    : edge.confidence >= 80 
      ? 'confidence-medium' 
      : 'confidence-low';

  return `
    <div class="edge-card" data-edge-index="${index}">
      <span class="confidence-badge ${confidenceClass}">🔥 ${edge.confidence}% CONFIDENCE</span>
      
      <h3 class="edge-title">${edge.player || edge.team || 'Unknown'}</h3>
      <span class="edge-sport">${(edge.sport || 'unknown').toUpperCase()}</span>
      
      <div class="edge-edge-text">
        <strong>EDGE:</strong> ${escapeHtml(edge.edge)}
      </div>
      
      <div class="edge-stats">
        <div class="edge-stat-item">
          <div class="edge-stat-label">Type</div>
          <div class="edge-stat-value">${escapeHtml(edge.type)}</div>
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

// Show detailed edge information in modal
export function showEdgeDetailsModal(edge) {
  const modal = document.getElementById('edgeModal');
  const modalBody = document.getElementById('modalBody');

  const details = `
    <h2>${escapeHtml(edge.player || edge.team)}</h2>
    <p style="color: #a0a0a0; margin-bottom: 20px;">${escapeHtml(edge.type)} | ${(edge.sport || 'unknown').toUpperCase()}</p>
    
    <div style="background: #0f3460; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 3px solid #e94560;">
      <p><strong>Edge Analysis:</strong></p>
      <p>${escapeHtml(edge.edge)}</p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <p><strong>Prediction:</strong> ${escapeHtml(edge.prediction || 'N/A')}</p>
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
export function closeEdgeModal() {
  document.getElementById('edgeModal').style.display = 'none';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Filter edge cards based on criteria
export function filterEdgeCards(edges, filters) {
  return edges.filter(edge => {
    const sportMatch = filters.sport === 'all' || edge.sport === filters.sport;
    const confidenceMatch = edge.confidence >= filters.confidence;
    const typeMatch = !filters.edgeType || edge.type === filters.edgeType;

    return sportMatch && confidenceMatch && typeMatch;
  });
}

// Sort edge cards
export function sortEdgeCards(edges, sortBy = 'confidence') {
  const sorted = [...edges];

  if (sortBy === 'confidence') {
    sorted.sort((a, b) => b.confidence - a.confidence);
  } else if (sortBy === 'recent') {
    sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } else if (sortBy === 'hitRate') {
    sorted.sort((a, b) => (b.historicalHitRate || 0) - (a.historicalHitRate || 0));
  }

  return sorted;
}
