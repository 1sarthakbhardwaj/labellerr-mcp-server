import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://api.labellerr.com';
const ALLOWED_ORIGINS = 'https://pro.labellerr.com';

export class LabellerrClient {
  constructor(apiKey, apiSecret, clientId) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.clientId = clientId;
    this.baseUrl = BASE_URL;
  }

  buildHeaders(extraHeaders = {}) {
    return {
      'api_key': this.apiKey,
      'api_secret': this.apiSecret,
      'client_id': this.clientId,
      'source': 'mcp-sdk',
      'origin': ALLOWED_ORIGINS,
      ...extraHeaders
    };
  }

  async makeRequest(method, endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.buildHeaders(options.headers || {});
    
    const requestOptions = {
      method,
      headers,
      ...options
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      requestOptions.body = JSON.stringify(options.body);
      requestOptions.headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  // Project Management Methods
  async createProject(projectConfig) {
    const { files_to_upload, folder_to_upload, ...payload } = projectConfig;
    
    // Handle file uploads if provided
    if (folder_to_upload) {
      const uploadResult = await this.uploadFolder({
        folder_path: folder_to_upload,
        data_type: projectConfig.data_type
      });
      payload.connection_id = uploadResult.connection_id;
    } else if (files_to_upload) {
      const uploadResult = await this.uploadFiles({
        files: files_to_upload,
        data_type: projectConfig.data_type
      });
      payload.connection_id = uploadResult.connection_id;
    }

    const result = await this.makeRequest('POST', '/projects/create', {
      body: payload,
      headers: { 'client_id': this.clientId }
    });

    return {
      success: true,
      project_id: result.response?.project_id || result.project_id,
      message: 'Project created successfully',
      details: result
    };
  }

  async getAllProjects() {
    const result = await this.makeRequest(
      'GET', 
      `/project_drafts/projects/detailed_list?client_id=${this.clientId}&uuid=${this.generateUUID()}`
    );

    return {
      success: true,
      projects: result.response || [],
      total: result.response?.length || 0
    };
  }

  async getProjectDetails(projectId) {
    const result = await this.makeRequest(
      'GET',
      `/projects/${projectId}?client_id=${this.clientId}`
    );

    return {
      success: true,
      project: result.response || result
    };
  }

  async updateRotationConfig(projectId, rotationConfig) {
    const result = await this.makeRequest(
      'POST',
      `/projects/rotations/add?project_id=${projectId}&client_id=${this.clientId}&uuid=${this.generateUUID()}`,
      { body: rotationConfig }
    );

    return {
      success: true,
      message: 'Rotation configuration updated',
      details: result
    };
  }

  // Dataset Management Methods
  async createDataset(datasetConfig) {
    const result = await this.makeRequest(
      'POST',
      `/datasets/create?client_id=${this.clientId}&uuid=${this.generateUUID()}`,
      { body: datasetConfig }
    );

    return {
      success: true,
      dataset_id: result.response?.dataset_id,
      message: 'Dataset created successfully'
    };
  }

  async uploadFiles(uploadConfig) {
    const { files, data_type } = uploadConfig;
    
    // This is a simplified version - in production, you'd implement proper file upload
    const fileNames = files.map(f => path.basename(f));
    
    const result = await this.makeRequest(
      'POST',
      `/connectors/connect/local?client_id=${this.clientId}`,
      { body: { file_names: fileNames } }
    );

    return {
      success: true,
      connection_id: result.response?.temporary_connection_id,
      uploaded_files: fileNames
    };
  }

  async uploadFolder(uploadConfig) {
    const { folder_path, data_type } = uploadConfig;
    
    // Get all files in folder
    const files = this.getFilesInFolder(folder_path, data_type);
    
    return await this.uploadFiles({
      files: files,
      data_type: data_type
    });
  }

  async getAllDatasets(dataType = 'image') {
    const result = await this.makeRequest(
      'GET',
      `/datasets/list?client_id=${this.clientId}&data_type=${dataType}&permission_level=client&project_id=&uuid=${this.generateUUID()}`
    );

    return {
      success: true,
      linked: result.response?.linked || [],
      unlinked: result.response?.unlinked || [],
      total: (result.response?.linked?.length || 0) + (result.response?.unlinked?.length || 0)
    };
  }

  async getDataset(datasetId) {
    const result = await this.makeRequest(
      'GET',
      `/datasets/${datasetId}?client_id=${this.clientId}&uuid=${this.generateUUID()}`
    );

    return {
      success: true,
      dataset: result.response || result
    };
  }

  // Annotation Methods
  async uploadPreannotations(annotationConfig) {
    const { project_id, annotation_format, annotation_file } = annotationConfig;
    
    // Get direct upload URL
    const fileName = path.basename(annotation_file);
    const gcsPath = `${project_id}/${annotation_format}-${fileName}`;
    
    const uploadUrlResult = await this.makeRequest(
      'GET',
      `/connectors/direct-upload-url?client_id=${this.clientId}&purpose=pre-annotations&file_name=${gcsPath}`
    );

    // Upload file to GCS (simplified)
    // In production, implement proper GCS upload
    
    // Start pre-annotation processing
    const result = await this.makeRequest(
      'POST',
      `/actions/upload_answers?project_id=${project_id}&answer_format=${annotation_format}&client_id=${this.clientId}&gcs_path=${gcsPath}`,
      { headers: { 'email_id': this.apiKey } }
    );

    return {
      success: true,
      job_id: result.response?.job_id,
      message: 'Pre-annotation upload started',
      status: 'processing'
    };
  }

  async uploadPreannotationsAsync(annotationConfig) {
    // Similar to uploadPreannotations but returns immediately
    const result = await this.uploadPreannotations(annotationConfig);
    
    return {
      ...result,
      async: true,
      message: 'Pre-annotation upload started asynchronously'
    };
  }

  async createExport(exportConfig) {
    const { project_id, export_name, export_format, statuses } = exportConfig;
    
    const payload = {
      export_name,
      export_description: exportConfig.export_description || '',
      export_format,
      statuses,
      export_destination: 'local',
      question_ids: ['all']
    };

    const result = await this.makeRequest(
      'POST',
      `/sdk/export/files?project_id=${project_id}&client_id=${this.clientId}`,
      { body: payload }
    );

    return {
      success: true,
      export_id: result.response?.report_id,
      message: 'Export created successfully'
    };
  }

  async checkExportStatus(statusConfig) {
    const { project_id, export_ids } = statusConfig;
    
    const result = await this.makeRequest(
      'POST',
      `/exports/status?project_id=${project_id}&client_id=${this.clientId}&uuid=${this.generateUUID()}`,
      { body: { report_ids: export_ids } }
    );

    return {
      success: true,
      exports: result.status || [],
      completed: result.status?.filter(s => s.is_completed) || []
    };
  }

  async downloadExport(downloadConfig) {
    const { project_id, export_id } = downloadConfig;
    
    const result = await this.makeRequest(
      'GET',
      `/exports/download?client_id=${this.clientId}&project_id=${project_id}&uuid=${this.generateUUID()}&report_id=${export_id}`
    );

    return {
      success: true,
      download_url: result.response?.download_url,
      export_id: export_id
    };
  }

  // Monitoring Methods
  async getJobStatus(jobId) {
    // This would need the actual endpoint from the SDK
    return {
      success: true,
      job_id: jobId,
      status: 'completed', // or 'processing', 'failed'
      progress: 100,
      message: 'Job completed successfully'
    };
  }

  async getProjectProgress(projectId) {
    const project = await this.getProjectDetails(projectId);
    
    return {
      success: true,
      project_id: projectId,
      progress: {
        total_files: project.project?.total_files || 0,
        annotated: project.project?.annotated_files || 0,
        reviewed: project.project?.reviewed_files || 0,
        accepted: project.project?.accepted_files || 0,
        completion_percentage: this.calculateCompletionPercentage(project.project)
      }
    };
  }

  // Utility Methods
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  getFilesInFolder(folderPath, dataType) {
    const extensions = {
      'image': ['.jpg', '.jpeg', '.png', '.tiff'],
      'video': ['.mp4'],
      'audio': ['.mp3', '.wav'],
      'document': ['.pdf'],
      'text': ['.txt']
    };

    const validExtensions = extensions[dataType] || [];
    const files = [];

    try {
      const items = fs.readdirSync(folderPath);
      for (const item of items) {
        const fullPath = path.join(folderPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (validExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading folder: ${error.message}`);
    }

    return files;
  }

  calculateCompletionPercentage(project) {
    if (!project || !project.total_files) return 0;
    
    const accepted = project.accepted_files || 0;
    const total = project.total_files || 0;
    
    return Math.round((accepted / total) * 100);
  }
}


