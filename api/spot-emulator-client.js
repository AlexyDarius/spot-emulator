/**
 * SPOT Emulator Client Script API
 * 
 * This endpoint serves the client-side JavaScript that maintains
 * continuous movement simulation in the browser.
 */

// Import the main emulator to get the CONFIG
import spotEmulator from './spot-emulator.js';

// Get the CONFIG from the main emulator
const CONFIG = {
  // Device Configuration
  DEVICE_NAME: 'TESTER',
  MESSENGER_ID: '0-1234567',
  MODEL_ID: 'Test',
  FEED_ID: 'test-feed-123456789',
  
  // Location Configuration
  BASE_LATITUDE: 43.2646,  // Starting latitude (Toulouse area)
  BASE_LONGITUDE: 6.6410,   // Starting longitude (Toulouse area)
  MOVEMENT_SPEED: 0.001,    // Degrees per update (adjust for faster/slower movement)
  MOVEMENT_VARIANCE: 0.0005, // Random variance in movement
  
  // Timing Configuration
  TRACK_INTERVAL: 30,       // Base interval for UNLIMITED-TRACK messages (seconds)
  TRACK_INTERVAL_VARIANCE: 5, // Random variance for track intervals (seconds)
  CUSTOM_MESSAGE_CHANCE: 0.1, // Probability of CUSTOM message (1/10 = 0.1)
  
  // Message Configuration
  CUSTOM_MESSAGES: [
    "Taking a break",
    "Lunch time!",
    "Beautiful view here",
    "Coffee stop",
    "Reached destination",
    "Starting journey",
    "Weather is great",
    "Traffic ahead",
    "Scenic route",
    "Rest area"
  ],
  
  // Battery Configuration
  BATTERY_STATES: ['GOOD', 'LOW', 'CRITICAL'],
  BATTERY_CHANGE_CHANCE: 0.05, // 5% chance to change battery state
  
  // Altitude Configuration
  BASE_ALTITUDE: 150,       // Base altitude in meters
  ALTITUDE_VARIANCE: 50,    // Random variance in altitude
  
  // Client-Side Configuration
  CLIENT_SYNC_INTERVAL: 5000, // How often client should sync (5 seconds)
  MAX_TIME_DRIFT: 30000,    // Maximum allowed time drift (30 seconds)
  POSITION_TOLERANCE: 0.01, // Maximum position change tolerance (degrees)
};

function generateClientScript() {
  return `
// SPOT Emulator Client-Side State Manager
// This script runs in the browser to maintain continuous movement

class SPOTEmulatorClient {
  constructor() {
    this.state = {
      latitude: ${CONFIG.BASE_LATITUDE},
      longitude: ${CONFIG.BASE_LONGITUDE},
      altitude: ${CONFIG.BASE_ALTITUDE},
      direction: Math.random() * 2 * Math.PI,
      isMoving: true,
      lastTrackTime: Date.now(),
      lastCustomTime: Date.now(),
      batteryState: 'GOOD'
    };
    
    this.config = ${JSON.stringify(CONFIG)};
    this.syncInterval = null;
    this.movementInterval = null;
    
    this.start();
  }
  
  getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  calculateNextInterval() {
    const baseInterval = this.config.TRACK_INTERVAL * 1000;
    const variance = this.config.TRACK_INTERVAL_VARIANCE * 1000;
    const randomVariance = this.getRandomFloat(-variance, variance);
    return Math.max(1000, baseInterval + randomVariance);
  }
  
  updateLocation() {
    if (!this.state.isMoving) return;
    
    // Add some randomness to direction
    this.state.direction += this.getRandomFloat(-0.2, 0.2);
    
    // Calculate new position
    const distance = this.config.MOVEMENT_SPEED + this.getRandomFloat(-this.config.MOVEMENT_VARIANCE, this.config.MOVEMENT_VARIANCE);
    const latChange = Math.cos(this.state.direction) * distance;
    const lonChange = Math.sin(this.state.direction) * distance;
    
    this.state.latitude += latChange;
    this.state.longitude += lonChange;
    
    // Update altitude with some variation
    this.state.altitude = Math.max(0, this.config.BASE_ALTITUDE + Math.floor(this.getRandomFloat(-this.config.ALTITUDE_VARIANCE, this.config.ALTITUDE_VARIANCE)));
    
    // Occasionally change battery state
    if (Math.random() < this.config.BATTERY_CHANGE_CHANCE) {
      this.state.batteryState = this.getRandomElement(this.config.BATTERY_STATES);
    }
  }
  
  async syncWithServer() {
    try {
      const now = Date.now();
      
      // Check if it's time for a track message
      if (now - this.state.lastTrackTime >= this.calculateNextInterval()) {
        this.updateLocation();
        
        const trackData = {
          position: {
            latitude: this.state.latitude,
            longitude: this.state.longitude,
            altitude: this.state.altitude
          },
          timestamp: now,
          messageType: 'TRACK',
          batteryState: this.state.batteryState
        };
        
        const response = await fetch('/api/spot-emulator/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trackData)
        });
        
        if (response.ok) {
          this.state.lastTrackTime = now;
          console.log('📍 Track message synced with server');
          
          // Check if we should also generate a custom message
          if (Math.random() < this.config.CUSTOM_MESSAGE_CHANCE) {
            const customMessage = this.getRandomElement(this.config.CUSTOM_MESSAGES);
            const customData = {
              ...trackData,
              messageType: 'CUSTOM',
              messageContent: customMessage
            };
            
            await fetch('/api/spot-emulator/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(customData)
            });
            
            this.state.lastCustomTime = now;
            console.log('💬 Custom message synced with server');
          }
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
  
  start() {
    // Start continuous movement
    this.movementInterval = setInterval(() => {
      this.updateLocation();
    }, 1000); // Update every second
    
    // Start server synchronization
    this.syncInterval = setInterval(() => {
      this.syncWithServer();
    }, this.config.CLIENT_SYNC_INTERVAL);
    
    console.log('🚀 SPOT Emulator Client started');
  }
  
  stop() {
    if (this.movementInterval) clearInterval(this.movementInterval);
    if (this.syncInterval) clearInterval(this.syncInterval);
    console.log('🛑 SPOT Emulator Client stopped');
  }
  
  reset() {
    this.state.latitude = this.config.BASE_LATITUDE;
    this.state.longitude = this.config.BASE_LONGITUDE;
    this.state.altitude = this.config.BASE_ALTITUDE;
    this.state.direction = Math.random() * 2 * Math.PI;
    console.log('🔄 Position reset to base coordinates');
  }
}

// Auto-start the emulator when this script loads
window.spotEmulator = new SPOTEmulatorClient();

// Expose control functions globally
window.spotEmulatorControl = {
  stop: () => window.spotEmulator.stop(),
  start: () => window.spotEmulator.start(),
  reset: () => window.spotEmulator.reset()
};
`;
}

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'GET') {
    // Serve the client-side script
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.status(200).send(generateClientScript());
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 