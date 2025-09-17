// Alternative upload approach - add this to your add page as a test

// Instead of:
// const path = `${id}/thumbnail_${Date.now()}.${ext}`;

// Try this simpler format:
const path = `thumbnail_${id}_${Date.now()}.${ext}`;

// This eliminates folder structure in case that's causing issues
