# InCharacter - Setup Guide

## Quick Start

This is an AI-powered interactive fiction game where players embody iconic literary characters.

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- A smartphone with Expo Go app (for testing)

### Installation

1. Clone the repository and install dependencies:
```bash
npm install --legacy-peer-deps
```

2. Start the development server:
```bash
npx expo start
```

3. Scan the QR code with Expo Go app on your phone

## AI Configuration (Optional)

The game works with mock data by default. To enable real AI story generation with Google Gemini:

1. Get a Gemini API key from https://makersuite.google.com/app/apikey
2. Create a `.env` file in the root directory:
```bash
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
# Alternative environment variable names also supported:
# gemini_2_5_flash_API_key=your_gemini_api_key_here
# GEMINI_API_KEY=your_gemini_api_key_here
```

## Game Features

✅ **Working Features:**
- Character selection (Sherlock Holmes, Dracula, Elizabeth Bennet)
- AI-powered story generation using Google Gemini (with fallback mock data)
- Dynamic persona scoring system
- Choice-based narrative branching
- Beautiful dark theme UI
- Save/load game state
- Ad placement system (mock implementation)

🚧 **To Be Implemented:**
- Real AdMob integration
- Firebase cloud saves
- More character packs
- Enhanced AI prompting
- User analytics

## Architecture

- **React Native + Expo** for cross-platform mobile development
- **AI Service** (`aiService.js`) - Handles Google Gemini API calls with fallbacks
- **Game Context** (`gameContext.js`) - State management and persistence
- **Component-based UI** - Modular, reusable interface components

## Character Personas

Each character has a detailed persona defining:
- Personality traits and motivations
- Speech patterns and worldview
- Canonical knowledge from source material
- Relationship dynamics

The AI uses these personas to generate authentic, in-character scenes and choices.

## Development Notes

- Uses Google Gemini 1.5 Flash for AI story generation
- Graceful fallback to mock responses when API key is not available
- Includes safety settings to ensure appropriate content
- Auto-saves game progress locally
- Optimized for mobile user experience

## Troubleshooting

**App won't start:**
- Try `npx expo install --fix` to resolve dependency issues
- Clear Metro cache: `npx expo start --clear`

**AI not working:**
- Check your Gemini API key in `.env` file
- Verify internet connection
- Check console for error messages
- Ensure you have proper API quotas in Google Cloud Console

**Styling issues:**
- Restart Metro bundler
- Check for syntax errors in StyleSheet definitions

## API Configuration Details

The service supports multiple environment variable formats for the Gemini API key:
- `EXPO_PUBLIC_GEMINI_API_KEY` (recommended for Expo)
- `gemini_2_5_flash_API_key` (alternative format)
- `GEMINI_API_KEY` (standard format)

The system will automatically detect and use whichever is available. 