/**
 * SPOT Tracker Emulator - Vercel Serverless Function
 * 
 * Deploy this as a Vercel API route for a lightweight SPOT emulator.
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
};

// ============================================================================
// GLOBAL STATE (stored in memory for this function instance)
// ============================================================================

let currentState = {
  latitude: CONFIG.BASE_LATITUDE,
  longitude: CONFIG.BASE_LONGITUDE,
  altitude: CONFIG.BASE_ALTITUDE,
  batteryState: 'GOOD',
  messageId: 1000000,
  lastTrackTime: Date.now(),
  lastCustomTime: Date.now(),
  isMoving: true,
  direction: Math.random() * 2 * Math.PI, // Random initial direction
};

let messages = [];
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

function updateLocation() {
  if (!currentState.isMoving) return;
  
  // Add some randomness to direction
  currentState.direction += getRandomFloat(-0.2, 0.2);
  
  // Calculate new position
  const distance = CONFIG.MOVEMENT_SPEED + getRandomFloat(-CONFIG.MOVEMENT_VARIANCE, CONFIG.MOVEMENT_VARIANCE);
  const latChange = Math.cos(currentState.direction) * distance;
  const lonChange = Math.sin(currentState.direction) * distance;
  
  currentState.latitude += latChange;
  currentState.longitude += lonChange;
  
  // Update altitude with some variation
  currentState.altitude = Math.max(0, CONFIG.BASE_ALTITUDE + getRandomInt(-CONFIG.ALTITUDE_VARIANCE, CONFIG.ALTITUDE_VARIANCE));
  
  // Occasionally change battery state
  if (Math.random() < CONFIG.BATTERY_CHANGE_CHANCE) {
    currentState.batteryState = getRandomElement(CONFIG.BATTERY_STATES);
  }
}

function generateMessageId() {
  return (++currentState.messageId).toString();
}

function formatDateTime(date) {
  return date.toISOString().replace('Z', '+0000');
}

function generateTrackMessage() {
  updateLocation();
  
  const now = new Date();
  const unixTime = Math.floor(now.getTime() / 1000);
  
  return {
    id: generateMessageId(),
    messengerId: CONFIG.MESSENGER_ID,
    messengerName: CONFIG.DEVICE_NAME,
    unixTime: unixTime,
    messageType: 'UNLIMITED-TRACK',
    latitude: currentState.latitude.toFixed(5),
    longitude: currentState.longitude.toFixed(5),
    modelId: CONFIG.MODEL_ID,
    showCustomMsg: 'Y',
    dateTime: formatDateTime(now),
    batteryState: currentState.batteryState,
    hidden: '0',
    altitude: currentState.altitude.toString()
  };
}

function generateCustomMessage() {
  updateLocation();
  
  const now = new Date();
  const unixTime = Math.floor(now.getTime() / 1000);
  const customMessage = getRandomElement(CONFIG.CUSTOM_MESSAGES);
  
  return {
    id: generateMessageId(),
    messengerId: CONFIG.MESSENGER_ID,
    messengerName: CONFIG.DEVICE_NAME,
    unixTime: unixTime,
    messageType: 'CUSTOM',
    latitude: currentState.latitude.toFixed(5),
    longitude: currentState.longitude.toFixed(5),
    modelId: CONFIG.MODEL_ID,
    showCustomMsg: 'Y',
    dateTime: formatDateTime(now),
    batteryState: currentState.batteryState,
    hidden: '0',
    altitude: currentState.altitude.toString(),
    messageContent: customMessage
  };
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

function generateNextMessage() {
  const now = Date.now();
  
  // Check if it's time for a track message
  if (now - currentState.lastTrackTime >= calculateNextInterval()) {
    const trackMessage = generateTrackMessage();
    messages.push(trackMessage);
    currentState.lastTrackTime = now;
    
    console.log(`📍 Generated TRACK message: ${trackMessage.latitude}, ${trackMessage.longitude} (Battery: ${trackMessage.batteryState})`);
    
    // Check if we should also generate a custom message
    if (Math.random() < CONFIG.CUSTOM_MESSAGE_CHANCE) {
      const customMessage = generateCustomMessage();
      messages.push(customMessage);
      currentState.lastCustomTime = now;
      
      console.log(`💬 Generated CUSTOM message: "${customMessage.messageContent}"`);
    }
    
    // Keep only the last MAX_MESSAGES
    if (messages.length > MAX_MESSAGES) {
      messages = messages.slice(-MAX_MESSAGES);
    }
  }
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
    // Generate any pending messages
    generateNextMessage();
    
    if (pathname === '/api/spot-emulator/status') {
      // Status endpoint
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        status: 'running',
        config: CONFIG,
        currentState: {
          ...currentState,
          messageCount: messages.length,
          lastMessage: messages[messages.length - 1] || null
        }
      });
    } else {
      // Main SPOT API endpoint
      const xmlResponse = generateXMLResponse(messages);
      
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.status(200).send(xmlResponse);
      
      console.log(`📡 Served ${messages.length} messages to ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
    }
  } else if (req.method === 'POST' && pathname === '/api/spot-emulator/control') {
    // Control endpoint
    const { action } = req.body;
    
    switch (action) {
      case 'stop':
        currentState.isMoving = false;
        console.log('🛑 Movement stopped');
        break;
        
      case 'start':
        currentState.isMoving = true;
        console.log('▶️ Movement started');
        break;
        
      case 'reset':
        currentState.latitude = CONFIG.BASE_LATITUDE;
        currentState.longitude = CONFIG.BASE_LONGITUDE;
        currentState.altitude = CONFIG.BASE_ALTITUDE;
        console.log('🔄 Position reset to base coordinates');
        break;
        
      case 'custom':
        const customMessage = generateCustomMessage();
        messages.push(customMessage);
        console.log(`💬 Manual CUSTOM message: "${customMessage.messageContent}"`);
        break;
        
      default:
        res.status(400).json({ error: 'Invalid action' });
        return;
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ success: true, action });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 