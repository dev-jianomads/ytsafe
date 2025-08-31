# StreamSafe Kids - ESRB Age Ratings for YouTube Channels

🛡️ ESRB age ratings for any YouTube channel—clear, fast, parent-friendly. Help parents make informed decisions about family-friendly viewing.

**Live Demo**: [Visit StreamSafe Kids](https://streamsafekids.com)

## Features

- **ESRB-Style Ratings**: Get age-appropriate ratings (E, E10+, T, 16+) for YouTube content
- **Content Analysis**: Analyzes violence, language, sexual content, substances, sensitive topics, and commercial pressure
- **Recent Video Analysis**: Reviews the latest videos from channels for current content assessment
- **Search History**: Keep track of previously analyzed channels
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## Quick Start

Simply type any YouTube channel name, paste a URL, or use an @handle to get an instant ESRB-style safety rating!

## How It Works

1. Enter a YouTube channel name, URL, video URL, or @handle
2. The system analyzes recent videos using AI-powered content classification
3. Receive an ESRB-style rating with detailed breakdown
4. Make informed decisions about content suitability for your family

## Technology Stack

- **Frontend**: Next.js 13 with React and TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **AI Analysis**: OpenAI GPT-4 for content classification
- **YouTube Integration**: YouTube Data API v3
- **Deployment**: Vercel

## Getting Started

### Prerequisites

This application requires API keys for:
- YouTube Data API v3
- OpenAI API

Set these as environment variables:
- `YOUTUBE_API_KEY`
- `OPENAI_API_KEY`

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.