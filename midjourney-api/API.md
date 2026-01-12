# Midjourney API Server Documentation

This is a REST API server for interacting with Midjourney via Discord bot proxy. It wraps the `midjourney-client` library to provide a simple HTTP interface for image generation.

## Requirements

- Discord account with an active Midjourney subscription
- Discord server with Midjourney bot present
- Discord authentication token (SALAI_TOKEN)

## Setup

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Required: Discord server and channel where Midjourney bot is present
MIDJOURNEY_SERVER_ID=your_discord_server_id
MIDJOURNEY_CHANNEL_ID=your_discord_channel_id

# Required: Your Discord authentication token
# Get from Discord DevTools: F12 > Application > Local Storage > token
# WARNING: This is a highly sensitive credential - never commit to git
MIDJOURNEY_SALAI_TOKEN=your_discord_token

# Optional: Enable debug logging
MIDJOURNEY_DEBUG=false

# Optional: HuggingFace token for human verification challenges
HUGGINGFACE_TOKEN=hf_xxxxxxxxxx
```

### Getting Discord Credentials

1. **SALAI_TOKEN** - Your Discord authentication token:
   - Open Discord in browser
   - Press F12 to open DevTools
   - Go to Application tab > Local Storage > https://discord.com
   - Find the `token` key and copy its value
   - **WARNING**: Treat this like a password - it grants full access to your Discord account

2. **SERVER_ID** - Discord server ID where Midjourney bot is present:
   - Right-click on the server icon
   - Click "Copy Server ID" (requires Developer Mode enabled in Discord settings)

3. **CHANNEL_ID** - Channel ID for Midjourney commands:
   - Right-click on a channel where Midjourney bot can receive commands
   - Click "Copy Channel ID"

### Running the Server

```bash
# Using Docker Compose (recommended)
docker compose up midjourney-api

# Using Docker directly
docker run -p 3000:3000 --env-file .env midjourney-api

