# Audio Separator Features

## Music Source Separation

Separate any music track into 4 isolated stems:

1. **Vocals** - Singing and vocal performances
2. **Drums** - Drum kit and percussion
3. **Bass** - Bass guitar and low-frequency elements
4. **Other** - All other instruments (guitar, piano, synths, etc.)

### Track Merging (NEW!)

Combine any tracks you want into a single mixed file:

- **Example use cases:**
  - Merge drums + bass → Create rhythm section
  - Merge vocals + other → Remove drums and bass
  - Merge any combination of 2, 3, or all 4 tracks

**How to use:**
1. Separate your audio file
2. Check the boxes next to tracks you want to merge
3. Click "Merge Selected Tracks"
4. Download the merged file

The merged file is automatically named based on selected tracks (e.g., `merged_bass_drums.wav`).

## Speech Transcription

Convert speech to text with automatic speaker identification:

1. **Transcription** - Using OpenAI Whisper (base model)
2. **Speaker Diarization** - Using Pyannote Audio 3.1
3. **Timestamped Segments** - Each segment labeled with speaker and timestamp
4. **Downloadable Transcript** - Full transcript with speaker labels

## Supported Formats

**Input:**
- MP3
- WAV
- FLAC
- M4A
- OGG

**Output:**
- WAV (16-bit PCM, 44.1kHz)

**File Size Limit:** 100MB per file

## Real-time Features

- **Live Progress Monitoring** - See processing status in real-time
- **Log Streaming** - Watch detailed processing logs via Server-Sent Events
- **Device Detection** - Automatically uses best available hardware (MPS/CUDA/CPU)

## API Endpoints

### Music Separation

```
POST   /upload                    Upload audio file for separation
GET    /status/<job_id>          Check processing status
GET    /tracks/<job_id>          List available separated tracks
GET    /download/<job_id>/<track> Download individual track
POST   /merge/<job_id>           Merge selected tracks (NEW!)
POST   /cleanup/<job_id>         Clean up processed files
```

### Speech Transcription

```
POST   /upload                          Upload with mode=speech
GET    /transcription/<job_id>         Get transcription results
GET    /download_transcript/<job_id>   Download transcript file
```

### Monitoring

```
GET    /logs                     Stream live processing logs (SSE)
```

## Track Merge API

**Endpoint:** `POST /merge/<job_id>`

**Request Body:**
```json
{
  "tracks": ["drums", "bass"]
}
```

**Response:**
```json
{
  "status": "success",
  "filename": "merged_bass_drums.wav",
  "download_url": "/download/my-song/merged_bass_drums"
}
```

**Example using cURL:**
```bash
curl -X POST http://localhost:8080/merge/my-song \
  -H "Content-Type: application/json" \
  -d '{"tracks": ["drums", "other"]}'
```

## Performance

Processing speed varies by hardware:

| Hardware | 3-min Song | Throughput |
|----------|-----------|------------|
| Apple M1/M2/M3 | 30-120 sec | 1.5-6x real-time |
| NVIDIA GPU | <60 sec | >3x real-time |
| CPU (8-core) | 180-900 sec | 0.2-1x real-time |

## Models Used

1. **Demucs htdemucs** (Meta Research) - Music separation
   - Size: ~320 MB
   - State-of-the-art hybrid transformer model
   - No API key required

2. **Whisper Base** (OpenAI) - Speech transcription
   - Size: ~140 MB
   - Multi-language support
   - No API key required

3. **Pyannote Speaker Diarization 3.1** - Speaker identification
   - Size: ~20 MB
   - Requires HuggingFace token
   - Neural speaker segmentation

## Upcoming Features

- [ ] Batch processing (multiple files)
- [ ] More merge options (volume control, fade in/out)
- [ ] Audio preview before download
- [ ] Larger Whisper models (medium, large)
- [ ] Custom separation models
- [ ] Export to MP3/FLAC
- [ ] Karaoke mode (vocals removal preset)

---

**For deployment guides, see:**
- [DOCKER.md](DOCKER.md) - Docker and Docker Compose
- [RAILWAY.md](RAILWAY.md) - Cloud deployment
- [CLOUDFLARE-TUNNEL.md](CLOUDFLARE-TUNNEL.md) - Local-to-web tunneling
