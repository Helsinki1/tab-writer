# Tab Writer - AI-Powered Writing Tool

A sophisticated writing tool with intelligent tone-switching autocomplete functionality. Built with Next.js, Lexical editor, and Flask backend powered by OpenAI GPT-3.5-turbo.

![Tab Writer Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Tab+Writer+Demo)

## Features

- 🤖 **AI-Powered Autocomplete**: Intelligent text suggestions using OpenAI GPT-3.5-turbo
- 🎭 **Dynamic Tone Switching**: Switch between Professional, Casual, Creative, and Concise tones
- ⌨️ **Keyboard Shortcuts**: Intuitive controls for accepting suggestions and switching tones
- 🌙 **Dark/Light Mode**: Beautiful themes for comfortable writing in any environment
- 📝 **Rich Text Editor**: Built with Facebook's Lexical editor for optimal performance
- 📊 **Real-time Analytics**: Word count and character count tracking
- 🚀 **Debounced API Calls**: Efficient request handling with 500ms debouncing
- 📋 **Export Functionality**: Copy your text to clipboard with one click

## Project Structure

```
tab-writer/
├── frontend/          # Next.js React application
│   ├── src/
│   │   ├── app/       # Next.js 13 app directory
│   │   └── components/ # React components
│   ├── package.json
│   └── tailwind.config.js
├── backend/           # Flask API server
│   ├── app.py         # Main Flask application
│   ├── requirements.txt
│   └── env.example    # Environment variables template
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ and pip
- OpenAI API key

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd tab-writer
```

### 2. Backend Setup (Flask)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.example .env

# Edit .env file and add your OpenAI API key
# OPENAI_API_KEY=your_openai_api_key_here

# Run the Flask server
python app.py
```

The backend will be running on `http://localhost:5000`

### 3. Frontend Setup (Next.js)

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local

# Run the development server
npm run dev
```

The frontend will be running on `http://localhost:3000`

## Usage

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Accept suggestion | `Ctrl+Enter` / `Cmd+Enter` |
| Dismiss suggestion | `Escape` |
| Switch tone up | `Ctrl+↑` / `Cmd+↑` |
| Switch tone down | `Ctrl+↓` / `Cmd+↓` |

### Writing Flow

1. **Start Writing**: Begin typing in the editor
2. **Wait for Suggestions**: After 500ms of pause, AI generates suggestions
3. **Review Suggestion**: Gray italic text appears after your cursor
4. **Switch Tones**: Use arrow keys to cycle through different tones
5. **Accept/Dismiss**: Use Tab to accept or Escape to dismiss suggestions
6. **Export**: Copy your final text using the Copy button

### Tone Types

- **Professional**: Formal, business-appropriate language
- **Casual**: Friendly, conversational tone
- **Creative**: Engaging, imaginative, and expressive
- **Concise**: Direct, brief, and to-the-point

## API Endpoints

### POST /api/autocomplete

Generate autocomplete suggestions based on input text and tone.

**Request:**
```json
{
  "text": "The project was successful because",
  "tone": "professional"
}
```

**Response:**
```json
{
  "suggestion": "it met all deliverables on time and within budget",
  "tone": "professional",
  "status": "success"
}
```

### GET /api/health

Health check endpoint for monitoring backend status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1634567890.123
}
```

## Configuration

### Backend Configuration

Create a `.env` file in the `backend/` directory:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
FLASK_ENV=development
FLASK_DEBUG=True
HOST=0.0.0.0
PORT=5000
```

### Frontend Configuration

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NODE_ENV=development
```

## Development

### Frontend Development

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
```

### Backend Development

```bash
cd backend

# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install development dependencies
pip install -r requirements.txt

# Run with auto-reload
python app.py
```

## Architecture

### Frontend (Next.js)

- **Framework**: Next.js 13 with App Router
- **Editor**: Lexical rich text editor
- **Styling**: Tailwind CSS with dark/light mode
- **State Management**: React hooks and context
- **HTTP Client**: Fetch API with error handling

### Backend (Flask)

- **Framework**: Flask with CORS support
- **AI Service**: OpenAI GPT-3.5-turbo API
- **Caching**: In-memory request deduplication
- **Error Handling**: Comprehensive error responses
- **Rate Limiting**: Built-in request caching (60s TTL)

## Performance Optimizations

- **Debounced API Calls**: 500ms delay prevents excessive requests
- **Request Caching**: Duplicate requests cached for 60 seconds
- **Efficient Text Processing**: Lexical editor optimized for large documents
- **Lazy Loading**: Components loaded on-demand
- **Image Optimization**: Next.js automatic image optimization

## Troubleshooting

### Common Issues

1. **OpenAI API Key Error**
   - Ensure your API key is valid and has sufficient credits
   - Check the `.env` file in the backend directory

2. **CORS Errors**
   - Verify backend is running on port 5000
   - Check CORS configuration in `app.py`

3. **Autocomplete Not Working**
   - Ensure backend is running and accessible
   - Check browser console for API errors
   - Verify API_URL in frontend environment

4. **Lexical Editor Issues**
   - Clear browser cache and refresh
   - Check for console errors related to Lexical

### Debug Mode

Enable debug logging:

```bash
# Backend
export FLASK_DEBUG=True
python app.py

# Frontend  
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [OpenAI](https://openai.com/) for GPT-3.5-turbo API
- [Facebook](https://lexical.dev/) for the Lexical editor
- [Vercel](https://nextjs.org/) for Next.js framework
- [Tailwind CSS](https://tailwindcss.com/) for styling

## Support

For support, email support@tabwriter.com or join our [Discord community](https://discord.gg/tabwriter).

---

Built with ❤️ by the Tab Writer team
