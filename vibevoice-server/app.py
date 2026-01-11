"""
VibeVoice FastAPI Server - 4-bit Quantized for 8GB VRAM (RTX 3070)
OpenAI-compatible TTS API supporting both:
  - VibeVoice 7B 4-bit (DevParker/VibeVoice7b-low-vram) - Higher quality
  - VibeVoice Realtime 0.5B (microsoft/VibeVoice-Realtime-0.5B) - Faster streaming
"""

import os
import io
import time
import copy
import json
import logging
from threading import Lock
from typing import Optional, Literal
from pathlib import Path

import torch
import numpy as np
import soundfile as sf
from fastapi import FastAPI, HTTPException, Response, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment config
MODEL_PATH = os.getenv("MODEL_PATH", "DevParker/VibeVoice7b-low-vram")
MODEL_SUBFOLDER = os.getenv("MODEL_SUBFOLDER", "4bit")  # Subfolder for 7B 4-bit model
MODEL_DEVICE = os.getenv("MODEL_DEVICE", "cuda")
INFERENCE_STEPS = int(os.getenv("INFERENCE_STEPS", "32"))
CFG_SCALE = float(os.getenv("CFG_SCALE", "2.0"))

# Voice directories
# 7B model uses WAV files, streaming model uses .pt precomputed tensors
VOICES_DIR_7B = Path(os.getenv("VIBEVOICE_VOICES_DIR_7B", "/opt/vibevoice/demo/voices"))
VOICES_DIR_STREAMING = Path(os.getenv("VIBEVOICE_VOICES_DIR", "/opt/vibevoice/demo/voices/streaming_model"))
CUSTOM_VOICES_DIR = Path("/app/voices")  # User-provided voice samples
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "/app/output"))

# Auto-detect model type from path
IS_7B_MODEL = "7b" in MODEL_PATH.lower() or "1.5b" in MODEL_PATH.lower()

# Cached voice prompts (for streaming model)
voice_cache = {}
voice_cache_lock = Lock()

# Select voice directory based on model type
VOICES_DIR = VOICES_DIR_7B if IS_7B_MODEL else VOICES_DIR_STREAMING

# Ensure directories exist
VOICES_DIR_7B.mkdir(parents=True, exist_ok=True)
VOICES_DIR_STREAMING.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="VibeVoice TTS API",
    description="OpenAI-compatible TTS API using VibeVoice 7B 4-bit quantized model",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model reference
model = None
processor = None

# Default voice samples bundled with VibeVoice
# Maps voice name -> sample filename (without extension)
# Users can add custom voices by placing WAV files in the voices directory
DEFAULT_VOICES = {
    "alloy": "en-Carter_man",
    "echo": "en-Frank_man",
    "fable": "en-Maya_woman",
    "onyx": "en-Frank_man",  # Reuses Frank (limited bundled samples)
    "nova": "en-Alice_woman",
    "shimmer": "en-Mary_woman",
}


def get_voice_preset(voice_name: str) -> Optional[dict]:
    """Load a voice preset from .pt file (thread-safe)"""
    global voice_cache, voice_cache_lock

    # Map OpenAI voice names to VibeVoice presets
    voice_key = DEFAULT_VOICES.get(voice_name.lower(), voice_name.lower())

    # Double-checked locking pattern
    with voice_cache_lock:
        if voice_key in voice_cache:
            return voice_cache[voice_key]

        # Still missing - load it while holding the lock
        # (File I/O is slower, but prevents duplicate loads)
        voice_files = list(VOICES_DIR.glob(f"**/{voice_key}*.pt")) + \
                      list(VOICES_DIR.glob(f"**/*{voice_key}*.pt"))

        if not voice_files:
            voice_files = list(VOICES_DIR.glob("**/*.pt"))
            if voice_files:
                logger.warning(f"Voice '{voice_key}' not found, using default: {voice_files[0].name}")
            else:
                logger.error(f"No voice presets found in {VOICES_DIR}")
                return None

        voice_path = voice_files[0]
        logger.info(f"Loading voice preset from {voice_path}")

        try:
            device = MODEL_DEVICE if MODEL_DEVICE != "cuda" else "cuda"
            preset = torch.load(voice_path, map_location=device, weights_only=False)
            voice_cache[voice_key] = preset
            return preset
        except Exception as e:
            logger.error(f"Failed to load voice preset: {e}")
            return None


