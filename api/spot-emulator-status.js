/**
 * SPOT Emulator Status Endpoint
 * Returns current status and configuration
 */

// Import the main API logic
import mainHandler from './spot-emulator.js';

export default function handler(req, res) {
  // Set the pathname to the status endpoint
  req.url = '/api/spot-emulator/status';
  
  // Call the main handler
  return mainHandler(req, res);
} 