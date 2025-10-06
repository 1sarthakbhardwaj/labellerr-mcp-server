# Labellerr MCP Server - Usage Examples

This document provides practical examples of using the Labellerr MCP Server for various annotation workflows.

## Table of Contents
- [Basic Setup](#basic-setup)
- [Project Creation Workflows](#project-creation-workflows)
- [Dataset Management](#dataset-management)
- [Annotation Workflows](#annotation-workflows)
- [Monitoring and Analytics](#monitoring-and-analytics)
- [Advanced Queries](#advanced-queries)

## Basic Setup

### Environment Configuration
```bash
# Set up your credentials
export LABELLERR_API_KEY="your_api_key"
export LABELLERR_API_SECRET="your_api_secret"
export LABELLERR_CLIENT_ID="your_client_id"

# Or use a .env file
cp .env.example .env
# Edit .env with your credentials
```

## Project Creation Workflows

### 1. Image Classification Project

Create a project for classifying product images:

```json
{
  "tool": "project_create",
  "arguments": {
    "project_name": "Product Classification Q4 2024",
    "dataset_name": "E-commerce Products",
    "dataset_description": "Product images from our e-commerce platform",
    "data_type": "image",
    "created_by": "data-team@company.com",
    "annotation_guide": [
      {
        "question": "Product Category",
        "option_type": "dropdown",
        "required": true,
        "options": [
          "Electronics",
          "Clothing",
          "Home & Garden",
          "Sports Equipment",
          "Books & Media"
        ]
      },
      {
        "question": "Product Condition",
        "option_type": "radio",
        "required": true,
        "options": ["New", "Used", "Refurbished"]
      },
      {
        "question": "Additional Notes",
        "option_type": "input",
        "required": false,
        "options": []
      }
    ],
    "rotation_config": {
      "annotation_rotation_count": 1,
      "review_rotation_count": 1,
      "client_review_rotation_count": 0
    },
    "folder_to_upload": "/data/product-images/batch-001"
  }
}
```

### 2. Object Detection Project

Create a project for detecting objects with bounding boxes:

```json
{
  "tool": "project_create",
  "arguments": {
    "project_name": "Traffic Object Detection",
    "dataset_name": "Street View Dataset",
    "data_type": "image",
    "created_by": "ml-team@company.com",
    "annotation_guide": [
      {
        "question": "Vehicle Detection",
        "option_type": "BoundingBox",
        "required": true,
        "options": [{"option_name": "#ff0000"}]
      },
      {
        "question": "Pedestrian Detection",
        "option_type": "BoundingBox",
        "required": true,
        "options": [{"option_name": "#00ff00"}]
      },
      {
        "question": "Traffic Sign",
        "option_type": "polygon",
        "required": false,
        "options": [{"option_name": "#0000ff"}]
      }
    ],
    "folder_to_upload": "/data/traffic-images"
  }
}
```

### 3. Document Analysis Project

Create a project for PDF document annotation:

```json
{
  "tool": "project_create",
  "arguments": {
    "project_name": "Contract Review Project",
    "dataset_name": "Legal Documents Q4",
    "data_type": "document",
    "created_by": "legal-team@company.com",
    "annotation_guide": [
      {
        "question": "Document Type",
        "option_type": "select",
        "required": true,
        "options": [
          "Contract",
          "Agreement",
          "Invoice",
          "Report",
          "Other"
        ]
      },
      {
        "question": "Key Clauses Found",
        "option_type": "select",
        "required": true,
        "options": [
          "Payment Terms",
          "Liability",
          "Termination",
          "Confidentiality",
          "Warranties"
        ]
      },
      {
        "question": "Risk Level",
        "option_type": "radio",
        "required": true,
        "options": ["Low", "Medium", "High"]
      }
    ],
    "folder_to_upload": "/data/contracts/2024"
  }
}
```

## Dataset Management

### Upload Files to Dataset

```json
{
  "tool": "dataset_upload_files",
  "arguments": {
    "files": [
      "/data/images/img001.jpg",
      "/data/images/img002.jpg",
      "/data/images/img003.jpg"
    ],
    "data_type": "image"
  }
}
```

### Upload Entire Folder

```json
{
  "tool": "dataset_upload_folder",
  "arguments": {
    "folder_path": "/data/new-batch",
    "data_type": "image"
  }
}
```

### List All Datasets

```json
{
  "tool": "dataset_list",
  "arguments": {
    "data_type": "image"
  }
}
```

## Annotation Workflows

### Upload Pre-annotations (COCO Format)

```json
{
  "tool": "annotation_upload_preannotations",
  "arguments": {
    "project_id": "proj_abc123",
    "annotation_format": "coco_json",
    "annotation_file": "/data/annotations/coco_annotations.json"
  }
}
```

### Upload CSV Annotations

```json
{
  "tool": "annotation_upload_preannotations",
  "arguments": {
    "project_id": "proj_abc123",
    "annotation_format": "csv",
    "annotation_file": "/data/annotations/labels.csv"
  }
}
```

### Export Annotations

```json
{
  "tool": "annotation_export",
  "arguments": {
    "project_id": "proj_abc123",
    "export_name": "Final Review Export",
    "export_description": "All accepted annotations for model training",
    "export_format": "coco_json",
    "statuses": ["accepted", "client_review"]
  }
}
```

### Check Export Status

```json
{
  "tool": "annotation_check_export_status",
  "arguments": {
    "project_id": "proj_abc123",
    "export_ids": ["export_001", "export_002"]
  }
}
```

## Monitoring and Analytics

### Get Project Progress

```json
{
  "tool": "monitor_project_progress",
  "arguments": {
    "project_id": "proj_abc123"
  }
}
```

Response example:
```json
{
  "success": true,
  "project_id": "proj_abc123",
  "progress": {
    "total_files": 1000,
    "annotated": 750,
    "reviewed": 600,
    "accepted": 500,
    "completion_percentage": 50
  }
}
```

### Monitor Active Operations

```json
{
  "tool": "monitor_active_operations",
  "arguments": {}
}
```

### Check System Health

```json
{
  "tool": "monitor_system_health",
  "arguments": {}
}
```

## Advanced Queries

### Get Project Statistics

```json
{
  "tool": "query_project_statistics",
  "arguments": {
    "project_id": "proj_abc123"
  }
}
```

### Search Projects

```json
{
  "tool": "query_search_projects",
  "arguments": {
    "query": "traffic"
  }
}
```

### Query Operation History

```json
{
  "tool": "query_operation_history",
  "arguments": {
    "limit": 20,
    "status": "success"
  }
}
```

## Complete Workflow Example

Here's a complete workflow from project creation to export:

```javascript
// Step 1: Create a project
await callTool("project_create", {
  project_name: "Vehicle Detection 2024",
  dataset_name: "Traffic Images",
  data_type: "image",
  created_by: "ml@company.com",
  annotation_guide: [
    {
      question: "Vehicle Type",
      option_type: "select",
      options: ["Car", "Truck", "Bus", "Motorcycle", "Bicycle"],
      required: true
    }
  ],
  folder_to_upload: "/data/traffic"
});

// Step 2: Get project ID from response
const projectId = "proj_xyz789";

// Step 3: Upload pre-annotations if available
await callTool("annotation_upload_preannotations", {
  project_id: projectId,
  annotation_format: "coco_json",
  annotation_file: "/data/pre_annotations.json"
});

// Step 4: Monitor progress
const progress = await callTool("monitor_project_progress", {
  project_id: projectId
});

// Step 5: Export when ready
const exportResult = await callTool("annotation_export", {
  project_id: projectId,
  export_name: "Training Data Export",
  export_format: "coco_json",
  statuses: ["accepted"]
});

// Step 6: Check export status
const status = await callTool("annotation_check_export_status", {
  project_id: projectId,
  export_ids: [exportResult.export_id]
});

// Step 7: Download when complete
if (status.completed.length > 0) {
  const download = await callTool("annotation_download_export", {
    project_id: projectId,
    export_id: exportResult.export_id
  });
  console.log("Download URL:", download.download_url);
}
```

## Error Handling

All tools return structured responses. Check for errors:

```javascript
const result = await callTool("project_create", { /* ... */ });

if (result.error) {
  console.error("Operation failed:", result.error);
} else {
  console.log("Success:", result);
}
```

## Tips and Best Practices

1. **Batch Operations**: When uploading many files, use folder upload instead of individual files
2. **Monitoring**: Regularly check project progress to track annotation status
3. **Exports**: Export data incrementally as annotations are completed
4. **Pre-annotations**: Upload pre-annotations early to speed up manual annotation
5. **Rotation Config**: Set appropriate rotation counts based on quality requirements
6. **Data Types**: Ensure file extensions match the specified data type
7. **Error Recovery**: Use operation history to debug failed operations

## Support

For additional help:
- Check the [README](README.md) for setup instructions
- Review the [Labellerr Documentation](https://docs.labellerr.com)
- Contact support@labellerr.com for API access
