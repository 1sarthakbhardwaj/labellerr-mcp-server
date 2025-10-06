#!/usr/bin/env node

/**
 * Integration validation test for Claude Desktop compatibility
 * Tests MCP protocol compliance and tool functionality
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class IntegrationValidator {
  constructor() {
    this.server = null;
    this.requestId = 1;
    this.responses = [];
  }

  async startServer() {
    console.log('🔗 Validating Claude Desktop Integration...\n');
    
    const serverPath = join(__dirname, 'src', 'index.js');
    this.server = spawn('node', [serverPath], {
      env: { 
        ...process.env,
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
          // Not JSON
        }
      }
    });

    this.server.stderr.on('data', (data) => {
      // Suppress for cleaner output
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: this.requestId++
    };

    this.server.stdin.write(JSON.stringify(request) + '\n');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const response = this.responses.find(r => r.id === request.id);
    return response;
  }

  async validateMCPCompliance() {
    console.log('📋 Validating MCP Protocol Compliance...\n');
    
    const tests = [
      {
        name: 'Server Info',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        }
      },
      {
        name: 'Tools List',
        method: 'tools/list',
        params: {}
      },
      {
        name: 'Resources List', 
        method: 'resources/list',
        params: {}
      }
    ];

    const results = [];
    
    for (const test of tests) {
      console.log(`   Testing: ${test.name}`);
      
      const response = await this.sendRequest(test.method, test.params);
      
      if (response && response.result) {
        console.log(`   ✅ ${test.name} - Valid response`);
        results.push({ test: test.name, success: true, response });
      } else if (response && response.error) {
        console.log(`   ⚠️ ${test.name} - Error: ${response.error.message}`);
        results.push({ test: test.name, success: false, error: response.error });
      } else {
        console.log(`   ❌ ${test.name} - No response`);
        results.push({ test: test.name, success: false });
      }
    }
    
    return results;
  }

  async validateToolSchemas() {
    console.log('\n🔧 Validating Tool Schemas...\n');
    
    const toolsResponse = await this.sendRequest('tools/list');
    
    if (!toolsResponse || !toolsResponse.result || !toolsResponse.result.tools) {
      console.log('❌ Could not retrieve tools list');
      return false;
    }
    
    const tools = toolsResponse.result.tools;
    let validSchemas = 0;
    
    for (const tool of tools) {
      const hasName = typeof tool.name === 'string';
      const hasDescription = typeof tool.description === 'string';
      const hasInputSchema = tool.inputSchema && typeof tool.inputSchema === 'object';
      
      if (hasName && hasDescription && hasInputSchema) {
        validSchemas++;
      } else {
        console.log(`   ⚠️ Invalid schema: ${tool.name}`);
      }
    }
    
    console.log(`   ✅ ${validSchemas}/${tools.length} tools have valid schemas`);
    return validSchemas === tools.length;
  }

  async validateResourceAccess() {
    console.log('\n📚 Validating Resource Access...\n');
    
    // Test resource listing
    const listResponse = await this.sendRequest('resources/list');
    
    if (!listResponse || !listResponse.result) {
      console.log('   ❌ Could not list resources');
      return false;
    }
    
    const resources = listResponse.result.resources || [];
    console.log(`   ✅ Found ${resources.length} resources`);
    
    // Test reading a resource
    if (resources.length > 0) {
      const resource = resources[0];
      const readResponse = await this.sendRequest('resources/read', {
        uri: resource.uri
      });
      
      if (readResponse && readResponse.result) {
        console.log(`   ✅ Successfully read resource: ${resource.name}`);
        return true;
      } else {
        console.log(`   ⚠️ Could not read resource: ${resource.name}`);
        return false;
      }
    }
    
    return true;
  }

  async validateClaudeDesktopConfig() {
    console.log('\n⚙️ Validating Claude Desktop Configuration...\n');
    
    const configPath = join(__dirname, 'claude_desktop_config.json');
    
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      // Validate config structure
      const hasServers = config.mcpServers && typeof config.mcpServers === 'object';
      const hasLabellerr = hasServers && config.mcpServers.labellerr;
      const hasCommand = hasLabellerr && config.mcpServers.labellerr.command;
      const hasArgs = hasLabellerr && Array.isArray(config.mcpServers.labellerr.args);
      const hasEnv = hasLabellerr && config.mcpServers.labellerr.env;
      
      if (hasServers && hasLabellerr && hasCommand && hasArgs && hasEnv) {
        console.log('   ✅ Claude Desktop config is valid');
        console.log('   ✅ All required fields present');
        
        // Check environment variables
        const env = config.mcpServers.labellerr.env;
        const hasApiKey = env.LABELLERR_API_KEY;
        const hasApiSecret = env.LABELLERR_API_SECRET;
        const hasClientId = env.LABELLERR_CLIENT_ID;
        
        if (hasApiKey && hasApiSecret && hasClientId) {
          console.log('   ✅ Environment variables configured');
        } else {
          console.log('   ⚠️ Environment variables need to be set with real values');
        }
        
        return true;
      } else {
        console.log('   ❌ Claude Desktop config is invalid');
        return false;
      }
      
    } catch (error) {
      console.log(`   ❌ Could not read config file: ${error.message}`);
      return false;
    }
  }

  async generateIntegrationReport() {
    console.log('\n📊 Integration Report...\n');
    
    const mcpCompliance = await this.validateMCPCompliance();
    const toolSchemas = await this.validateToolSchemas();
    const resourceAccess = await this.validateResourceAccess();
    const claudeConfig = await this.validateClaudeDesktopConfig();
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 INTEGRATION VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    // MCP Compliance
    const mcpPassed = mcpCompliance.filter(t => t.success).length;
    const mcpTotal = mcpCompliance.length;
    console.log(`🔗 MCP Protocol Compliance: ${mcpPassed}/${mcpTotal} tests passed`);
    
    // Tool Schemas
    console.log(`🔧 Tool Schema Validation: ${toolSchemas ? 'PASS' : 'FAIL'}`);
    
    // Resource Access
    console.log(`📚 Resource Access: ${resourceAccess ? 'PASS' : 'FAIL'}`);
    
    // Claude Config
    console.log(`⚙️ Claude Desktop Config: ${claudeConfig ? 'VALID' : 'INVALID'}`);
    
    // Overall Assessment
    const totalChecks = 4;
    const passedChecks = (mcpPassed === mcpTotal ? 1 : 0) + 
                        (toolSchemas ? 1 : 0) + 
                        (resourceAccess ? 1 : 0) + 
                        (claudeConfig ? 1 : 0);
    
    console.log(`\n🎯 Overall Score: ${passedChecks}/${totalChecks} checks passed`);
    
    if (passedChecks === totalChecks) {
      console.log('\n🏆 READY FOR CLAUDE DESKTOP INTEGRATION!');
      console.log('\nNext steps:');
      console.log('1. Copy claude_desktop_config.json to your Claude config directory');
      console.log('2. Update environment variables with real Labellerr credentials');
      console.log('3. Restart Claude Desktop');
      console.log('4. Start using natural language commands!');
    } else {
      console.log('\n⚠️ Some issues need to be resolved before integration');
    }
    
    return {
      mcpCompliance: mcpPassed === mcpTotal,
      toolSchemas,
      resourceAccess,
      claudeConfig,
      overallScore: passedChecks / totalChecks
    };
  }

  async runValidation() {
    try {
      await this.startServer();
      const report = await this.generateIntegrationReport();
      return report;
    } catch (error) {
      console.error('❌ Validation failed:', error);
      return null;
    } finally {
      if (this.server) {
        this.server.kill();
      }
    }
  }
}

const validator = new IntegrationValidator();
validator.runValidation().then(report => {
  process.exit(report && report.overallScore >= 0.75 ? 0 : 1);
}).catch(error => {
  console.error('Validation runner failed:', error);
  process.exit(1);
});
