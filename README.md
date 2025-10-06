# Labellerr MCP Server

[![GitHub release](https://img.shields.io/github/release/1sarthakbhardwaj/labellerr-mcp-server.svg)](https://github.com/1sarthakbhardwaj/labellerr-mcp-server/releases)
[![GitHub license](https://img.shields.io/github/license/1sarthakbhardwaj/labellerr-mcp-server.svg)](https://github.com/1sarthakbhardwaj/labellerr-mcp-server/blob/main/LICENSE)
[![Node.js CI](https://github.com/1sarthakbhardwaj/labellerr-mcp-server/actions/workflows/test.yml/badge.svg)](https://github.com/1sarthakbhardwaj/labellerr-mcp-server/actions/workflows/test.yml)
[![MCP Protocol](https://img.shields.io/badge/MCP-Protocol-blue)](https://modelcontextprotocol.io)

A Model Context Protocol (MCP) server that provides a comprehensive interface to the Labellerr SDK for managing annotation projects, datasets, and monitoring operations through AI assistants like Claude Desktop and Cursor.

## Features

- **🚀 Project Management** - Create, list, update, and track annotation projects
- **📊 Dataset Management** - Create datasets, upload files/folders, and query information
- **🏷️ Annotation Tools** - Upload pre-annotations, export data, and download results
- **📈 Monitoring & Insights** - Real-time progress tracking and system health monitoring
- **🔍 Query Capabilities** - Search projects, get statistics, and analyze operations

**22 specialized tools** available across 5 categories to streamline your annotation workflow.

## Installation

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Labellerr API credentials (API Key, API Secret, Client ID)

### Setup

1. **Clone the repository:**
```bash
git clone https://github.com/1sarthakbhardwaj/labellerr-mcp-server.git
cd labellerr-mcp-server
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and add your Labellerr credentials:
```env
LABELLERR_API_KEY=your_api_key_here
LABELLERR_API_SECRET=your_api_secret_here
LABELLERR_CLIENT_ID=your_client_id_here
```

> **Getting Credentials:** Contact Labellerr support or email support@labellerr.com to obtain your API credentials.

## Configuration

### Option 1: Using with Claude Desktop

Add to your Claude Desktop configuration file:

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "labellerr": {
      "command": "node",
      "args": ["/absolute/path/to/labellerr-mcp-server/src/index.js"],
      "env": {
        "LABELLERR_API_KEY": "your_api_key",
        "LABELLERR_API_SECRET": "your_api_secret",
        "LABELLERR_CLIENT_ID": "your_client_id"
      }
    }
  }
}
```

**Important:** Replace `/absolute/path/to/` with the full path to your installation directory.

After configuration:
1. Restart Claude Desktop completely
2. The Labellerr tools will be available in your conversations
3. Ask Claude to list your projects or check system health

### Option 2: Using with Cursor

Add to your Cursor MCP configuration file:

**Location:** `~/.cursor/mcp.json` (macOS/Linux) or `%APPDATA%\Cursor\mcp.json` (Windows)

```json
{
  "mcpServers": {
    "labellerr": {
      "command": "node",
      "args": ["/absolute/path/to/labellerr-mcp-server/src/index.js"],
      "env": {
        "LABELLERR_API_KEY": "your_api_key",
        "LABELLERR_API_SECRET": "your_api_secret",
        "LABELLERR_CLIENT_ID": "your_client_id"
      }
    }
  }
}
```

**Important:** Replace `/absolute/path/to/` with the full path to your installation directory.

After configuration:
1. Restart Cursor completely (Quit and reopen)
2. The Labellerr tools will be available in the AI assistant
3. Try asking: "List all my Labellerr projects"

### Verifying Installation

Test the server is working:

```bash
# Start the server
npm start

# In another terminal, test the protocol
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node src/index.js
```

You should see a JSON response listing all 22 available tools.

## Usage

### Starting the Server Standalone

```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

### Using with AI Assistants

Once configured with Claude Desktop or Cursor, you can interact naturally:

**Project Management:**
- "List all my Labellerr projects"
- "Create a new image classification project for product categorization"
- "What's the progress of project XYZ?"

**Dataset Operations:**
- "Upload images from /path/to/folder"
- "List all my datasets"
- "Create a new dataset for video annotation"

**Monitoring:**
- "Show me system health"
- "Check the progress of my active projects"
- "What operations have been performed?"

**Exports:**
- "Export annotations in COCO format"
- "Check status of export ABC123"
- "Download completed export"

## Available Tools

The server provides 22 specialized tools:

### 📋 Project Management (4 tools)
- `project_create` - Create projects with annotation guidelines
- `project_list` - List all projects
- `project_get` - Get detailed project information
- `project_update_rotation` - Update rotation configuration

### 📊 Dataset Management (5 tools)
- `dataset_create` - Create new datasets
- `dataset_upload_files` - Upload individual files
- `dataset_upload_folder` - Upload entire folders
- `dataset_list` - List all datasets
- `dataset_get` - Get dataset information

### 🏷️ Annotation Operations (5 tools)
- `annotation_upload_preannotations` - Upload pre-annotations (sync)
- `annotation_upload_preannotations_async` - Upload pre-annotations (async)
- `annotation_export` - Create annotation export
- `annotation_check_export_status` - Check export status
- `annotation_download_export` - Get export download URL

### 📈 Monitoring & Analytics (4 tools)
- `monitor_job_status` - Monitor background job status
- `monitor_project_progress` - Track project progress
- `monitor_active_operations` - List active operations
- `monitor_system_health` - Check system health

### 🔍 Query & Search (4 tools)
- `query_project_statistics` - Get detailed project stats
- `query_dataset_info` - Get dataset information
- `query_operation_history` - View operation history
- `query_search_projects` - Search projects by name/type

For detailed parameters and examples, see the [Full Tool Documentation](#detailed-tool-reference) below.

## Supported Data Types

- **image** - JPEG, PNG, TIFF
- **video** - MP4
- **audio** - MP3, WAV
- **document** - PDF
- **text** - TXT

## Annotation Types

- `BoundingBox` - Rectangle annotations for object detection
- `polygon` - Polygon shapes for segmentation
- `dot` - Point annotations
- `radio` - Single choice selection
- `dropdown` - Dropdown selection
- `boolean` - Yes/No selection
- `input` - Text input field
- `select` - Multiple choice selection

## Export Formats

- `json` - Standard JSON format
- `coco_json` - COCO dataset format
- `csv` - Comma-separated values
- `png` - Image masks

## Limits

- Maximum 2,500 files per folder upload
- Maximum 2.5 GB total folder size
- Batch processing: 15 MB per batch, 900 files max

## Example Workflows

### 1. Create an Object Detection Project

```javascript
{
  "project_name": "Vehicle Detection",
  "dataset_name": "Traffic Dataset",
  "data_type": "image",
  "created_by": "user@example.com",
  "annotation_guide": [
    {
      "question": "Detect Vehicles",
      "option_type": "BoundingBox",
      "required": true,
      "options": [{"option_name": "#ff0000"}]
    }
  ],
  "folder_to_upload": "/path/to/images"
}
```

### 2. Monitor Project Progress

Ask your AI assistant: "Show me the progress of my annotation projects"

The server will return:
- Total files
- Annotated count
- Reviewed count
- Completion percentage

### 3. Export Annotations

```javascript
{
  "project_id": "proj_abc123",
  "export_name": "Training Export",
  "export_format": "coco_json",
  "statuses": ["accepted", "reviewed"]
}
```

### 4. Search Projects

Ask: "Find all projects related to 'vehicle' or 'traffic'"

The server will search project names and return matching results.

## Detailed Tool Reference

<details>
<summary><strong>Project Management Tools</strong></summary>

### project_create
Create a new annotation project.

**Parameters:**
- `project_name` (string, required) - Name of the project
- `dataset_name` (string, required) - Name of the dataset
- `data_type` (string, required) - Type: image/video/audio/document/text
- `created_by` (string, required) - Creator's email
- `annotation_guide` (array, required) - Annotation questions/guidelines
- `dataset_description` (string, optional) - Dataset description
- `folder_to_upload` (string, optional) - Path to folder with files
- `files_to_upload` (array, optional) - Array of file paths
- `rotation_config` (object, optional) - Rotation configuration
- `autolabel` (boolean, optional) - Enable auto-labeling

### project_list
List all projects for the client.

**Returns:** Array of projects with metadata

### project_get
Get detailed information about a specific project.

**Parameters:**
- `project_id` (string, required) - ID of the project

### project_update_rotation
Update rotation configuration for a project.

**Parameters:**
- `project_id` (string, required) - ID of the project
- `rotation_config` (object, required) - New rotation settings

</details>

<details>
<summary><strong>Dataset Management Tools</strong></summary>

### dataset_create
Create a new dataset.

**Parameters:**
- `dataset_name` (string, required) - Name of the dataset
- `data_type` (string, required) - Type of data
- `dataset_description` (string, optional) - Description

### dataset_upload_files
Upload individual files to a dataset.

**Parameters:**
- `files` (array, required) - Array of file paths
- `data_type` (string, required) - Type of data

### dataset_upload_folder
Upload all files from a folder.

**Parameters:**
- `folder_path` (string, required) - Path to folder
- `data_type` (string, required) - Type of data

### dataset_list
List all datasets (linked and unlinked).

**Parameters:**
- `data_type` (string, optional) - Filter by data type (default: "image")

### dataset_get
Get detailed information about a dataset.

**Parameters:**
- `dataset_id` (string, required) - ID of the dataset

</details>

<details>
<summary><strong>Annotation Tools</strong></summary>

### annotation_upload_preannotations
Upload pre-annotations (synchronous).

**Parameters:**
- `project_id` (string, required) - ID of the project
- `annotation_format` (string, required) - Format: json/coco_json/csv/png
- `annotation_file` (string, required) - Path to annotation file

### annotation_upload_preannotations_async
Upload pre-annotations (asynchronous).

**Parameters:**
- Same as `annotation_upload_preannotations`

### annotation_export
Create an export of project annotations.

**Parameters:**
- `project_id` (string, required) - ID of the project
- `export_name` (string, required) - Name for the export
- `export_format` (string, required) - Format for export
- `statuses` (array, required) - Statuses to include
- `export_description` (string, optional) - Description

### annotation_check_export_status
Check the status of export jobs.

**Parameters:**
- `project_id` (string, required) - ID of the project
- `export_ids` (array, required) - Array of export IDs

### annotation_download_export
Get download URL for a completed export.

**Parameters:**
- `project_id` (string, required) - ID of the project
- `export_id` (string, required) - ID of the export

</details>

<details>
<summary><strong>Monitoring Tools</strong></summary>

### monitor_job_status
Monitor the status of a background job.

**Parameters:**
- `job_id` (string, required) - ID of the job

### monitor_project_progress
Get progress statistics for a project.

**Parameters:**
- `project_id` (string, required) - ID of the project

### monitor_active_operations
List all active operations and their status.

**Returns:** List of active operations with timestamps

### monitor_system_health
Check the health and status of the MCP server.

**Returns:** System status, connectivity, active projects count

</details>

<details>
<summary><strong>Query Tools</strong></summary>

### query_project_statistics
Get detailed statistics for a project.

**Parameters:**
- `project_id` (string, required) - ID of the project

### query_dataset_info
Get detailed information about a dataset.

**Parameters:**
- `dataset_id` (string, required) - ID of the dataset

### query_operation_history
Query the history of operations performed.

**Parameters:**
- `limit` (number, optional) - Max number of operations (default: 10)
- `status` (string, optional) - Filter by status: success/failed/in_progress

### query_search_projects
Search for projects by name or type.

**Parameters:**
- `query` (string, required) - Search query string

</details>

## Troubleshooting

### Server won't start
- Verify Node.js version (requires 16+)
- Check environment variables are set correctly
- Ensure port is not in use

### Tools return errors
- Verify Labellerr API credentials are correct
- Check network connectivity
- Review operation history for error details

### AI assistant can't find tools
- Verify configuration file path is correct
- Use absolute paths, not relative paths
- Restart the AI assistant completely after configuration
- Check that credentials are set in the config file

### Debug Mode
Set `LOG_LEVEL=debug` in your `.env` file for detailed logging.

## Development

### Project Structure
```
labellerr-mcp-server/
├── src/
│   ├── index.js              # Main server entry point
│   ├── labellerr-client.js   # Labellerr API client
│   └── tools/
│       └── index.js          # Tool definitions
├── package.json              # Dependencies and scripts
├── .env.example              # Environment template
├── claude_desktop_config.json # Claude configuration example
├── LICENSE                   # MIT License
└── README.md                 # This file
```

### Adding New Tools

1. Define the tool schema in `src/tools/index.js`
2. Implement the handler in `src/index.js` (handleCallTool method)
3. Add the client method in `src/labellerr-client.js` if needed
4. Update documentation

## Resources

- **Labellerr Documentation:** [docs.labellerr.com](https://docs.labellerr.com)
- **MCP Protocol:** [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Support Email:** support@labellerr.com
- **GitHub Issues:** [github.com/1sarthakbhardwaj/labellerr-mcp-server/issues](https://github.com/1sarthakbhardwaj/labellerr-mcp-server/issues)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ for the Labellerr community
