# SPOT Emulator - Vercel Deployment Guide

## Quick Deploy to Vercel

### Option 1: Deploy Button (Easiest)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/spot-emulator-vercel)

### Option 2: Manual Deploy
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts
4. Deploy!

### Option 3: GitHub Integration
1. Push to GitHub
2. Connect repo to Vercel
3. Auto-deploy on push

## Files Structure
```
your-project/
├── api/
│   └── spot-emulator.js    # Main emulator function
├── vercel.json             # Vercel configuration
└── README.md
```

## API Endpoints

Once deployed, your emulator will be available at:

- **Main SPOT API**: `https://your-project.vercel.app/api/spot-emulator`
- **Status**: `https://your-project.vercel.app/api/spot-emulator/status`
- **Control**: `https://your-project.vercel.app/api/spot-emulator/control`

## Configuration

Edit the `CONFIG` object in `api/spot-emulator.js`:

```javascript
const CONFIG = {
  // Timing - Change update frequency
  TRACK_INTERVAL: 30,        // Every 30 seconds
  TRACK_INTERVAL_VARIANCE: 5, // ±5 seconds randomness
  
  // Movement - Change speed
  MOVEMENT_SPEED: 0.001,     // Movement speed (degrees per update)
  
  // Location - Change starting position
  BASE_LATITUDE: 43.63923,   // Starting latitude
  BASE_LONGITUDE: 1.4656,    // Starting longitude
  
  // Messages - Add custom messages
  CUSTOM_MESSAGES: [
    "Your custom message here",
    "Another message",
  ],
};
```

## Integration

Use the deployed URL in your application:

```typescript
// In your environment variables
SPOT_FEED_URL=https://your-project.vercel.app/api/spot-emulator
```

## Testing

Test your deployed emulator:

```bash
# Test main endpoint
curl https://your-project.vercel.app/api/spot-emulator

# Get status
curl https://your-project.vercel.app/api/spot-emulator/status

# Control emulator
curl -X POST https://your-project.vercel.app/api/spot-emulator/control \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

## Customization Examples

### Faster Updates (Every 10 seconds)
```javascript
TRACK_INTERVAL: 10,
TRACK_INTERVAL_VARIANCE: 2,
```

### Slower Movement
```javascript
MOVEMENT_SPEED: 0.0005,
```

### Different Location
```javascript
BASE_LATITUDE: 40.7128,   // New York
BASE_LONGITUDE: -74.0060,
```

### More Custom Messages
```javascript
CUSTOM_MESSAGES: [
  "Emergency stop",
  "Reached checkpoint",
  "Weather alert",
  "Traffic jam",
  "Scenic viewpoint",
],
```

## Control Actions

```bash
# Stop movement
curl -X POST https://your-project.vercel.app/api/spot-emulator/control \
  -d '{"action": "stop"}'

# Start movement
curl -X POST https://your-project.vercel.app/api/spot-emulator/control \
  -d '{"action": "start"}'

# Reset position
curl -X POST https://your-project.vercel.app/api/spot-emulator/control \
  -d '{"action": "reset"}'

# Send custom message
curl -X POST https://your-project.vercel.app/api/spot-emulator/control \
  -d '{"action": "custom"}'
```

## Vercel Benefits

✅ **Free tier** - No cost for basic usage  
✅ **Global CDN** - Fast worldwide access  
✅ **Auto-scaling** - Handles traffic automatically  
✅ **Git integration** - Deploy on push  
✅ **Custom domains** - Use your own domain  
✅ **Analytics** - Monitor usage  

## Troubleshooting

### Function timeout
- Vercel functions have a 10-second timeout on free tier
- The emulator generates messages on each request
- No long-running processes needed

### Cold starts
- First request might be slower
- Subsequent requests are fast
- Perfect for testing scenarios

### CORS issues
- CORS headers are already configured
- Should work from any domain
- Check browser console for errors

## That's it!

Deploy to Vercel and you'll have a lightweight, scalable SPOT emulator running in the cloud! 🚀 