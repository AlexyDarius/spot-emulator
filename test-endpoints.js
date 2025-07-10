const http = require('http');

const BASE_URL = 'http://localhost:3000';

function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log(`✅ ${method} ${path} - Status: ${res.statusCode}`);
        if (res.statusCode >= 400) {
          console.log(`   Error: ${body}`);
        }
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${method} ${path} - Error: ${error.message}`);
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing SPOT Emulator Endpoints...\n');

  try {
    // Test main page
    await testEndpoint('/');
    
    // Test XML feed
    await testEndpoint('/api/spot-emulator');
    
    // Test status
    await testEndpoint('/api/spot-emulator/status');
    
    // Test client script
    await testEndpoint('/api/spot-emulator-client.js');
    
    // Test sync endpoint with initial data
    await testEndpoint('/api/spot-emulator/sync', 'POST', {
      position: {
        latitude: 43.2646,
        longitude: 6.6410,
        altitude: 150
      },
      timestamp: Date.now(),
      messageType: 'TRACK',
      batteryState: 'GOOD'
    });
    
    // Test control endpoint
    await testEndpoint('/api/spot-emulator/control', 'POST', {
      action: 'custom'
    });

    console.log('\n🎉 All endpoint tests completed!');
    console.log('🌐 Open http://localhost:3000 in your browser to test the web interface');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check if server is running
const checkServer = http.get('http://localhost:3000/api/spot-emulator/status', (res) => {
  if (res.statusCode === 200) {
    console.log('🚀 Server is running, starting tests...\n');
    runTests();
  } else {
    console.log('❌ Server responded with status:', res.statusCode);
  }
}).on('error', (error) => {
  console.log('❌ Server is not running. Please start it with: npm start');
  console.log('   Then run this test again.');
}); 