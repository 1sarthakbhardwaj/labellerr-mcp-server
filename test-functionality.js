#!/usr/bin/env node

/**
 * Comprehensive functionality test for Labellerr MCP Server
 * Tests all tools, error handling, and MCP protocol compliance
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MCPTester {
  constructor() {
    this.server = null;
    this.requestId = 1;
    this.responses = [];
    this.errors = [];
  }

  async startServer() {
    console.log('🚀 Starting MCP Server for comprehensive testing...\n');
    
    const serverPath = join(__dirname, 'src', 'index.js');
    this.server = spawn('node', [serverPath], {
      env: { 
        ...process.env,
        // Use test credentials to avoid real API calls
        LABELLERR_API_KEY: 'test_key',
        LABELLERR_API_SECRET: 'test_secret',
        LABELLERR_CLIENT_ID: 'test_client'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.server.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          this.responses.push(response);
        } catch (e) {
          // Not JSON, probably server message
        }
      }
    });

    this.server.stderr.on('data', (data) => {
      console.log('Server:', data.toString().trim());
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: this.requestId++
    };

    console.log(`📤 Sending: ${method}`);
    this.server.stdin.write(JSON.stringify(request) + '\n');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response = this.responses.find(r => r.id === request.id);
    return response;
  }

  async testToolsList() {
    console.log('\n🔧 Testing tools/list...');
    const response = await this.sendRequest('tools/list');
    
    if (response && response.result && response.result.tools) {
      const tools = response.result.tools;
      console.log(`✅ Found ${tools.length} tools`);
      
      // Group by category
      const categories = {};
      tools.forEach(tool => {
        const category = tool.name.split('_')[0];
        if (!categories[category]) categories[category] = [];
        categories[category].push(tool.name);
      });
      
      console.log('📋 Tool categories:');
      Object.entries(categories).forEach(([cat, toolList]) => {
        console.log(`   ${cat}: ${toolList.length} tools`);
      });
      
      return { success: true, tools, categories };
    } else {
      console.log('❌ Failed to get tools list');
      return { success: false };
    }
  }

  async testResourcesList() {
    console.log('\n📚 Testing resources/list...');
    const response = await this.sendRequest('resources/list');
    
    if (response && response.result) {
      const resources = response.result.resources || [];
      console.log(`✅ Found ${resources.length} resources`);
      
      resources.forEach(resource => {
        console.log(`   - ${resource.name}: ${resource.uri}`);
      });
      
      return { success: true, resources };
    } else {
      console.log('❌ Failed to get resources list');
      return { success: false };
    }
  }

  async testToolExecution() {
    console.log('\n⚙️ Testing tool execution...');
    
    // Test monitoring tools (should work without real API)
    const testCases = [
      {
        name: 'monitor_system_health',
        args: {},
        description: 'System health check'
      },
      {
        name: 'monitor_active_operations', 
        args: {},
        description: 'Active operations'
      },
      {
        name: 'query_operation_history',
        args: { limit: 5 },
        description: 'Operation history'
      }
    ];

    const results = [];
    
    for (const test of testCases) {
      console.log(`   Testing: ${test.description}`);
      
      const response = await this.sendRequest('tools/call', {
        name: test.name,
        arguments: test.args
      });
      
      if (response && response.result) {
        console.log(`   ✅ ${test.name} - Success`);
        results.push({ tool: test.name, success: true });
      } else if (response && response.error) {
        console.log(`   ⚠️ ${test.name} - Error: ${response.error.message}`);
        results.push({ tool: test.name, success: false, error: response.error.message });
      } else {
        console.log(`   ❌ ${test.name} - No response`);
        results.push({ tool: test.name, success: false, error: 'No response' });
      }
    }
    
    return results;
  }

  async testErrorHandling() {
    console.log('\n🚨 Testing error handling...');
    
    const errorTests = [
      {
        name: 'Invalid tool name',
        request: { method: 'tools/call', params: { name: 'invalid_tool', arguments: {} } }
      },
      {
        name: 'Missing arguments',
        request: { method: 'tools/call', params: { name: 'project_get' } }
      },
      {
        name: 'Invalid method',
        request: { method: 'invalid/method', params: {} }
      }
    ];

    const results = [];
    
    for (const test of errorTests) {
      console.log(`   Testing: ${test.name}`);
      
      const response = await this.sendRequest(test.request.method, test.request.params);
      
      if (response && response.error) {
        console.log(`   ✅ Proper error handling: ${response.error.code}`);
        results.push({ test: test.name, success: true });
      } else {
        console.log(`   ❌ Expected error but got success`);
        results.push({ test: test.name, success: false });
      }
    }
    
    return results;
  }

  async testInputValidation() {
    console.log('\n✅ Testing input validation...');
    
    // Test tools that require specific parameters
    const validationTests = [
      {
        name: 'project_create with missing required fields',
        tool: 'project_create',
        args: { project_name: 'Test' }, // Missing required fields
        expectError: true
      },
      {
        name: 'project_get with valid project_id',
        tool: 'project_get',
        args: { project_id: 'test_project_123' },
        expectError: false // Should not error on validation, might error on API call
      }
    ];

    const results = [];
    
    for (const test of validationTests) {
      console.log(`   Testing: ${test.name}`);
      
      const response = await this.sendRequest('tools/call', {
        name: test.tool,
        arguments: test.args
      });
      
      const hasError = response && response.error;
      const success = test.expectError ? hasError : !hasError;
      
      if (success) {
        console.log(`   ✅ ${test.name} - Validation correct`);
      } else {
        console.log(`   ⚠️ ${test.name} - Unexpected result`);
      }
      
      results.push({ test: test.name, success, response });
    }
    
    return results;
  }

  async runAllTests() {
    try {
      await this.startServer();
      
      const results = {
        tools: await this.testToolsList(),
        resources: await this.testResourcesList(),
        execution: await this.testToolExecution(),
        errorHandling: await this.testErrorHandling(),
        validation: await this.testInputValidation()
      };
      
      console.log('\n📊 Test Summary:');
      console.log('================');
      
      // Tools test
      if (results.tools.success) {
        console.log(`✅ Tools: ${results.tools.tools.length} tools available`);
      } else {
        console.log('❌ Tools: Failed to list tools');
      }
      
      // Resources test
      if (results.resources.success) {
        console.log(`✅ Resources: ${results.resources.resources.length} resources available`);
      } else {
        console.log('❌ Resources: Failed to list resources');
      }
      
      // Execution test
      const successfulExecutions = results.execution.filter(r => r.success).length;
      console.log(`✅ Execution: ${successfulExecutions}/${results.execution.length} tools executed successfully`);
      
      // Error handling test
      const properErrors = results.errorHandling.filter(r => r.success).length;
      console.log(`✅ Error Handling: ${properErrors}/${results.errorHandling.length} error cases handled correctly`);
      
      // Validation test
      const validValidation = results.validation.filter(r => r.success).length;
      console.log(`✅ Validation: ${validValidation}/${results.validation.length} validation tests passed`);
      
      console.log('\n🎉 MCP Server Functionality Test Complete!');
      
      // Overall assessment
      const totalTests = results.execution.length + results.errorHandling.length + results.validation.length + 2;
      const passedTests = successfulExecutions + properErrors + validValidation + 
                         (results.tools.success ? 1 : 0) + (results.resources.success ? 1 : 0);
      
      console.log(`\n📈 Overall Score: ${passedTests}/${totalTests} tests passed`);
      
      if (passedTests === totalTests) {
        console.log('🏆 All tests passed! MCP server is fully functional.');
      } else if (passedTests >= totalTests * 0.8) {
        console.log('✅ Most tests passed. MCP server is working well.');
      } else {
        console.log('⚠️ Some issues detected. Review failed tests.');
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      return null;
    } finally {
      if (this.server) {
        this.server.kill();
      }
    }
  }
}

// Run tests
const tester = new MCPTester();
tester.runAllTests().then(results => {
  process.exit(results ? 0 : 1);
}).catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
