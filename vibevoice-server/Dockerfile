FROM pytorch/pytorch:2.9.1-cuda12.6-cudnn9-runtime

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    ffmpeg \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install bitsandbytes for quantization
RUN pip install bitsandbytes>=0.43.0

# Clone VibeVoice community fork (has full 7B inference support)
# Microsoft removed original repo, community fork maintains compatibility
RUN git clone https://github.com/vibevoice-community/VibeVoice.git /opt/vibevoice && \
    cd /opt/vibevoice && pip install -e .

# Set up voices directories (7B uses .wav files, streaming uses .pt files)
ENV VIBEVOICE_VOICES_DIR=/opt/vibevoice/demo/voices/streaming_model
ENV VIBEVOICE_VOICES_DIR_7B=/opt/vibevoice/demo/voices

# Copy application code
COPY app.py .
RUN mkdir -p ./voices ./output

EXPOSE 8880

CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8880"]
