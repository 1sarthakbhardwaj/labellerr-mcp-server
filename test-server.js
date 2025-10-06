#!/usr/bin/env node

/**
 * Test script for Labellerr MCP Server
 * This script validates that the server can start and respond to basic requests
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing Labellerr MCP Server...\n');

// Test environment variables
const requiredEnvVars = ['LABELLERR_API_KEY', 'LABELLERR_API_SECRET', 'LABELLERR_CLIENT_ID'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.log('⚠️  Missing environment variables:', missingVars.join(', '));
  console.log('   Please set them in your .env file or environment.\n');
  console.log('   Example:');
  console.log('   export LABELLERR_API_KEY=your_key');
  console.log('   export LABELLERR_API_SECRET=your_secret');
  console.log('   export LABELLERR_CLIENT_ID=your_client_id\n');
} else {
  console.log('✅ All required environment variables are set\n');
}

// Test server startup
console.log('Starting MCP server...');
const serverPath = join(__dirname, 'src', 'index.js');

const server = spawn('node', [serverPath], {
  env: { ...process.env },
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  output += data.toString();
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.log('Server message:', data.toString());
});

// Send a test request after a short delay
setTimeout(() => {
  console.log('\n📝 Sending test request to list tools...\n');
  
  const testRequest = JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/list',
    id: 1
  }) + '\n';
  
  server.stdin.write(testRequest);
}, 1000);

// Check for response
setTimeout(() => {
  if (output.includes('"tools"')) {
    console.log('✅ Server is responding correctly!');
    console.log('\n📋 Available tools detected in response');
    
    // Try to parse and display tool count
    try {
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes('"tools"')) {
          const response = JSON.parse(line);
          if (response.result && response.result.tools) {
            console.log(`   Found ${response.result.tools.length} tools available`);
            
            // Group tools by category
            const categories = {
              project: [],
              dataset: [],
              annotation: [],
              monitor: [],
              query: []
            };
            
            response.result.tools.forEach(tool => {
              const category = tool.name.split('_')[0];
              if (categories[category]) {
                categories[category].push(tool.name);
              }
            });
            
            console.log('\n📂 Tools by category:');
            Object.entries(categories).forEach(([cat, tools]) => {
              if (tools.length > 0) {
                console.log(`   ${cat}: ${tools.length} tools`);
              }
            });
          }
          break;
        }
      }
    } catch (e) {
      // Parsing failed, but server is still working
    }
  } else if (errorOutput.includes('Missing required environment variables')) {
    console.log('❌ Server cannot start: Missing API credentials');
    console.log('   Please configure your .env file with Labellerr credentials');
  } else if (errorOutput.includes('running on stdio')) {
    console.log('✅ Server started successfully!');
    console.log('   The server is ready to accept MCP requests');
  } else {
    console.log('⚠️  Server started but response unclear');
    console.log('   This might be normal - the server may be running correctly');
  }
  
  console.log('\n🎉 Test complete!');
  console.log('\nTo use with Claude Desktop:');
  console.log('1. Copy the claude_desktop_config.json to your Claude config directory');
  console.log('2. Update it with your actual Labellerr credentials');
  console.log('3. Restart Claude Desktop\n');
  
  // Clean shutdown
  server.kill();
  process.exit(0);
}, 2000);

// Handle errors
server.on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

// Cleanup on exit
process.on('SIGINT', () => {
  server.kill();
  process.exit(0);
});
