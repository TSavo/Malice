# VibeVoice TTS Server

Docker-based FastAPI server for VibeVoice TTS with OpenAI-compatible API.

Supports multiple models:
- **VibeVoice 7B 4-bit** (~6.6GB VRAM) - Higher quality, fits RTX 3070
- **VibeVoice 1.5B** (~7GB VRAM) - Good quality
- **VibeVoice Realtime 0.5B** (~2GB VRAM) - Fastest streaming

## Quick Start

```bash
# Clone and start
cd vibevoice-server
cp .env.example .env
docker compose up -d

# Check logs
docker compose logs -f

# Test
curl http://localhost:8880/health
```

## Generate Speech

### OpenAI-compatible endpoint

```bash
curl -X POST http://localhost:8880/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "Hello! This is VibeVoice speaking.",
    "voice": "alloy",
    "response_format": "wav"
  }' --output speech.wav
```

### Python client

```python
import requests

response = requests.post(
    "http://localhost:8880/v1/audio/speech",
    json={
        "model": "tts-1",
        "input": "Hello world!",
        "voice": "alloy",
    }
)

with open("output.wav", "wb") as f:
    f.write(response.content)
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with VRAM stats |
| `/v1/models` | GET | List available models |
| `/v1/voices` | GET | List available voices |
| `/v1/audio/speech` | POST | Generate speech (OpenAI-compatible) |
| `/v1/vibevoice/generate` | POST | Advanced generation options |
| `/v1/voices/add` | POST | Upload custom voice sample |

## Configuration

Edit `.env` or pass environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `GPU_DEVICE_ID` | 0 | GPU to use |
| `PORT` | 8880 | API port |
| `MODEL_PATH` | DevParker/VibeVoice7b-low-vram | HuggingFace model path |
| `MODEL_DEVICE` | cuda | Device (cuda/cpu) |
| `INFERENCE_STEPS` | 32 | Diffusion steps (5-50, higher = better) |
| `CFG_SCALE` | 2.0 | CFG scale for 7B model (1.0-3.0) |

## Model Options

| Model | MODEL_PATH | VRAM | Quality | Speed |
|-------|-----------|------|---------|-------|
| **7B 4-bit** | `DevParker/VibeVoice7b-low-vram` | ~6.6GB | Best | Slower |
| 1.5B | `microsoft/VibeVoice-1.5B` | ~7GB | Good | Medium |
| 0.5B Streaming | `microsoft/VibeVoice-Realtime-0.5B` | ~2GB | OK | Fastest |

The model type is auto-detected from the path. 7B/1.5B models use standard VibeVoice classes,
while 0.5B uses the streaming classes.

## Custom Voices

Drop `.wav` or `.mp3` files in the `voices/` directory and restart:

```bash
cp my_voice.wav voices/
docker compose restart
```

Or upload via API:

```bash
curl -X POST http://localhost:8880/v1/voices/add \
  -F "name=myvoice" \
  -F "file=@my_voice.wav"
```

## Troubleshooting

### Out of Memory
- Reduce `INFERENCE_STEPS` to 5
- Ensure no other GPU processes running
- Check with `nvidia-smi`

### Model Download Slow
First run downloads ~6GB model. Check progress in logs:
```bash
docker compose logs -f
```

### Build Errors
Ensure NVIDIA Container Toolkit is installed:
```bash
# Ubuntu/Debian
sudo apt install nvidia-container-toolkit
sudo systemctl restart docker
```

## License

MIT - Model weights subject to Microsoft VibeVoice license.
