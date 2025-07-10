/**
 * SPOT Emulator Control Endpoint
 * Handles control commands (start, stop, reset, custom)
 */

// Import the main API logic
import mainHandler from './spot-emulator.js';

export default function handler(req, res) {
  // Set the pathname to the control endpoint
  req.url = '/api/spot-emulator/control';
  
  // Call the main handler
  return mainHandler(req, res);
} 