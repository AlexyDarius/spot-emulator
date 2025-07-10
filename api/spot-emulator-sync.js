/**
 * SPOT Emulator Sync Endpoint
 * Handles client synchronization requests
 */

// Import the main API logic
import mainHandler from './spot-emulator.js';

export default function handler(req, res) {
  // Set the pathname to the sync endpoint
  req.url = '/api/spot-emulator/sync';
  
  // Call the main handler
  return mainHandler(req, res);
} 