class SpeechRequest(BaseModel):
    """OpenAI-compatible speech request"""
    model: str = Field(default="tts-1", description="Model to use (ignored, uses VibeVoice)")
    input: str = Field(..., description="Text to synthesize")
    voice: str = Field(default="alloy", description="Voice to use")
    response_format: Literal["mp3", "wav", "flac", "opus", "aac", "pcm"] = Field(
        default="wav", description="Audio format"
    )
    speed: float = Field(default=1.0, ge=0.25, le=4.0, description="Speed multiplier")


class VoiceInfo(BaseModel):
    voice_id: str
    name: str
    preview_url: Optional[str] = None


class VoicesResponse(BaseModel):
    voices: list[VoiceInfo]


def load_model():
    """Load the VibeVoice model - auto-detects 7B vs streaming model"""
    global model, processor, IS_7B_MODEL

    if model is not None:
        return

    logger.info(f"Loading VibeVoice model from {MODEL_PATH}...")
    logger.info(f"Model type: {'7B/1.5B (standard)' if IS_7B_MODEL else 'Realtime 0.5B (streaming)'}")
    start_time = time.time()

    try:
        if IS_7B_MODEL:
            # Use standard VibeVoice modules for 7B/1.5B models
            from vibevoice.modular.modeling_vibevoice_inference import VibeVoiceForConditionalGenerationInference
            from vibevoice.processor.vibevoice_processor import VibeVoiceProcessor
            from transformers import BitsAndBytesConfig

            # Configure 4-bit quantization
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type='nf4'
            )

            # Use subfolder for DevParker repo structure
            subfolder = MODEL_SUBFOLDER if MODEL_SUBFOLDER and MODEL_SUBFOLDER.strip() else None

            # WARNING: trust_remote_code=True allows arbitrary code execution from HuggingFace repos.
            # This is required for VibeVoice custom modeling code, but poses a security risk if the
            # model repository is compromised. In production, consider pinning to specific commit hashes.
            model = VibeVoiceForConditionalGenerationInference.from_pretrained(
                MODEL_PATH,
                subfolder=subfolder,
                quantization_config=bnb_config,
                device_map=MODEL_DEVICE,
                torch_dtype=torch.bfloat16,
                trust_remote_code=True,  # Required for VibeVoice custom code
            )
            # Processor needs special handling - use microsoft/VibeVoice-1.5B processor
            # since the DevParker 4-bit repo doesn't have full tokenizer files
            processor = VibeVoiceProcessor.from_pretrained(
                "microsoft/VibeVoice-1.5B",
                trust_remote_code=True,  # Required for VibeVoice custom code
            )
        else:
            # Use VibeVoice Streaming modules (Realtime 0.5B)
            from vibevoice import VibeVoiceStreamingForConditionalGenerationInference, VibeVoiceStreamingProcessor

            # WARNING: trust_remote_code=True allows arbitrary code execution (see comment above)
            model = VibeVoiceStreamingForConditionalGenerationInference.from_pretrained(
                MODEL_PATH,
                device_map=MODEL_DEVICE,
                torch_dtype=torch.bfloat16,
                trust_remote_code=True,  # Required for VibeVoice custom code
            )
            processor = VibeVoiceStreamingProcessor.from_pretrained(
                MODEL_PATH,
                trust_remote_code=True,  # Required for VibeVoice custom code
            )

        elapsed = time.time() - start_time
        logger.info(f"Model loaded in {elapsed:.2f}s")

        # Log VRAM usage
        if torch.cuda.is_available():
            allocated = torch.cuda.memory_allocated() / 1e9
            reserved = torch.cuda.memory_reserved() / 1e9
            logger.info(f"VRAM: {allocated:.2f}GB allocated, {reserved:.2f}GB reserved")

    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise


