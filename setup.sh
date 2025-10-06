#!/bin/bash

# Labellerr MCP Server Setup Script

echo "======================================"
echo "  Labellerr MCP Server Setup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm is installed: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  Please edit .env file with your Labellerr credentials:"
    echo "   - LABELLERR_API_KEY"
    echo "   - LABELLERR_API_SECRET"
    echo "   - LABELLERR_CLIENT_ID"
    echo ""
    echo "To get credentials:"
    echo "   - Pro/Enterprise users: Contact Labellerr support"
    echo "   - Free users: Email support@labellerr.com"
else
    echo "✅ .env file already exists"
fi

# Create logs directory
if [ ! -d logs ]; then
    mkdir logs
    echo "✅ Created logs directory"
fi

# Test the server
echo ""
echo "🧪 Testing server setup..."
node test-server.js

echo ""
echo "======================================"
echo "  Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Labellerr credentials"
echo "2. Run 'npm start' to start the server"
echo "3. Configure Claude Desktop with claude_desktop_config.json"
echo ""
echo "For usage examples, see EXAMPLES.md"
echo "For documentation, see README.md"
echo ""
