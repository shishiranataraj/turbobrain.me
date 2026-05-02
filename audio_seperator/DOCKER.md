# Docker Deployment Guide

This guide explains how to deploy the Audio Separator application using Docker and Docker Compose.

## Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (included with Docker Desktop)
- At least 8GB of RAM available for the container
- 10GB of free disk space (for models and dependencies)

## Quick Start

1. **Set up environment variables**

   Create a `.env` file in the project root (or use the existing one):
   ```bash
   HUGGINGFACE_TOKEN=your_token_here
   ```

   To get a HuggingFace token:
   - Visit https://huggingface.co/settings/tokens
   - Create a new token with read permissions
   - Accept the Pyannote model terms at https://huggingface.co/pyannote/speaker-diarization-3.1

2. **Build and start the container**

   ```bash
   docker-compose up -d
   ```

   This will:
   - Build the Docker image
   - Start the container in detached mode
   - Mount volumes for persistent data
   - Expose the app on http://localhost:5000

3. **Access the application**

   Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Docker Commands

### Start the application
```bash
docker-compose up -d
```

### Stop the application
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f
```

### Rebuild the image (after code changes)
```bash
docker-compose build
docker-compose up -d
```

### Stop and remove everything (including volumes)
```bash
docker-compose down -v
```

## Configuration

### Environment Variables

Edit the `docker-compose.yml` file or create a `.env` file:

- `HUGGINGFACE_TOKEN`: Your HuggingFace API token for speaker diarization

### Resource Limits

The default configuration allocates:
- Memory limit: 8GB
- Memory reservation: 4GB

Adjust these in `docker-compose.yml` under `deploy.resources` if needed.

### GPU Support (NVIDIA)

To enable GPU acceleration for faster processing:

1. Install NVIDIA Container Toolkit:
   ```bash
   # Ubuntu/Debian
   distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
   curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
   curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
   sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
   sudo systemctl restart docker
   ```

2. Uncomment the GPU section in `docker-compose.yml`:
   ```yaml
   deploy:
     resources:
       reservations:
         devices:
           - driver: nvidia
             count: 1
             capabilities: [gpu]
   ```

3. Restart the container:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Ports

The application runs on port 5000 by default. To change it, edit the `ports` section in `docker-compose.yml`:

```yaml
ports:
  - "8080:5000"  # Access on port 8080 instead
```

## Data Persistence

The following directories are mounted as volumes:
- `./uploads` - Temporary uploaded audio files
- `./outputs` - Separated tracks and transcriptions

These persist even when the container is stopped or removed.

## Troubleshooting

### Container fails to start

Check the logs:
```bash
docker-compose logs
```

Common issues:
- Insufficient memory: Increase Docker's memory allocation
- Port already in use: Change the port in `docker-compose.yml`
- Missing `.env` file: Create one with your HuggingFace token

### Models downloading slowly

On first run, the container will download:
- Whisper model (~140MB)
- Demucs model (~320MB)
- Pyannote diarization model (~20MB)

This is normal and only happens once. The models are cached in the container.

### Out of memory errors

Increase the memory limit in `docker-compose.yml` or process smaller audio files.

### GPU not detected

Ensure:
- NVIDIA drivers are installed
- nvidia-container-toolkit is installed
- The GPU configuration in `docker-compose.yml` is uncommented

Check GPU availability:
```bash
docker-compose exec audio-separator python -c "import torch; print(torch.cuda.is_available())"
```

## Production Deployment

For production use, consider:

1. **Use a reverse proxy (Nginx)**
   ```yaml
   services:
     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
       depends_on:
         - audio-separator
   ```

2. **Add SSL/TLS certificates** using Let's Encrypt

3. **Set up a process manager** like Gunicorn instead of Flask's development server

4. **Configure logging** to persistent storage

5. **Set up monitoring** with Prometheus/Grafana

6. **Use environment-based configuration** for different deployment environments

## Updating the Application

To update to the latest version:

```bash
git pull
docker-compose build
docker-compose down
docker-compose up -d
```

## Cleanup

To completely remove the application and free up space:

```bash
# Stop and remove containers
docker-compose down

# Remove volumes
docker volume prune

# Remove images
docker image prune -a
```
