/**
 * SPOT Tracker Emulator - Vercel Serverless Function
 * 
 * INNOVATIVE SOLUTION: Client-Side State Management with Server-Side Validation
 * 
 * DEPLOYMENT: Force redeploy to fix missing endpoints
 * 
 * This approach solves the Vercel serverless limitations by:
 * 1. Using client-side JavaScript to maintain continuous movement
 * 2. Server validates and accepts client-generated positions
 * 3. Time-based synchronization ensures consistency
 * 4. Minimal server state, maximum client autonomy
 * 
 * CONFIGURABLE VARIABLES (edit these as needed):
 * - BASE_LATITUDE, BASE_LONGITUDE: Starting coordinates
 * - MOVEMENT_SPEED: How fast the tracker moves (degrees per update)
 * - TRACK_INTERVAL: Base interval for UNLIMITED-TRACK messages (seconds)
 * - TRACK_INTERVAL_VARIANCE: Random variance for track intervals (seconds)
 * - CUSTOM_MESSAGE_CHANCE: Probability of CUSTOM message (1/10 = 0.1)
 * - CUSTOM_MESSAGES: Array of possible custom messages
 * - DEVICE_NAME: Name of the emulated device
 * - MESSENGER_ID: Device identifier
 * - FEED_ID: Feed identifier
 */

// ============================================================================
// CONFIGURABLE VARIABLES - EDIT THESE AS NEEDED
// ============================================================================

const CONFIG = {
  // Device Configuration
  DEVICE_NAME: 'TESTER',
  MESSENGER_ID: '0-1234567',
  MODEL_ID: 'Test',
  FEED_ID: 'test-feed-123456789',
  
  // Location Configuration
  BASE_LATITUDE: 43.2646,  // Starting latitude (Toulouse area)
  BASE_LONGITUDE: 6.6410,   // Starting longitude (Toulouse area)
  MOVEMENT_SPEED: 0.0001,   // Degrees per update (reduced for more realistic movement)
  MOVEMENT_VARIANCE: 0.00005, // Random variance in movement (reduced)
  
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
  POSITION_TOLERANCE: 0.1,  // Maximum position change tolerance (degrees) - increased for faster movement
};

// ============================================================================
// SERVER-SIDE STATE (minimal, only for validation)
// ============================================================================

let serverState = {
  lastSyncTime: Date.now(),
  lastPosition: {
  latitude: CONFIG.BASE_LATITUDE,
  longitude: CONFIG.BASE_LONGITUDE,
    altitude: CONFIG.BASE_ALTITUDE
  },
  messageId: 1000000,
  messages: [],
  batteryState: 'GOOD'
};

const MAX_MESSAGES = 50; // Keep last 50 messages

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function calculateNextInterval() {
  const baseInterval = CONFIG.TRACK_INTERVAL * 1000; // Convert to milliseconds
  const variance = CONFIG.TRACK_INTERVAL_VARIANCE * 1000;
  const randomVariance = getRandomFloat(-variance, variance);
  return Math.max(1000, baseInterval + randomVariance); // Minimum 1 second
}

function validateClientPosition(clientPos, clientTime) {
  const now = Date.now();
  const timeDrift = Math.abs(now - clientTime);
  
  // Check if time drift is acceptable
  if (timeDrift > CONFIG.MAX_TIME_DRIFT) {
    console.log(`⚠️ Time drift too large: ${timeDrift}ms`);
    return false;
  }
  
  // For the first sync, allow any position (initial position)
  if (serverState.messages.length === 0) {
    console.log('✅ First sync - allowing initial position');
    return true;
  }
  
  // Check if position change is reasonable
  const latDiff = Math.abs(clientPos.latitude - serverState.lastPosition.latitude);
  const lonDiff = Math.abs(clientPos.longitude - serverState.lastPosition.longitude);
  
  if (latDiff > CONFIG.POSITION_TOLERANCE || lonDiff > CONFIG.POSITION_TOLERANCE) {
    console.log(`⚠️ Position change too large: lat=${latDiff}, lon=${lonDiff}, tolerance=${CONFIG.POSITION_TOLERANCE}`);
    return false;
  }
  
  return true;
}