def get_voice_sample_path(voice_name: str) -> Optional[Path]:
    """Find a voice sample file (MP3 or WAV) for the 7B model"""
    # Get the mapped voice name (preserving case for file matching)
    voice_key = DEFAULT_VOICES.get(voice_name.lower(), voice_name)

    # Check custom voices first (user-provided), then bundled voices
    # Prefer MP3 (smaller), fall back to WAV
    voice_files = []
    for search_dir in [CUSTOM_VOICES_DIR, VOICES_DIR]:
        if not search_dir.exists():
            continue
        voice_files.extend([
            *search_dir.glob(f"**/*{voice_key}*.mp3"),
            *search_dir.glob(f"**/{voice_key}*.mp3"),
            *search_dir.glob(f"**/*{voice_key}*.wav"),
            *search_dir.glob(f"**/{voice_key}*.wav"),
        ])
        if voice_files:
            break

    if not voice_files:
        # Try to find any voice file as default (prefer custom, then bundled)
        for search_dir in [CUSTOM_VOICES_DIR, VOICES_DIR]:
            if not search_dir.exists():
                continue
            voice_files = list(search_dir.glob("**/*.mp3")) + list(search_dir.glob("**/*.wav"))
            if voice_files:
                logger.warning(f"Voice '{voice_key}' not found, using default: {voice_files[0].name}")
                break
        if not voice_files:
            logger.error(f"No voice samples found in {CUSTOM_VOICES_DIR} or {VOICES_DIR}")
            return None

    return voice_files[0]


def generate_speech_7b(text: str, voice: Optional[str] = None) -> np.ndarray:
    """Generate speech using 7B/1.5B model (standard VibeVoice)"""
    global model, processor

    # Get voice sample file (MP3 or WAV)
    voice_name = voice or "alloy"
    voice_path = get_voice_sample_path(voice_name)

    if voice_path is None:
        raise HTTPException(status_code=400, detail=f"Voice sample not found for '{voice_name}'")

    logger.info(f"Using voice sample: {voice_path}")

    # VibeVoice 7B processor expects script format: "Speaker 0: text"
    # Wrap plain text in the expected format
    script_text = f"Speaker 0: {text}"

    # Prepare inputs using the standard processor
    # 7B model uses WAV voice samples, not cached prompts
    inputs = processor(
        text=[script_text],
        voice_samples=[[str(voice_path)]],
        padding=True,
        return_tensors="pt",
        return_attention_mask=True,
    )

    # Move to device
    device = next(model.parameters()).device
    for k, v in inputs.items():
        if torch.is_tensor(v):
            inputs[k] = v.to(device)

    # Generate with 7B model parameters
    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=None,
            cfg_scale=CFG_SCALE,
            tokenizer=processor.tokenizer,
            generation_config={'do_sample': False},
        )

    return extract_audio(output)


def generate_speech_streaming(text: str, voice: Optional[str] = None) -> np.ndarray:
    """Generate speech using Realtime 0.5B model (streaming)"""
    global model, processor

    # Get voice preset
    voice_name = voice or "alloy"
    cached_prompt = get_voice_preset(voice_name)

    if cached_prompt is None:
        raise HTTPException(status_code=400, detail=f"Voice preset not found for '{voice_name}'")

    # Make a deep copy to avoid modifying the cached version
    cached_prompt_copy = copy.deepcopy(cached_prompt)

    # Prepare inputs using the streaming processor
    inputs = processor.process_input_with_cached_prompt(
        text=text,
        cached_prompt=cached_prompt_copy,
        padding=True,
        return_tensors="pt",
        return_attention_mask=True,
    )

    # Move to device
    device = next(model.parameters()).device
    for k, v in inputs.items():
        if torch.is_tensor(v):
            inputs[k] = v.to(device)

    # Generate with streaming model parameters
    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=None,
            cfg_scale=1.3,
            tokenizer=processor.tokenizer,
            generation_config={'do_sample': False},
            all_prefilled_outputs=cached_prompt_copy,
        )

    return extract_audio(output)


