#!/bin/bash

# Chameleon Setup Script
echo "🚀 Setting up Chameleon - Adaptive AI Writing Tool"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is required but not installed.${NC}"
    echo "Please install Node.js 18+ and try again."
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Setup Frontend (now includes backend functionality)
echo -e "\n${BLUE}🔧 Setting up Chameleon Application...${NC}"
cd frontend

# Install Node.js dependencies
echo "Installing dependencies..."
npm install

# Setup environment file
if [ ! -f .env.local ]; then
    echo "Creating environment file..."
    cp env.example .env.local
    echo -e "${YELLOW}⚠️  Please edit frontend/.env.local and add your OpenAI API key${NC}"
    echo -e "${YELLOW}   OPENAI_API_KEY=your_openai_api_key_here${NC}"
else
    echo "Environment file already exists"
fi

cd ..

echo -e "\n${GREEN}🎉 Setup complete!${NC}"
echo -e "\n${BLUE}📋 Next Steps:${NC}"
echo "1. Add your OpenAI API key to frontend/.env.local"
echo "2. Start the application: cd frontend && npm run dev"
echo "3. Open http://localhost:3000 in your browser"

echo -e "\n${YELLOW}💡 Pro Tips:${NC}"
echo "• Use Tab to accept suggestions"
echo "• Use arrow keys to switch between tones"
echo "• Use Escape to dismiss suggestions"
echo "• The app automatically saves as you type"

echo -e "\n${BLUE}🚀 Architecture Update:${NC}"
echo "✅ Converted from Python Flask + Next.js to pure TypeScript"
echo "✅ Reduced deployment complexity - everything runs in Next.js"
echo "✅ Lower latency - no separate backend server needed"
echo "✅ Same OpenAI functionality with better performance"

echo -e "\n${GREEN}Happy writing! ✍️${NC}" 