function generateMessageId() {
  return (++serverState.messageId).toString();
}

function formatDateTime(date) {
  return date.toISOString().replace('Z', '+0000');
}

function generateTrackMessage(position, timestamp) {
  const now = new Date(timestamp);
  const unixTime = Math.floor(timestamp / 1000);
  
  return {
    id: generateMessageId(),
    messengerId: CONFIG.MESSENGER_ID,
    messengerName: CONFIG.DEVICE_NAME,
    unixTime: unixTime,
    messageType: 'UNLIMITED-TRACK',
    latitude: position.latitude.toFixed(5),
    longitude: position.longitude.toFixed(5),
    modelId: CONFIG.MODEL_ID,
    showCustomMsg: 'Y',
    dateTime: formatDateTime(now),
    batteryState: serverState.batteryState,
    hidden: '0',
    altitude: position.altitude.toString()
  };
}

function generateCustomMessage(position, timestamp, messageContent) {
  const now = new Date(timestamp);
  const unixTime = Math.floor(timestamp / 1000);
  
  return {
    id: generateMessageId(),
    messengerId: CONFIG.MESSENGER_ID,
    messengerName: CONFIG.DEVICE_NAME,
    unixTime: unixTime,
    messageType: 'CUSTOM',
    latitude: position.latitude.toFixed(5),
    longitude: position.longitude.toFixed(5),
    modelId: CONFIG.MODEL_ID,
    showCustomMsg: 'Y',
    dateTime: formatDateTime(now),
    batteryState: serverState.batteryState,
    hidden: '0',
    altitude: position.altitude.toString(),
    messageContent: messageContent
  };
}

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
        
        console.log('🔄 Attempting to sync with server...');
        
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
        } else {
          const errorData = await response.json();
          console.error('❌ Sync failed:', response.status, errorData);
          console.error('❌ Request data:', trackData);
        }
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
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
try {
  window.spotEmulator = new SPOTEmulatorClient();
  console.log('✅ SPOT Emulator initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize SPOT Emulator:', error);
}

// Expose control functions globally
window.spotEmulatorControl = {
  stop: () => {
    if (window.spotEmulator) {
      window.spotEmulator.stop();
    } else {
      console.error('❌ SPOT Emulator not initialized');
    }
  },
  start: () => {
    if (window.spotEmulator) {
      window.spotEmulator.start();
    } else {
      console.error('❌ SPOT Emulator not initialized');
    }
  },
  reset: () => {
    if (window.spotEmulator) {
      window.spotEmulator.reset();
    } else {
      console.error('❌ SPOT Emulator not initialized');
    }
  }
};
`;
}

function generateXMLResponse(messages) {
  const messagesXML = messages.map(msg => {
    let xml = `  <message clientUnixTime="0">
    <id>${msg.id}</id>
    <messengerId>${msg.messengerId}</messengerId>
    <messengerName>${msg.messengerName}</messengerName>
    <unixTime>${msg.unixTime}</unixTime>
    <messageType>${msg.messageType}</messageType>
    <latitude>${msg.latitude}</latitude>
    <longitude>${msg.longitude}</longitude>
    <modelId>${msg.modelId}</modelId>
    <showCustomMsg>${msg.showCustomMsg}</showCustomMsg>
    <dateTime>${msg.dateTime}</dateTime>
    <batteryState>${msg.batteryState}</batteryState>
    <hidden>${msg.hidden}</hidden>
    <altitude>${msg.altitude}</altitude>`;
    
    if (msg.messageContent) {
      xml += `
    <messageContent>${msg.messageContent}</messageContent>`;
    }
    
    xml += `
  </message>`;
    return xml;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <feedMessageResponse>
    <count>${messages.length}</count>
    <feed>
      <id>${CONFIG.FEED_ID}</id>
      <name>${CONFIG.DEVICE_NAME}-emulator</name>
      <description>${CONFIG.DEVICE_NAME} Emulator for Testing</description>
      <status>ACTIVE</status>
      <usage>0</usage>
      <daysRange>7</daysRange>
      <detailedMessageShown>true</detailedMessageShown>
      <type>SHARED_PAGE</type>
    </feed>
    <totalCount>${messages.length}</totalCount>
    <activityCount>0</activityCount>
    <messages>
${messagesXML}
    </messages>
  </feedMessageResponse>
</response>`;
}



