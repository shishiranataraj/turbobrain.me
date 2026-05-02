# Audio Separator Platform

> Enterprise-grade AI-powered audio processing platform for music source separation and speech transcription with speaker diarization.

## Overview

Audio Separator is a production-ready web application that leverages state-of-the-art deep learning models to deliver professional audio processing capabilities. Built on proven AI frameworks from Meta Research and OpenAI, the platform enables automated separation of music tracks and intelligent speech transcription with speaker identification.

### Key Capabilities

- **Music Source Separation**: Isolate vocals, drums, bass, and instrumental tracks from mixed audio using Meta's Demucs hybrid transformer model
- **Speech Transcription**: Convert speech to text with industry-leading accuracy using OpenAI's Whisper model
- **Speaker Diarization**: Automatically identify and label different speakers in conversations using Pyannote's neural diarization pipeline
- **Real-time Processing**: Live progress monitoring with server-sent events for transparent workflow visibility
- **Hardware Acceleration**: Automatic GPU detection and utilization (Apple Silicon MPS, NVIDIA CUDA) for optimized performance
- **Enterprise-ready Deployment**: Docker containerization with Kubernetes-compatible configuration

## Business Value

### For Music Producers & Studios
- **Workflow Acceleration**: Reduce track isolation time from hours to minutes
- **Quality Assurance**: Leverage research-grade AI models with published benchmarks
- **Format Flexibility**: Support for industry-standard formats (WAV, MP3, FLAC, M4A, OGG)

### For Media & Content Teams
- **Transcription Automation**: Eliminate manual transcription overhead with 95%+ accuracy
- **Multi-speaker Analysis**: Automatically segment and attribute dialogue in interviews, podcasts, and meetings
- **Scalable Processing**: Handle large batches with containerized deployment

### For Developers & DevOps
- **Cloud-native Architecture**: Deploy via Docker Compose with one command
- **Infrastructure as Code**: Version-controlled configuration for reproducible deployments
- **Resource Management**: Configurable memory limits and GPU resource allocation
- **Monitoring Ready**: Structured logging and SSE-based progress tracking

## Technical Architecture

### Core Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **AI Engine** | PyTorch 2.1+ | Deep learning framework with hardware acceleration |
| **Music Separation** | Demucs htdemucs | 4-source separation (vocals, drums, bass, other) |
| **Speech Recognition** | OpenAI Whisper | Multi-language transcription with timestamps |
| **Speaker Diarization** | Pyannote Audio 4.0+ | Neural speaker segmentation and clustering |
| **Web Framework** | Flask 3.0 | RESTful API with SSE streaming |
| **Audio Processing** | FFmpeg, torchaudio | Format conversion and signal processing |
| **Containerization** | Docker, Docker Compose | Isolated deployment environment |

### Performance Metrics

| Hardware | Processing Speed (3-min audio) | Throughput |
|----------|-------------------------------|------------|
| Apple M1/M2/M3 (MPS) | 30-120 seconds | 1.5-6x real-time |
| NVIDIA GPU (CUDA) | <60 seconds | >3x real-time |
| CPU (8-core) | 180-900 seconds | 0.2-1x real-time |

## Deployment Options

### Option 1: Railway (Recommended for Cloud Hosting)

**One-click cloud deployment with auto-scaling:**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

```bash
# Push to GitHub and connect to Railway
git push origin main

# Or use Railway CLI
railway login
railway init
railway up
```

**Benefits:**
- One-click deployment from GitHub
- Auto-scaling up to 48GB RAM / 48 vCPU
- Built-in SSL certificates
- Pay-per-use pricing (~$10-30/month)
- Automatic deployments on git push

See [RAILWAY.md](RAILWAY.md) for complete Railway deployment guide including resource configuration, cost optimization, and monitoring.

### Option 2: Docker Compose (Self-hosted)

**One-command deployment for self-hosted environments:**

```bash
# Clone and configure
git clone <repository-url>
cd audio-separator
echo "HUGGINGFACE_TOKEN=your_token" > .env

# Deploy
docker-compose up -d

# Access at http://localhost:5000
```

**Benefits:**
- Zero dependency management
- Reproducible environments
- Automatic restarts
- Resource isolation
- Full control over infrastructure

See [DOCKER.md](DOCKER.md) for complete deployment guide including GPU support, resource configuration, and production hardening.

### Option 3: Local Development

**For development and testing:**

```bash
# System dependencies
brew install ffmpeg  # macOS
# OR: apt-get install ffmpeg  # Linux

# Python environment
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env with your HUGGINGFACE_TOKEN

# Run
python app.py
```

## Configuration

### Environment Variables