def extract_audio(output) -> np.ndarray:
    """Extract audio tensor from model output"""
    # Try various output formats
    if hasattr(output, 'speech_outputs') and output.speech_outputs:
        audio_tensor = output.speech_outputs[0]
    elif hasattr(output, 'speech'):
        audio_tensor = output.speech
    elif hasattr(output, 'audio'):
        audio_tensor = output.audio
    else:
        raise ValueError("No audio output in model response")

    # Convert bfloat16 to float32 before numpy
    if audio_tensor.dtype == torch.bfloat16:
        audio_tensor = audio_tensor.float()

    audio = audio_tensor.cpu().numpy().squeeze()

    # Ensure audio is 1D
    if audio.ndim > 1:
        audio = audio.flatten()

    return audio


def generate_speech(text: str, voice: Optional[str] = None, speed: float = 1.0) -> np.ndarray:
    """Generate speech from text - dispatches to correct model type"""
    global model, processor

    if model is None:
        load_model()

    logger.info(f"Generating speech for {len(text)} chars, voice={voice}, speed={speed}")
    start_time = time.time()

    try:
        # Dispatch to correct generation function
        if IS_7B_MODEL:
            audio = generate_speech_7b(text, voice)
        else:
            audio = generate_speech_streaming(text, voice)

        # Apply speed adjustment if needed
        if speed != 1.0:
            import librosa
            audio = librosa.effects.time_stretch(audio, rate=speed)

        elapsed = time.time() - start_time
        duration = len(audio) / 24000  # 24kHz sample rate
        rtf = elapsed / duration if duration > 0 else 0
        logger.info(f"Generated {duration:.2f}s audio in {elapsed:.2f}s (RTF: {rtf:.2f}x)")

        return audio

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generation failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


def audio_to_bytes(audio: np.ndarray, format: str, sample_rate: int = 24000) -> bytes:
    """Convert numpy audio to bytes in specified format"""
    buffer = io.BytesIO()
    
    # Ensure audio is in correct range
    if audio.dtype == np.float32 or audio.dtype == np.float64:
        audio = np.clip(audio, -1.0, 1.0)
    
    if format == "wav":
        sf.write(buffer, audio, sample_rate, format="WAV")
    elif format == "flac":
        sf.write(buffer, audio, sample_rate, format="FLAC")
    elif format in ["mp3", "opus", "aac"]:
        # For compressed formats, write as WAV first then convert
        # This requires ffmpeg - for now just return WAV
        sf.write(buffer, audio, sample_rate, format="WAV")
        logger.warning(f"Format {format} not fully supported, returning WAV")
    elif format == "pcm":
        # Raw PCM 16-bit
        audio_int16 = (audio * 32767).astype(np.int16)
        buffer.write(audio_int16.tobytes())
    else:
        sf.write(buffer, audio, sample_rate, format="WAV")
    
    buffer.seek(0)
    return buffer.read()


@app.on_event("startup")
async def startup_event():
    """Pre-load model on startup"""
    logger.info("Starting VibeVoice TTS server...")
    try:
        load_model()
    except Exception as e:
        logger.error(f"Failed to load model on startup: {e}")
        # Don't crash - allow lazy loading


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    gpu_available = torch.cuda.is_available()
    model_loaded = model is not None
    
    status = {
        "status": "healthy" if model_loaded else "initializing",
        "model": MODEL_PATH,
        "model_loaded": model_loaded,
        "gpu_available": gpu_available,
    }
    
    if gpu_available:
        status["gpu_name"] = torch.cuda.get_device_name(0)
        status["vram_allocated_gb"] = round(torch.cuda.memory_allocated() / 1e9, 2)
        status["vram_reserved_gb"] = round(torch.cuda.memory_reserved() / 1e9, 2)
    
    return status


@app.get("/v1/models")
async def list_models():
    """OpenAI-compatible models endpoint"""
    return {
        "object": "list",
        "data": [
            {
                "id": "tts-1",
                "object": "model",
                "created": 1699000000,
                "owned_by": "vibevoice",
            },
            {
                "id": "tts-1-hd",
                "object": "model",
                "created": 1699000000,
                "owned_by": "vibevoice",
            },
        ]
    }


