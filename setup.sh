#!/bin/bash

# Tab Writer Setup Script
echo "🚀 Setting up Tab Writer - AI-Powered Writing Tool"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is required but not installed.${NC}"
    echo "Please install Python 3.8+ and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is required but not installed.${NC}"
    echo "Please install Node.js 18+ and try again."
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Setup Backend
echo -e "\n${BLUE}🔧 Setting up Flask Backend...${NC}"
cd backend

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Setup environment file
if [ ! -f .env ]; then
    echo "Creating environment file..."
    cp env.example .env
    echo -e "${YELLOW}⚠️  Please edit backend/.env and add your OpenAI API key${NC}"
    echo -e "${YELLOW}   OPENAI_API_KEY=your_openai_api_key_here${NC}"
else
    echo "Environment file already exists"
fi

cd ..

# Setup Frontend
echo -e "\n${BLUE}🎨 Setting up Next.js Frontend...${NC}"
cd frontend

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Setup environment file
if [ ! -f .env.local ]; then
    echo "Creating frontend environment file..."
    cp env.example .env.local
else
    echo "Frontend environment file already exists"
fi

cd ..

echo -e "\n${GREEN}🎉 Setup complete!${NC}"
echo -e "\n${BLUE}📋 Next Steps:${NC}"
echo "1. Add your OpenAI API key to backend/.env"
echo "2. Start the backend: cd backend && source venv/bin/activate && python app.py"
echo "3. In a new terminal, start the frontend: cd frontend && npm run dev"
echo "4. Open http://localhost:3000 in your browser"

echo -e "\n${YELLOW}💡 Pro Tips:${NC}"
echo "• Use Tab to accept suggestions"
echo "• Use arrow keys to switch between tones"
echo "• Use Escape to dismiss suggestions"
echo "• The app automatically saves as you type"

echo -e "\n${GREEN}Happy writing! ✍️${NC}" 