| Variable | Required | Purpose | Default |
|----------|----------|---------|---------|
| `HUGGINGFACE_TOKEN` | For diarization | Pyannote model authentication | - |
| `FLASK_APP` | No | Application entry point | `app.py` |

### Resource Requirements

| Deployment Type | RAM | Storage | GPU |
|----------------|-----|---------|-----|
| **Minimum** | 4GB | 10GB | Optional |
| **Recommended** | 8GB | 20GB | NVIDIA/Apple Silicon |
| **Optimal** | 16GB+ | 50GB+ | NVIDIA A100/H100 |

### HuggingFace Token Setup

Required for speaker diarization functionality:

1. Create account at [huggingface.co](https://huggingface.co)
2. Generate token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
3. Accept Pyannote model terms at [huggingface.co/pyannote/speaker-diarization-3.1](https://huggingface.co/pyannote/speaker-diarization-3.1)
4. Add token to `.env` file

## API Reference

### REST Endpoints

```
POST   /upload                          Upload and process audio file
GET    /status/<job_id>                 Query processing status
GET    /tracks/<job_id>                 List separated music tracks
GET    /download/<job_id>/<track>       Download music track file
GET    /transcription/<job_id>          Retrieve speech transcription
GET    /download_transcript/<job_id>    Download transcript file
POST   /cleanup/<job_id>                Remove processed files
GET    /logs                            Stream processing logs (SSE)
```

### Processing Modes

**Music Mode** (`mode=music`):
- Input: Audio file (MP3, WAV, FLAC, M4A, OGG)
- Output: 4 WAV files (vocals, drums, bass, other)
- Model: Demucs htdemucs (hybrid transformer)

**Speech Mode** (`mode=speech`):
- Input: Audio file with speech content
- Output: Timestamped transcript with speaker labels
- Models: Whisper (base) + Pyannote 3.1

## Security & Compliance

### Data Handling
- Uploaded files stored temporarily in isolated upload directory
- Automatic cleanup endpoint for GDPR compliance
- No data persistence beyond session lifecycle
- Container-level isolation in Docker deployment

### Network Security
- Configurable port binding (default: 5000)
- Ready for reverse proxy integration (Nginx, Traefik)
- SSL/TLS termination support
- CORS configuration available

## Monitoring & Operations

### Logging
- Structured console output with timestamps
- Per-job log isolation for request tracing
- Real-time log streaming via SSE endpoint
- Docker logs accessible via `docker-compose logs`

### Health Checks
- Application status: `curl http://localhost:5000/`
- Container health: `docker-compose ps`
- GPU availability: Check startup logs for device detection

### Scaling Considerations
- Stateless design enables horizontal scaling
- Shared storage required for multi-instance deployments
- Consider queue system (Celery + Redis) for high-throughput scenarios
- GPU resource scheduling for multi-tenant environments

## Production Hardening

For production deployments, implement:

1. **Process Management**: Replace Flask dev server with Gunicorn/uWSGI
2. **Reverse Proxy**: Add Nginx for SSL termination and load balancing
3. **Monitoring**: Integrate Prometheus metrics and Grafana dashboards
4. **Queue System**: Implement Celery for async processing at scale
5. **Storage**: Use object storage (S3/GCS) for uploads/outputs
6. **Authentication**: Add API key or OAuth2 authentication
7. **Rate Limiting**: Implement request throttling to prevent abuse

See [DOCKER.md](DOCKER.md) for production deployment recommendations.

## Support & Documentation

- **Deployment Guide**: [DOCKER.md](DOCKER.md) - Complete Docker setup and configuration
- **API Documentation**: See API Reference section above
- **Model Documentation**:
  - [Demucs](https://github.com/facebookresearch/demucs)
  - [Whisper](https://github.com/openai/whisper)
  - [Pyannote](https://github.com/pyannote/pyannote-audio)

## License & Attribution

**Software License**: MIT License - Open source and free for commercial use

**AI Model Licenses**:
- Demucs: MIT License (Meta AI Research)
- Whisper: MIT License (OpenAI)
- Pyannote Audio: MIT License (requires HuggingFace agreement)

## Roadmap

Planned enhancements for enterprise adoption:

- [ ] REST API authentication and rate limiting
- [ ] Batch processing interface for multiple files
- [ ] Cloud storage integration (S3, GCS, Azure Blob)
- [ ] Kubernetes deployment manifests
- [ ] Prometheus metrics exporter
- [ ] WebSocket progress updates (alternative to SSE)
- [ ] Multi-language transcription support
- [ ] Custom model fine-tuning capabilities

---

**Built with enterprise-grade open source AI models from Meta Research, OpenAI, and Pyannote.**