@app.get("/v1/voices")
@app.get("/v1/audio/voices")
async def list_voices():
    """List available voices"""
    voices = []

    # Add default bundled voices
    for voice_id in DEFAULT_VOICES.keys():
        voices.append(VoiceInfo(voice_id=voice_id, name=voice_id.capitalize()))

    # Add custom voices from CUSTOM_VOICES_DIR and VOICES_DIR
    seen_voices = set(DEFAULT_VOICES.keys())
    for search_dir in [CUSTOM_VOICES_DIR, VOICES_DIR]:
        if not search_dir.exists():
            continue
        for voice_file in search_dir.glob("*.wav"):
            voice_id = voice_file.stem
            if voice_id not in seen_voices:
                voices.append(VoiceInfo(voice_id=voice_id, name=voice_id))
                seen_voices.add(voice_id)

        for voice_file in search_dir.glob("*.mp3"):
            voice_id = voice_file.stem
            if voice_id not in seen_voices:
                voices.append(VoiceInfo(voice_id=voice_id, name=voice_id))
                seen_voices.add(voice_id)

    return VoicesResponse(voices=voices)


@app.post("/v1/audio/speech")
async def create_speech(request: SpeechRequest):
    """OpenAI-compatible speech synthesis endpoint"""
    
    if not request.input or not request.input.strip():
        raise HTTPException(status_code=400, detail="Input text is required")
    
    if len(request.input) > 10000:
        raise HTTPException(status_code=400, detail="Input text too long (max 10000 chars)")
    
    # Map default voice name to sample filename, or use voice name directly for custom voices
    voice = DEFAULT_VOICES.get(request.voice, request.voice)
    
    # Generate audio
    audio = generate_speech(request.input, voice, request.speed)
    
    # Convert to requested format
    audio_bytes = audio_to_bytes(audio, request.response_format)
    
    # Determine content type
    content_types = {
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "flac": "audio/flac",
        "opus": "audio/opus",
        "aac": "audio/aac",
        "pcm": "audio/pcm",
    }
    content_type = content_types.get(request.response_format, "audio/wav")
    
    return Response(
        content=audio_bytes,
        media_type=content_type,
        headers={
            "Content-Disposition": f"attachment; filename=speech.{request.response_format}"
        }
    )


@app.post("/v1/vibevoice/generate")
async def generate_advanced(
    text: str,
    voice: Optional[str] = None,
    speed: float = 1.0,
):
    """Advanced generation endpoint with more options"""
    audio = generate_speech(text, voice, speed)
    audio_bytes = audio_to_bytes(audio, "wav")

    return Response(
        content=audio_bytes,
        media_type="audio/wav",
    )


@app.get("/v1/voices/genders")
async def get_voice_genders():
    """Get voice gender mapping for all custom voices"""
    genders_path = CUSTOM_VOICES_DIR / "voice-genders.json"

    if not genders_path.exists():
        # Also check app directory
        genders_path = Path("/app/voice-genders.json")

    if not genders_path.exists():
        return {"female": [], "male": []}

    try:
        with open(genders_path, 'r') as f:
            data = json.load(f)
        return {
            "female": data.get("female", []),
            "male": data.get("male", [])
        }
    except Exception as e:
        logger.error(f"Failed to load voice-genders.json: {e}")
        return {"female": [], "male": []}


@app.post("/v1/voices/add")
async def add_voice(name: str, file: UploadFile = File(...)):
    """Upload a custom voice sample"""
    if not file.filename.endswith(('.wav', '.mp3', '.flac', '.m4a')):
        raise HTTPException(status_code=400, detail="Unsupported audio format")
    
    # Save voice file
    voice_path = VOICES_DIR / f"{name}.wav"
    
    content = await file.read()
    
    # Convert to WAV if needed
    try:
        audio_data, sr = sf.read(io.BytesIO(content))
        sf.write(voice_path, audio_data, sr, format="WAV")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process audio: {e}")
    
    return {"status": "success", "voice_id": name, "path": str(voice_path)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8880)
