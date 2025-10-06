#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { LabellerrClient } from './labellerr-client.js';
import { 
  projectTools, 
  datasetTools, 
  annotationTools, 
  monitoringTools,
  queryTools 
} from './tools/index.js';

// Load environment variables
dotenv.config();

class LabellerrMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'labellerr-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        },
      }
    );

    // Initialize Labellerr client
    this.labellerrClient = null;
    this.initializeClient();

    // Setup handlers
    this.setupHandlers();
    
    // Store for tracking operations
    this.operationHistory = [];
    this.activeProjects = new Map();
    this.activeDatasets = new Map();
  }

  initializeClient() {
    const apiKey = process.env.LABELLERR_API_KEY;
    const apiSecret = process.env.LABELLERR_API_SECRET;
    const clientId = process.env.LABELLERR_CLIENT_ID;

    if (!apiKey || !apiSecret || !clientId) {
      console.error('Missing required environment variables. Please set LABELLERR_API_KEY, LABELLERR_API_SECRET, and LABELLERR_CLIENT_ID');
      return;
    }

    this.labellerrClient = new LabellerrClient(apiKey, apiSecret, clientId);
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Project Management Tools
          ...projectTools,
          
          // Dataset Management Tools
          ...datasetTools,
          
          // Annotation Tools
          ...annotationTools,
          
          // Monitoring Tools
          ...monitoringTools,
          
          // Query Tools
          ...queryTools
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!this.labellerrClient) {
        throw new McpError(
          ErrorCode.InternalError,
          'Labellerr client not initialized. Please check your environment variables.'
        );
      }

      try {
        // Route to appropriate handler based on tool category
        if (name.startsWith('project_')) {
          return await this.handleProjectTool(name, args);
        } else if (name.startsWith('dataset_')) {
          return await this.handleDatasetTool(name, args);
        } else if (name.startsWith('annotation_')) {
          return await this.handleAnnotationTool(name, args);
        } else if (name.startsWith('monitor_')) {
          return await this.handleMonitoringTool(name, args);
        } else if (name.startsWith('query_')) {
          return await this.handleQueryTool(name, args);
        } else {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
        }
      } catch (error) {
        // Log operation for history
        this.operationHistory.push({
          timestamp: new Date().toISOString(),
          tool: name,
          status: 'failed',
          error: error.message
        });

        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });

    // List resources (projects, datasets, exports)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = [];

      // Add active projects as resources
      for (const [projectId, project] of this.activeProjects) {
        resources.push({
          uri: `labellerr://project/${projectId}`,
          name: project.name,
          mimeType: 'application/json',
          description: `Project: ${project.name} (${project.dataType})`
        });
      }

      // Add active datasets as resources
      for (const [datasetId, dataset] of this.activeDatasets) {
        resources.push({
          uri: `labellerr://dataset/${datasetId}`,
          name: dataset.name,
          mimeType: 'application/json',
          description: `Dataset: ${dataset.name}`
        });
      }

      // Add operation history as a resource
      resources.push({
        uri: 'labellerr://history',
        name: 'Operation History',
        mimeType: 'application/json',
        description: 'History of all operations performed'
      });

      return { resources };
    });

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      if (uri === 'labellerr://history') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(this.operationHistory, null, 2)
            }
          ]
        };
      }

      const [, type, id] = uri.match(/^labellerr:\/\/(\w+)\/(.+)$/) || [];
      
      if (type === 'project') {
        const project = this.activeProjects.get(id);
        if (project) {
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(project, null, 2)
              }
            ]
          };
        }
      } else if (type === 'dataset') {
        const dataset = this.activeDatasets.get(id);
        if (dataset) {
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(dataset, null, 2)
              }
            ]
          };
        }
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Resource not found: ${uri}`
      );
    });
  }

  async handleProjectTool(name, args) {
    const startTime = Date.now();
    let result;

    switch (name) {
      case 'project_create':
        result = await this.labellerrClient.createProject(args);
        // Store project info
        this.activeProjects.set(result.project_id, {
          id: result.project_id,
          name: args.project_name,
          dataType: args.data_type,
          createdAt: new Date().toISOString(),
          ...args
        });
        break;

      case 'project_list':
        result = await this.labellerrClient.getAllProjects();
        // Update active projects cache
        for (const project of result.projects || []) {
          this.activeProjects.set(project.project_id, project);
        }
        break;

      case 'project_get':
        result = await this.labellerrClient.getProjectDetails(args.project_id);
        break;

      case 'project_update_rotation':
        result = await this.labellerrClient.updateRotationConfig(
          args.project_id,
          args.rotation_config
        );
        break;

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown project tool: ${name}`);
    }

    // Log successful operation
    this.operationHistory.push({
      timestamp: new Date().toISOString(),
      tool: name,
      duration: Date.now() - startTime,
      status: 'success',
      args: args
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleDatasetTool(name, args) {
    const startTime = Date.now();
    let result;

    switch (name) {
      case 'dataset_create':
        result = await this.labellerrClient.createDataset(args);
        // Store dataset info
        this.activeDatasets.set(result.dataset_id, {
          id: result.dataset_id,
          name: args.dataset_name,
          dataType: args.data_type,
          createdAt: new Date().toISOString()
        });
        break;

      case 'dataset_upload_files':
        result = await this.labellerrClient.uploadFiles(args);
        break;

      case 'dataset_upload_folder':
        result = await this.labellerrClient.uploadFolder(args);
        break;

      case 'dataset_list':
        result = await this.labellerrClient.getAllDatasets(args.data_type);
        // Update datasets cache
        for (const dataset of [...(result.linked || []), ...(result.unlinked || [])]) {
          this.activeDatasets.set(dataset.dataset_id, dataset);
        }
        break;

      case 'dataset_get':
        result = await this.labellerrClient.getDataset(args.dataset_id);
        break;

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown dataset tool: ${name}`);
    }

    this.operationHistory.push({
      timestamp: new Date().toISOString(),
      tool: name,
      duration: Date.now() - startTime,
      status: 'success'
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleAnnotationTool(name, args) {
    const startTime = Date.now();
    let result;

    switch (name) {
      case 'annotation_upload_preannotations':
        result = await this.labellerrClient.uploadPreannotations(args);
        break;

      case 'annotation_upload_preannotations_async':
        result = await this.labellerrClient.uploadPreannotationsAsync(args);
        break;

      case 'annotation_export':
        result = await this.labellerrClient.createExport(args);
        break;

      case 'annotation_check_export_status':
        result = await this.labellerrClient.checkExportStatus(args);
        break;

      case 'annotation_download_export':
        result = await this.labellerrClient.downloadExport(args);
        break;

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown annotation tool: ${name}`);
    }

    this.operationHistory.push({
      timestamp: new Date().toISOString(),
      tool: name,
      duration: Date.now() - startTime,
      status: 'success'
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleMonitoringTool(name, args) {
    let result;

    switch (name) {
      case 'monitor_job_status':
        result = await this.labellerrClient.getJobStatus(args.job_id);
        break;

      case 'monitor_project_progress':
        result = await this.labellerrClient.getProjectProgress(args.project_id);
        break;

      case 'monitor_active_operations':
        // Return current active operations from history
        result = {
          active_operations: this.operationHistory.filter(op => 
            op.status === 'in_progress' || 
            (op.timestamp && new Date(op.timestamp) > new Date(Date.now() - 300000)) // Last 5 minutes
          ),
          total_operations: this.operationHistory.length
        };
        break;

      case 'monitor_system_health':
        result = {
          status: 'healthy',
          connected: this.labellerrClient !== null,
          active_projects: this.activeProjects.size,
          active_datasets: this.activeDatasets.size,
          operations_performed: this.operationHistory.length,
          last_operation: this.operationHistory[this.operationHistory.length - 1] || null
        };
        break;

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown monitoring tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleQueryTool(name, args) {
    let result;

    switch (name) {
      case 'query_project_statistics':
        const project = await this.labellerrClient.getProjectDetails(args.project_id);
        result = {
          project_id: args.project_id,
          total_files: project.total_files || 0,
          annotated_files: project.annotated_files || 0,
          reviewed_files: project.reviewed_files || 0,
          accepted_files: project.accepted_files || 0,
          completion_percentage: project.completion_percentage || 0
        };
        break;

      case 'query_dataset_info':
        result = await this.labellerrClient.getDataset(args.dataset_id);
        break;

      case 'query_operation_history':
        const { limit = 10, status } = args;
        let history = [...this.operationHistory];
        
        if (status) {
          history = history.filter(op => op.status === status);
        }
        
        result = {
          total: history.length,
          operations: history.slice(-limit).reverse()
        };
        break;

      case 'query_search_projects':
        const allProjects = await this.labellerrClient.getAllProjects();
        const query = args.query.toLowerCase();
        result = {
          projects: allProjects.projects.filter(p => 
            p.project_name.toLowerCase().includes(query) ||
            p.data_type.toLowerCase().includes(query)
          )
        };
        break;

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown query tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('Labellerr MCP Server running on stdio');
    console.error('Connected to Labellerr API');
  }
}

// Start the server
const server = new LabellerrMCPServer();
server.run().catch(console.error);


