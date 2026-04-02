/**
 * Format disease names for display
 * Converts internal disease labels to human-readable format
 */
export const formatDiseaseName = (disease) => {
  const diseaseMap = {
    'healthy': 'Healthy',
    'leafspot': 'Leaf Spot',
    'bacterialblight': 'Bacterial Blight',
    'viralmosaic': 'Viral Mosaic',
    'pestdamage': 'Pest Damage',
    'leafmold': 'Leaf Mold',
    'unknown': 'Unknown',
    
    // Legacy mappings for backward compatibility
    'leaf_spot': 'Leaf Spot',
    'powdery_mildew': 'Powdery Mildew',
    'bacterial_blight': 'Bacterial Blight',
    'viral_mosaic': 'Viral Mosaic',
    'pest_damage': 'Pest Damage',
    'nutrient_deficiency': 'Nutrient Deficiency',
    'rust': 'Rust'
  };
  
  return diseaseMap[disease] || disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Get disease severity level
 */
export const getDiseaseSeverity = (disease, confidence) => {
  if (disease === 'healthy' || disease === 'unknown') {
    return 'info';
  }
  
  const criticalDiseases = ['bacterialblight', 'viralmosaic', 'leafmold', 'bacterial_blight', 'viral_mosaic'];
  
  if (criticalDiseases.includes(disease) && confidence >= 0.7) {
    return 'critical';
  }
  
  if (confidence >= 0.6) {
    return 'warning';
  }
  
  return 'info';
};

/**
 * Get disease severity color
 */
export const getDiseaseSeverityColor = (severity) => {
  const colors = {
    'critical': '#ef4444',
    'warning': '#f59e0b',
    'info': '#3b82f6',
    'healthy': '#10b981'
  };
  
  return colors[severity] || colors.info;
};

/**
 * Format confidence percentage
 */
export const formatConfidence = (confidence) => {
  if (typeof confidence !== 'number') return 'N/A';
  return `${Math.round(confidence * 100)}%`;
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
};
