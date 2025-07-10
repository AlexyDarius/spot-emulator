#!/bin/bash

echo "🚀 Deploying SPOT Emulator fixes to Vercel..."

# Check if we're in the right directory
if [ ! -f "api/spot-emulator.js" ]; then
    echo "❌ Error: Not in the spot-emulator directory"
    exit 1
fi

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Fix sync endpoint validation and add better error handling

- Fix first sync validation to allow initial position
- Add comprehensive error handling to sync endpoint
- Add better logging for debugging
- Fix control endpoint error handling"

# Push to trigger Vercel deployment
echo "📤 Pushing to GitHub..."
git push

echo "✅ Deployment triggered!"
echo "🌐 Check your Vercel dashboard for deployment status"
echo "⏳ Wait 1-2 minutes for deployment to complete"
echo "🔍 Then test at: https://your-domain.vercel.app" 