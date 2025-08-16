# YTSafe - YouTube Kid-Safety Rater

An ESRB-style content analysis tool for YouTube channels and videos to help parents make informed decisions about family-friendly viewing.

## Features

- **ESRB-Style Ratings**: Get age-appropriate ratings (E, E10+, T, 16+) for YouTube content
- **Content Analysis**: Analyzes violence, language, sexual content, substances, sensitive topics, and commercial pressure
- **Recent Video Analysis**: Reviews the latest videos from channels for current content assessment
- **Search History**: Keep track of previously analyzed channels
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## How It Works

1. Enter a YouTube channel URL, video URL, or @handle
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

This application requires API keys for:
- YouTube Data API v3
- OpenAI API

Set these as environment variables:
- `YOUTUBE_API_KEY`
- `OPENAI_API_KEY`

## Live Demo

Visit the deployed application to try it out with your favorite YouTube channels!