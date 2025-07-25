# Chameleon - AI-assisted writing that retains your voice and style by autocompleting thoughts

```bash
# Clone the repository
git clone <your-repo-url>
cd chameleon

# Run the setup script
chmod +x setup.sh
./setup.sh

# Add your OpenAI API key to frontend/.env.local
# OPENAI_API_KEY=your_openai_api_key_here

# Start the application
cd frontend
npm run dev
```

### Option 2: Manual Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd tab-writer/frontend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local

# Edit .env.local file and add your OpenAI API key
# OPENAI_API_KEY=your_openai_api_key_here

# Run the development server
npm run dev
```

The application will be running on `http://localhost:3000`

## Usage

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Accept suggestion | `Ctrl+Enter` / `Cmd+Enter` |
| Dismiss suggestion | `Escape` |
| Switch between tone/purpose/genre/structure modes | `Ctrl+←/→` / `Cmd+←/→` |
| Switch current mode up | `Ctrl+↑` / `Cmd+↑` |
| Switch current mode down | `Ctrl+↓` / `Cmd+↓` |



## Configuration

### Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
NODE_ENV=development
```

## Development

### Development Commands

```bash
cd frontend

# Install dependencies
npm install

# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```