# BlogPal

AI-powered writing refinement for bloggers. Keeps your tone, fixes everything else.

## Features

- **Select any text** on any website
- **Click "Refine"** to improve grammar, spelling, and clarity
- **Preserves your voice** - keeps your unique tone and style
- **Copy to clipboard** with one click
- **Your API key stays local** - never sent anywhere except directly to OpenAI

## Installation

### 1. Generate Icons

Open `generate-icons.html` in your browser and click "Download All Icons". Move the downloaded PNG files to the `icons/` folder.

### 2. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `blog-pal` folder

### 3. Add Your API Key

1. Click the BlogPal extension icon in Chrome toolbar
2. Enter your OpenAI API key
3. Click "Save Key"

## Usage

1. Go to any website (Medium, your blog, Google Docs, etc.)
2. Select some text you want to refine
3. Click the purple "Refine" button that appears
4. Wait for the AI to process
5. Click "Copy to Clipboard" to copy the refined text

## Security

- Your API key is stored **locally only** using Chrome's secure storage
- API calls go **directly** from your browser to OpenAI - no middleman server
- The extension is **open source** - you can verify the code yourself
- You can **remove your key** at any time from the settings

## Getting an OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it into BlogPal settings

## Tech Stack

- Chrome Extension (Manifest V3)
- OpenAI GPT-4o-mini API
- Vanilla JavaScript (no dependencies)

## License

MIT
