FROM nvidia/cuda:12.6.3-cudnn-runtime-ubuntu24.04 as base

# Install Python and system dependencies (Ubuntu 24.04 ships with Python 3.12)
RUN apt-get update && apt-get install -y \
    python3.12 \
    python3.12-dev \
    python3-pip \
    ffmpeg \
    libsndfile1 \
    build-essential \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3.12 /usr/bin/python \
    && ln -sf /usr/bin/python3.12 /usr/bin/python3

# Install deno (required by yt-dlp for YouTube JS extraction)
RUN curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh

# Set working directory
WORKDIR /app

# Install torch+CUDA FIRST (before any COPY) so it's never invalidated by file changes
RUN pip install --no-cache-dir --break-system-packages "torch>=2.1.0,<2.5.0" "torchaudio>=2.1.0,<2.5.0" --index-url https://download.pytorch.org/whl/cu121

# Now copy requirements and install remaining deps
COPY requirements.txt .
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads outputs

# Set environment variables
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

# Railway sets PORT dynamically, expose it
EXPOSE ${PORT:-5000}

# Run the application with gunicorn (gevent for concurrent requests + SSE support)
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000", "--worker-class", "gevent", "--workers", "2", "--worker-connections", "200", "--timeout", "300", "--access-logfile", "-", "--error-logfile", "-"]
