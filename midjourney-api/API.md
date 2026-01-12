# MidJourney REST API

A Docker-ready REST API for MidJourney image generation with full parameter support and Swagger documentation.

## Quick Start

### Docker (Recommended)

1. Create a `.env` file with your Discord credentials:

```bash
SERVER_ID="your-discord-server-id"
CHANNEL_ID="your-discord-channel-id"
SALAI_TOKEN="your-discord-token"
HUGGINGFACE_TOKEN=""  # Optional, for human verification
```

2. Start the API:

```bash
docker compose up -d
```

3. Access the API:
   - **Swagger UI**: http://localhost:3000/docs
   - **Health Check**: http://localhost:3000/health
   - **OpenAPI Spec**: http://localhost:3000/openapi.json

### Local Development

```bash
npm install
npm run dev
```

## API Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "connected": true
}
```

### `GET /options`
Get all available prompt options with descriptions and valid values.

### `POST /imagine`
Generate an initial 4-image grid from a prompt.

**Request:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "options": {
    "aspectRatio": "16:9",
    "stylize": 150,
    "no": "text, watermark"
  }
}
```

### `POST /upscale`
Upscale a specific image from the grid (U1-U4).

**Request:**
```json
{
  "msgId": "message-id-from-imagine",
  "hash": "hash-from-imagine",
  "flags": 0,
  "content": "original-content",
  "index": 1
}
```

### `POST /custom`
Execute custom actions like Upscale (Subtle), Vary, Zoom, Pan, etc.

**Request:**
```json
{
  "msgId": "message-id",
  "customId": "MJ::JOB::upsample_v7_2x_subtle::1::hash::SOLO",
  "flags": 0,
  "content": "original-content"
}
```

### `POST /generate` (Full Pipeline)
Complete workflow: Imagine -> Upscale -> Upscale (Subtle) -> Download

**Request:**
```json
{
  "prompt": "A cyberpunk city at night",
  "options": {
    "aspectRatio": "16:9",
    "no": "text, watermark, blurry",
    "stylize": 200,
    "fast": true
  },
  "upscaleIndex": 1,
  "download": true
}
```

**Response:**
```json
{
  "id": "message-id",
  "hash": "image-hash",
  "content": "full-prompt-with-parameters",
  "uri": "https://cdn.discordapp.com/...",
  "localPath": "outputs/image-hash.png",
  "width": 2048,
  "height": 2048
}
```

## Prompt Options

All options are passed in the `options` object:

| Option | Type | Range | Description |
|--------|------|-------|-------------|
| `aspectRatio` | string | e.g., "16:9" | Image dimensions |
| `no` | string | text | Negative prompt - elements to exclude |
| `stylize` | integer | 0-1000 | Artistic influence (default: 100) |
| `chaos` | integer | 0-100 | Variation/randomness (default: 0) |
| `quality` | number | 0.25, 0.5, 1 | Detail level (default: 1) |
| `seed` | integer | 0-4294967295 | For reproducible results |
| `stop` | integer | 10-100 | Stop early (default: 100) |
| `version` | string | "5"-"7" | MidJourney version (default: "7") |
| `style` | string | "raw", "scenic" | Style mode |
| `weird` | integer | 0-3000 | Unusual qualities (default: 0) |
| `tile` | boolean | - | Seamless pattern |
| `repeat` | integer | 1-40 | Multiple variations |
| `niji` | string | "5", "6" | Anime model |
| `styleRef` | string | URL | Style reference image |
| `styleWeight` | integer | 0-1000 | Style ref influence (default: 100) |
| `characterRef` | string | URL | Character reference image |
| `characterWeight` | integer | 0-100 | Character ref influence (default: 100) |
| `imageWeight` | number | 0-3 | Image vs text weight (default: 1) |
| `fast` | boolean | - | Fast generation mode |
| `relax` | boolean | - | Relaxed generation mode |
| `turbo` | boolean | - | Turbo generation mode |

## Examples

### Simple Generation
```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A serene Japanese garden"}'
```

### With Options
```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic robot",
    "options": {
      "aspectRatio": "16:9",
      "stylize": 300,
      "no": "text, watermark",
      "chaos": 20,
      "fast": true
    }
  }'
```

### Anime Style (Niji)
```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A magical girl with flowing hair",
    "options": {
      "niji": "6",
      "aspectRatio": "2:3"
    }
  }'
```

### Seamless Tile Pattern
```bash
curl -X POST http://localhost:3000/imagine \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Geometric pattern, abstract shapes",
    "options": {
      "tile": true,
      "aspectRatio": "1:1"
    }
  }'
```

## Docker Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SERVER_ID` | Yes | Discord server ID |
| `CHANNEL_ID` | Yes | Discord channel ID |
| `SALAI_TOKEN` | Yes | Discord auth token |
| `HUGGINGFACE_TOKEN` | No | For human verification |
| `PORT` | No | API port (default: 3000) |
| `DEBUG` | No | Enable debug logs (default: false) |
| `OUTPUT_DIR` | No | Image output directory (default: /app/outputs) |

### Volumes

The `outputs` directory is mounted to persist generated images:

```yaml
volumes:
  - ./outputs:/app/outputs
```

### Custom docker-compose.yml

```yaml
services:
  midjourney-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - DEBUG=true
      - SERVER_ID=${SERVER_ID}
      - CHANNEL_ID=${CHANNEL_ID}
      - SALAI_TOKEN=${SALAI_TOKEN}
    volumes:
      - ./outputs:/app/outputs
    restart: unless-stopped
```

## Getting Discord Credentials

### Server ID & Channel ID
1. Enable Developer Mode in Discord (Settings > Advanced > Developer Mode)
2. Right-click on your server name > Copy Server ID
3. Right-click on the channel > Copy Channel ID

### Discord Token (SALAI_TOKEN)
1. Open Discord in a browser
2. Press F12 to open Developer Tools
3. Go to Network tab
4. Send any message or perform any action
5. Look for requests to `discord.com/api`
6. Find the `Authorization` header - that's your token

**Note:** Your Discord token is sensitive. Never share it publicly.

## Output Files

Generated images are saved to the `outputs` directory with their hash as the filename:

```
outputs/
  abc123-def456.png   # 2048x2048 upscaled image
  xyz789-uvw012.png   # Another image
```

Access via API: `http://localhost:3000/outputs/abc123-def456.png`

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

Common errors:
- `400` - Invalid request (missing prompt, invalid options)
- `500` - Generation failed (MidJourney error, connection issue)

## Rate Limiting

MidJourney has its own rate limits. The API doesn't add additional limiting, but you may encounter:
- Subscription limits (fast hours, relax mode queue)
- Concurrent job limits
- Content moderation blocks
