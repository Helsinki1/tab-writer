# Tab Writer - AI-Powered Writing Tool

A sophisticated writing tool with intelligent tone-switching autocomplete functionality. Built with Next.js, Lexical editor, and TypeScript API routes powered by OpenAI GPT-3.5-turbo.

![Tab Writer Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Tab+Writer+Demo)

## Features

- 🤖 **AI-Powered Autocomplete**: Intelligent text suggestions using OpenAI GPT-3.5-turbo
- 🎭 **Dual-Mode Control**: Switch between 8 tones (Professional, Casual, Creative, Concise, Witty, Instructional, Urgent, Reflective) and 5 purposes (Persuasive, Informative, Descriptive, Flattering, Narrative)
- ⌨️ **Keyboard Shortcuts**: Intuitive controls for accepting suggestions and switching tones
- 🌙 **Dark/Light Mode**: Beautiful themes for comfortable writing in any environment
- 📝 **Rich Text Editor**: Built with Facebook's Lexical editor for optimal performance
- 📊 **Real-time Analytics**: Word count and character count tracking
- 🚀 **Debounced API Calls**: Efficient request handling with 500ms debouncing
- 📋 **Export Functionality**: Copy your text to clipboard with one click
- ⚡ **Low Latency**: Pure TypeScript architecture eliminates separate backend server

## Project Structure

```
tab-writer/
├── frontend/              # Next.js application (includes backend API)
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/       # TypeScript API routes
│   │   │   │   └── autocomplete/
│   │   │   │       └── route.ts
│   │   │   └── page.tsx
│   │   └── components/    # React components
│   ├── package.json
│   ├── .env.local         # Environment variables
│   └── tailwind.config.js
├── setup.sh               # Automated setup script
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key

### Option 1: Automated Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd tab-writer

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
| Switch between tone/purpose modes | `Ctrl+←/→` / `Cmd+←/→` |
| Switch tone/purpose up | `Ctrl+↑` / `Cmd+↑` |
| Switch tone/purpose down | `Ctrl+↓` / `Cmd+↓` |

### Writing Flow

1. **Start Writing**: Begin typing in the editor
2. **Wait for Suggestions**: After 500ms of pause, AI generates suggestions
3. **Review Suggestion**: Gray italic text appears after your cursor
4. **Switch Modes**: Use `Ctrl+←/→` to switch between tone and purpose modes
5. **Adjust Settings**: Use `Ctrl+↑/↓` to cycle through tones or purposes (depending on mode)
6. **Accept/Dismiss**: Use `Ctrl+Enter` to accept or `Escape` to dismiss suggestions
7. **Export**: Copy your final text using the Copy button

### Tone Types

- **Professional**: Formal, business-appropriate language
- **Casual**: Friendly, conversational tone
- **Creative**: Engaging, imaginative, and expressive
- **Concise**: Direct, brief, and to-the-point
- **Witty**: Humorous, clever, and entertaining
- **Instructional**: Clear, educational, and explanatory
- **Urgent**: Time-sensitive, immediate, and critical
- **Reflective**: Thoughtful, contemplative, and introspective

### Purpose Types

- **Persuasive**: Convincing and compelling arguments
- **Informative**: Educational, factual, and useful content
- **Descriptive**: Vivid, detailed, and sensory-rich descriptions
- **Flattering**: Complimentary, appreciative, and admiring language
- **Narrative**: Storytelling with engaging narrative techniques

## API Endpoints

### POST /api/autocomplete

Generate autocomplete suggestions based on input text and tone.

**Request:**
```json
{
  "text": "The project was successful because",
  "tone": "professional",
  "purpose": "informative"
}
```

**Response:**
```json
{
  "suggestion": "it met all deliverables on time and within budget",
  "tone": "professional",
  "purpose": "informative",
  "status": "success"
}
```

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

## Architecture

### Modern TypeScript Architecture

- **Framework**: Next.js 13 with App Router
- **Backend**: TypeScript API routes (no separate server needed)
- **Editor**: Lexical rich text editor
- **Styling**: Tailwind CSS with dark/light mode
- **State Management**: React hooks and context
- **AI Service**: Direct OpenAI API integration
- **Deployment**: Single application deployment

### Key Benefits

- **🚀 Reduced Latency**: No network calls between frontend and backend
- **📦 Simplified Deployment**: Single Next.js application to deploy
- **💪 Type Safety**: Full TypeScript coverage across frontend and backend
- **⚡ Better Performance**: Eliminates Flask server overhead
- **🔧 Easier Maintenance**: One codebase, one deployment, one technology stack

## Performance Optimizations

- **Debounced API Calls**: 500ms delay prevents excessive requests
- **Request Caching**: Duplicate requests cached for 60 seconds
- **Efficient Text Processing**: Lexical editor optimized for large documents
- **TypeScript API Routes**: Fast, native Next.js API handling
- **Image Optimization**: Next.js automatic image optimization

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel

# Set environment variables in Vercel dashboard
# OPENAI_API_KEY=your_openai_api_key_here
```

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify**: Build command `npm run build`, publish directory `out`
- **Railway**: Connect repository and set `OPENAI_API_KEY` environment variable
- **AWS Amplify**: Connect repository and configure build settings
- **Digital Ocean**: Use App Platform with Node.js runtime

## Troubleshooting

### Common Issues

1. **OpenAI API Key Error**
   - Ensure your API key is valid and has sufficient credits
   - Check the `.env.local` file in the frontend directory
   - Restart the development server after changing environment variables

2. **Autocomplete Not Working**
   - Check browser console for API errors
   - Verify OpenAI API key is set correctly
   - Ensure you have text longer than 5 characters

3. **Lexical Editor Issues**
   - Clear browser cache and refresh
   - Check for console errors related to Lexical

### Debug Mode

Enable debug logging:

```bash
cd frontend
npm run dev
```

Open browser developer tools to see detailed logs.

## Migration from Flask

If you're upgrading from the Flask version:

1. **✅ No Data Loss**: All functionality preserved
2. **✅ Same API Contract**: Frontend code remains unchanged
3. **✅ Better Performance**: Reduced latency and complexity
4. **✅ Easier Deployment**: Single application instead of two
5. **✅ Type Safety**: Full TypeScript coverage

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

Built with ❤️ using TypeScript and Next.js