// ============================================================================
// VERCEL API HANDLER
// ============================================================================

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  
  if (req.method === 'GET') {
    if (pathname === '/api/spot-emulator/status') {
      // Status endpoint
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        status: 'running',
        config: CONFIG,
        serverState: {
          ...serverState,
          messageCount: serverState.messages.length,
          lastMessage: serverState.messages[serverState.messages.length - 1] || null
        }
      });
    } else if (pathname === '/api/spot-emulator-client.js') {
      // Client-side script endpoint
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.status(200).send(generateClientScript());
    } else {
      // Main SPOT API endpoint
      const xmlResponse = generateXMLResponse(serverState.messages);
      
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.status(200).send(xmlResponse);
      
      console.log(`📡 Served ${serverState.messages.length} messages to ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
    }
  } else if (req.method === 'POST') {
    if (pathname === '/api/spot-emulator/sync') {
      // Client synchronization endpoint
      try {
        const { position, timestamp, messageType, messageContent, batteryState } = req.body;
        
        console.log(`🔄 Sync request received: ${messageType} at ${new Date(timestamp).toISOString()}`);
        
        // Validate client data
        if (!validateClientPosition(position, timestamp)) {
          console.log('❌ Validation failed');
          res.status(400).json({ error: 'Invalid client data' });
          return;
        }
        
        // Update server state
        serverState.lastPosition = position;
        serverState.lastSyncTime = timestamp;
        if (batteryState) serverState.batteryState = batteryState;
        
        // Generate message based on type
        let message;
        if (messageType === 'TRACK') {
          message = generateTrackMessage(position, timestamp);
        } else if (messageType === 'CUSTOM') {
          message = generateCustomMessage(position, timestamp, messageContent);
        }
        
        if (message) {
          serverState.messages.push(message);
          
          // Keep only the last MAX_MESSAGES
          if (serverState.messages.length > MAX_MESSAGES) {
            serverState.messages = serverState.messages.slice(-MAX_MESSAGES);
          }
          
          console.log(`✅ ${messageType} message synced: ${message.latitude}, ${message.longitude}`);
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({ success: true, messageId: message?.id });
      } catch (error) {
        console.error('❌ Sync error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
      
    } else if (pathname === '/api/spot-emulator/control') {
      // Control endpoint
      try {
        const { action } = req.body;
        
        console.log(`🎮 Control request: ${action}`);
        
        switch (action) {
          case 'stop':
            console.log('🛑 Movement stopped (server-side)');
            break;
            
          case 'start':
            console.log('▶️ Movement started (server-side)');
            break;
            
          case 'reset':
            serverState.lastPosition = {
              latitude: CONFIG.BASE_LATITUDE,
              longitude: CONFIG.BASE_LONGITUDE,
              altitude: CONFIG.BASE_ALTITUDE
            };
            console.log('🔄 Position reset to base coordinates (server-side)');
            break;
            
          case 'custom':
            const customMessage = generateCustomMessage(
              serverState.lastPosition,
              Date.now(),
              getRandomElement(CONFIG.CUSTOM_MESSAGES)
            );
            serverState.messages.push(customMessage);
            console.log(`💬 Manual CUSTOM message: "${customMessage.messageContent}"`);
            break;
            
          default:
            res.status(400).json({ error: 'Invalid action' });
            return;
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({ success: true, action });
      } catch (error) {
        console.error('❌ Control error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    } else {
      res.status(404).json({ error: 'Endpoint not found' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 