# Using Node.js
cd midjourney-api
npm install
npm start
```

The server will start on port 3000.

## API Endpoints

### POST /generate

Full pipeline: Imagine → Wait → Upscale → Return image

Generates an image using Midjourney and returns the upscaled result.

**Request:**

```json
{
  "prompt": "A cyberpunk banana with neon lights",
  "options": {
    "aspectRatio": "16:9",
    "stylize": 750,
    "chaos": 25,
    "no": "people, text",
    "version": "7",
    "style": "raw",
    "seed": 12345,
    "quality": 1,
    "weird": 500,
    "tile": false
  },
  "upscaleIndex": 1,
  "download": false
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | Text description of the image to generate |
| `options` | object | No | Midjourney-specific generation options (see below) |
| `upscaleIndex` | number | No | Which image from 2x2 grid to upscale (1-4, default: 1) |
| `download` | boolean | No | Whether to download image to server (default: false) |

**Midjourney Options:**

| Option | Type | Range | Default | Description |
|--------|------|-------|---------|-------------|
| `aspectRatio` | string | - | "1:1" | Image aspect ratio (e.g., "16:9", "9:16", "1:1") |
| `stylize` | number | 0-1000 | 100 | Artistic influence (higher = more artistic) |
| `chaos` | number | 0-100 | 0 | Variation/randomness (higher = more varied) |
| `no` | string | - | - | Comma-separated elements to exclude (e.g., "people, text") |
| `version` | string | - | "7" | Midjourney version ("5", "6", "6.1", "7", "niji6", etc.) |
| `style` | string | - | - | Style preset ("raw" or "scenic") |
| `seed` | number | - | - | Deterministic seed for reproducible results |
| `quality` | number | 0.25-2 | 1 | Image quality (0.25, 0.5, 1, or 2) |
| `weird` | number | 0-3000 | 0 | Weirdness factor for experimental results |
| `tile` | boolean | - | false | Enable seamless tiling |

**Response:**

```json
{
  "id": "1234567890",
  "hash": "abc123def456",
  "uri": "https://cdn.midjourney.com/abc123def456/0_0.png",
  "width": 1920,
  "height": 1080,
  "flags": 0,
  "content": "base64..." // Only if download: true
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Midjourney message ID |
| `hash` | string | Midjourney image hash |
| `uri` | string | CDN URL for the generated image |
| `width` | number | Image width in pixels |
| `height` | number | Image height in pixels |
| `flags` | number | Discord message flags |
| `content` | string | Base64-encoded image (only if download: true) |

**Error Response:**

```json
{
  "error": "Error message here"
}
```

**Status Codes:**

- `200 OK` - Image generated successfully
- `400 Bad Request` - Invalid parameters
- `500 Internal Server Error` - Generation failed

### GET /health

Health check endpoint to verify server and Discord connection status.

**Response:**

```json
{
  "connected": true,
  "status": "Connected to Discord"
}
```

**Status Codes:**

- `200 OK` - Server is healthy and connected
- `503 Service Unavailable` - Server not ready or disconnected

### GET /options

Get documentation for available Midjourney options and parameters.

**Response:**

```json
{
  "aspectRatio": {
    "type": "string",
    "description": "Image aspect ratio (e.g., '16:9', '9:16', '1:1')",
    "examples": ["16:9", "9:16", "1:1", "2:3", "3:2"]
  },
  "stylize": {
    "type": "number",
    "range": [0, 1000],
    "default": 100,
    "description": "Artistic influence (higher = more artistic interpretation)"
  },
  "chaos": {
    "type": "number",
    "range": [0, 100],
    "default": 0,
    "description": "Variation/randomness (higher = more varied results)"
  },
  ...
}
```

**Status Codes:**

- `200 OK` - Options documentation returned

## Midjourney Versions

Available Midjourney model versions:

| Version | Name | Description |
|---------|------|-------------|
| `7` | Midjourney v7 | Latest version (default) |
| `6.1` | Midjourney v6.1 | Previous stable version |
| `6` | Midjourney v6 | Older stable version |
| `5.2` | Midjourney v5.2 | Legacy version |
| `niji6` | Niji 6 | Anime/illustration style |
| `niji5` | Niji 5 | Legacy anime style |

## Usage Examples

### Basic Generation

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cyberpunk banana with neon lights"
  }'
```

### With Options

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A glowing orb in a dark forest",
    "options": {
      "aspectRatio": "16:9",
      "stylize": 750,
      "chaos": 25,
      "no": "people, text",
      "version": "7",
      "style": "raw"
    },
    "upscaleIndex": 2
  }'
```

### Health Check

```bash
curl http://localhost:3000/health
```

### Get Options Documentation

```bash
curl http://localhost:3000/options
```

## Integration with Malice MOO

The Malice game engine uses this API server internally via the `$aiImageGen` MOO object. See CLAUDE.md for MOO integration examples.

## Rate Limiting

Midjourney has rate limits based on your subscription tier. To avoid rate limits when generating multiple images:

- Add random delays between requests (5 seconds to 3 minutes recommended)
- Use the `generate-room-images.ts` script which implements automatic rate limiting
- Monitor Discord for rate limit warnings

## Troubleshooting

### "Not connected to Discord"

- Verify your `MIDJOURNEY_SALAI_TOKEN` is correct and up-to-date
- Discord tokens can expire - get a fresh one from DevTools
- Check that the server and channel IDs are correct
- Ensure Midjourney bot is present in the specified channel

### "Generation timed out"

- Midjourney generation can take 1-5 minutes depending on complexity
- The API has a 5-minute timeout - simple prompts should complete faster
- Check Discord for any errors or warnings from Midjourney bot

### "Human verification required"

- Set `HUGGINGFACE_TOKEN` in your environment
- This helps the server pass Discord's human verification challenges

### Token Security

**CRITICAL**: Your `SALAI_TOKEN` grants full access to your Discord account.

- Never commit `.env` files to git
- Never share your token publicly
- Rotate your token immediately if compromised (change Discord password)
- Use environment variables, never hardcode tokens

## Architecture

The API server is a lightweight wrapper around the `midjourney-client` library:

1. Accepts REST requests
2. Translates to Discord bot commands
3. Monitors Discord for Midjourney responses
4. Returns image URLs and metadata

The server maintains a persistent WebSocket connection to Discord for real-time message monitoring.
