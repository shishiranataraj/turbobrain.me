import os
import shutil
from flask import Flask, render_template, request, jsonify, send_file, Response
from werkzeug.utils import secure_filename
import subprocess
import threading
import json
import torch
from collections import deque
from datetime import datetime
import whisper
from pyannote.audio import Pipeline
import torchaudio
import warnings
from dotenv import load_dotenv
import traceback
import sys
import re
warnings.filterwarnings('ignore')

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
app.config['ALLOWED_EXTENSIONS'] = {'mp3', 'wav', 'flac', 'm4a', 'ogg'}

# Detect available device (MPS for M1/M2 Macs, CUDA for NVIDIA GPUs, or CPU)
def get_device():
    if torch.backends.mps.is_available():
        return 'mps'
    elif torch.cuda.is_available():
        return 'cuda'
    else:
        return 'cpu'

DEVICE = get_device()
print(f"Using device: {DEVICE}")

# Store processing status and logs
processing_status = {}
log_buffer = deque(maxlen=500)  # Keep last 500 log messages
job_logs = {}  # Store logs per job ID

def add_log(message, job_id=None):
    """Add a log message with timestamp"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_entry = f"[{timestamp}] {message}"
    log_buffer.append(log_entry)

    # Also store per-job logs
    if job_id:
        if job_id not in job_logs:
            job_logs[job_id] = []
        job_logs[job_id].append(log_entry)

    print(log_entry, flush=True)  # Also print to console with flush

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def separate_audio(file_path, job_id):
    """Run Demucs separation in a background thread"""
    try:
        processing_status[job_id] = {'status': 'processing', 'progress': 0, 'device': DEVICE}
        add_log(f"Starting audio separation for job: {job_id}")
        add_log(f"Using device: {DEVICE}")

        # Run demucs command with device specification
        output_dir = app.config['OUTPUT_FOLDER']
        cmd = ['demucs', '-n', 'htdemucs', '-d', DEVICE, '--mp3', '-o', output_dir, file_path]
        add_log(f"Command: {' '.join(cmd)}")

        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True
        )

        # Monitor progress
        for line in process.stdout:
            stripped_line = line.strip()
            if stripped_line:
                add_log(f"[Demucs] {stripped_line}")
            if 'Decoding' in line or 'Separating' in line:
                processing_status[job_id]['status'] = 'processing'

        process.wait()

        if process.returncode == 0:
            processing_status[job_id] = {'status': 'completed', 'progress': 100}
            add_log(f"Audio separation completed successfully for job: {job_id}")
        else:
            processing_status[job_id] = {'status': 'failed', 'error': 'Separation failed'}
            add_log(f"Audio separation failed for job: {job_id}")

    except Exception as e:
        processing_status[job_id] = {'status': 'failed', 'error': str(e)}
        add_log(f"Error in audio separation: {str(e)}")

def separate_speakers(file_path, job_id):
    """Separate speakers using Whisper + Pyannote and generate transcription"""
    try:
        processing_status[job_id] = {'status': 'processing', 'progress': 0, 'device': DEVICE}
        add_log(f"Starting speaker separation for job: {job_id}", job_id)
        add_log(f"Using device: {DEVICE}", job_id)

        # Load Whisper model
        add_log("Loading Whisper model for transcription...", job_id)
        whisper_model = whisper.load_model("base", device=DEVICE)

        # Transcribe audio with Whisper
        add_log("Transcribing audio...", job_id)
        result = whisper_model.transcribe(file_path, verbose=False)
        transcription = result['text']
        segments = result['segments']
        add_log(f"Transcription complete: {len(segments)} segments found", job_id)

        # Load speaker diarization pipeline
        hf_token = os.getenv('HUGGINGFACE_TOKEN')
        if hf_token and hf_token != 'PASTE_YOUR_TOKEN_HERE':
            add_log("Loading speaker diarization pipeline...", job_id)
            try:
                # Convert audio to standard format for pyannote
                add_log("Converting audio to standard format...", job_id)
                waveform, sample_rate = torchaudio.load(file_path)
                # Resample to 16kHz if needed (pyannote standard)
                if sample_rate != 16000:
                    resampler = torchaudio.transforms.Resample(sample_rate, 16000)
                    waveform = resampler(waveform)
                    sample_rate = 16000
                # Convert to mono if stereo
                if waveform.shape[0] > 1:
                    waveform = torch.mean(waveform, dim=0, keepdim=True)

                # Save as temporary WAV file
                temp_wav = file_path.replace('.mp3', '_temp.wav').replace('.m4a', '_temp.wav').replace('.flac', '_temp.wav').replace('.ogg', '_temp.wav')
                torchaudio.save(temp_wav, waveform, sample_rate)

                diarization_pipeline = Pipeline.from_pretrained(
                    "pyannote/speaker-diarization-3.1",
                    token=hf_token
                )

                # Run diarization on converted file
                add_log("Performing speaker diarization...", job_id)
                diarization = diarization_pipeline(temp_wav)

                # Clean up temp file
                if os.path.exists(temp_wav):
                    os.remove(temp_wav)

                # Map speakers to segments
                add_log("Mapping speakers to transcript segments...", job_id)
                speaker_segments = []
                # Pyannote 3.x returns an Annotation object directly
                for turn, _, label in diarization.itertracks(yield_label=True):
                    speaker_segments.append({
                        'start': turn.start,
                        'end': turn.end,
                        'speaker': label
                    })
                    add_log(f"Found speaker segment: {label} from {turn.start:.2f}s to {turn.end:.2f}s", job_id)

                # Combine diarization with transcription
                for segment in segments:
                    seg_start = segment['start']
                    seg_end = segment['end']
                    seg_mid = (seg_start + seg_end) / 2

                    # Find which speaker was talking during this segment
                    speaker = "Unknown"
                    for sp_seg in speaker_segments:
                        if sp_seg['start'] <= seg_mid <= sp_seg['end']:
                            speaker = sp_seg['speaker']
                            break

                    segment['speaker'] = speaker

                add_log(f"Speaker diarization complete. Found {len(set(s['speaker'] for s in speaker_segments))} speakers", job_id)

            except Exception as e:
                error_details = traceback.format_exc()
                add_log(f"Warning: Speaker diarization failed ({str(e)})", job_id)
                add_log(f"Error details: {error_details}", job_id)
                for segment in segments:
                    segment['speaker'] = "Speaker"
        else:
            add_log("No HuggingFace token found, skipping speaker diarization", job_id)
            for segment in segments:
                segment['speaker'] = "Speaker"

        # Create output directory
        output_dir = os.path.join(app.config['OUTPUT_FOLDER'], 'speakers', job_id)
        os.makedirs(output_dir, exist_ok=True)

        # Save full transcription with speakers
        transcript_file = os.path.join(output_dir, 'transcript.txt')
        with open(transcript_file, 'w') as f:
            f.write(f"Full Transcription:\n\n{transcription}\n\n")
            f.write("Timestamped Segments with Speakers:\n\n")
            for i, segment in enumerate(segments):
                start = segment['start']
                end = segment['end']
                text = segment['text']
                speaker = segment.get('speaker', 'Speaker')
                f.write(f"[{start:.2f}s - {end:.2f}s] {speaker}: {text}\n")

        add_log(f"Transcription saved to {transcript_file}", job_id)

        # Store segments in processing status
        processing_status[job_id] = {
            'status': 'completed',
            'progress': 100,
            'transcription': transcription,
            'segments': segments,
            'output_dir': output_dir
        }
        add_log(f"Speaker separation completed for job: {job_id}", job_id)

    except Exception as e:
        error_details = traceback.format_exc()
        processing_status[job_id] = {'status': 'failed', 'error': str(e)}
        add_log(f"Error in speaker separation: {str(e)}", job_id)
        add_log(f"Error details: {error_details}", job_id)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/logs')
def stream_logs():
    """Stream logs to the client using Server-Sent Events"""
    def generate():
        # Send existing logs first
        for log in log_buffer:
            yield f"data: {log}\n\n"

        # Keep connection open for new logs
        last_size = len(log_buffer)
        while True:
            import time
            time.sleep(0.5)  # Check for new logs every 0.5 seconds
            current_size = len(log_buffer)
            if current_size > last_size:
                # Send new logs
                new_logs = list(log_buffer)[last_size:]
                for log in new_logs:
                    yield f"data: {log}\n\n"
                last_size = current_size

    return Response(generate(), mimetype='text/event-stream')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        add_log("Error: No file provided in upload request")
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        add_log("Error: No file selected")
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        add_log(f"Error: Invalid file type: {file.filename}")
        return jsonify({'error': 'Invalid file type. Supported: MP3, WAV, FLAC, M4A, OGG'}), 400

    # Get separation mode (music or speech)
    mode = request.form.get('mode', 'music')  # default to music mode

    # Save uploaded file
    filename = secure_filename(file.filename)
    job_id = os.path.splitext(filename)[0]
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    add_log(f"File uploaded: {filename} (Job ID: {job_id}, Mode: {mode})")

    # Start appropriate separation in background thread
    if mode == 'speech':
        thread = threading.Thread(target=separate_speakers, args=(file_path, job_id))
    else:
        thread = threading.Thread(target=separate_audio, args=(file_path, job_id))

    thread.start()

    return jsonify({'job_id': job_id, 'status': 'processing', 'mode': mode})

@app.route('/youtube', methods=['POST'])
def youtube_download():
    """Download audio from a YouTube URL and process it"""
    data = request.get_json()
    url = data.get('url', '').strip()
    mode = data.get('mode', 'music')

    if not url:
        return jsonify({'error': 'No URL provided'}), 400

    # Basic URL validation
    if not re.match(r'https?://(www\.)?(youtube\.com|youtu\.be)/', url):
        return jsonify({'error': 'Invalid YouTube URL'}), 400

    try:
        import yt_dlp

        add_log(f"Fetching video info from: {url}")

        # First extract info to get the title for job_id
        with yt_dlp.YoutubeDL({'quiet': True, 'no_warnings': True}) as ydl:
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'youtube_audio')

        # Sanitize title for use as filename/job_id
        job_id = secure_filename(title)
        job_id = os.path.splitext(job_id)[0]  # remove extension if any
        if not job_id:
            job_id = 'youtube_audio'

        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f'{job_id}.mp3')

        add_log(f"Downloading audio: {title}")
        processing_status[job_id] = {'status': 'downloading', 'progress': 0, 'device': DEVICE}

        # Download audio as mp3
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': os.path.join(app.config['UPLOAD_FOLDER'], f'{job_id}.%(ext)s'),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'quiet': True,
            'no_warnings': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        if not os.path.exists(file_path):
            add_log(f"Error: Downloaded file not found at {file_path}")
            return jsonify({'error': 'Download failed'}), 500

        add_log(f"Download complete: {job_id}.mp3 (Mode: {mode})")

        # Start processing in background thread
        if mode == 'speech':
            thread = threading.Thread(target=separate_speakers, args=(file_path, job_id))
        else:
            thread = threading.Thread(target=separate_audio, args=(file_path, job_id))

        thread.start()

        return jsonify({'job_id': job_id, 'status': 'processing', 'mode': mode})

    except Exception as e:
        add_log(f"YouTube download error: {str(e)}")
        return jsonify({'error': f'YouTube download failed: {str(e)}'}), 500

@app.route('/status/<job_id>')
def get_status(job_id):
    status = processing_status.get(job_id, {'status': 'unknown'})
    return jsonify(status)

@app.route('/tracks/<job_id>')
def get_tracks(job_id):
    """Return list of separated track files"""
    track_dir = os.path.join(app.config['OUTPUT_FOLDER'], 'htdemucs', job_id)

    if not os.path.exists(track_dir):
        return jsonify({'error': 'Tracks not found'}), 404

    tracks = {}
    track_names = ['vocals', 'drums', 'bass', 'other']

    for track_name in track_names:
        for ext in ('mp3', 'wav'):
            track_file = os.path.join(track_dir, f'{track_name}.{ext}')
            if os.path.exists(track_file):
                tracks[track_name] = f'/audio-separator/download/{job_id}/{track_name}'
                break

    return jsonify(tracks)

@app.route('/download/<job_id>/<track_name>')
def download_track(job_id, track_name):
    """Serve individual track file"""
    # Try mp3 first, fall back to wav
    for ext, mime in (('mp3', 'audio/mpeg'), ('wav', 'audio/wav')):
        track_file = os.path.join(
            app.config['OUTPUT_FOLDER'],
            'htdemucs',
            job_id,
            f'{track_name}.{ext}'
        )
        if os.path.exists(track_file):
            return send_file(track_file, mimetype=mime, conditional=True)

    return jsonify({'error': 'Track not found'}), 404

@app.route('/merge/<job_id>', methods=['POST'])
def merge_tracks(job_id):
    """Merge selected tracks into a single file"""
    try:
        # Get selected tracks from request
        data = request.get_json()
        selected_tracks = data.get('tracks', [])

        if not selected_tracks or len(selected_tracks) < 2:
            return jsonify({'error': 'Please select at least 2 tracks to merge'}), 400

        track_dir = os.path.join(app.config['OUTPUT_FOLDER'], 'htdemucs', job_id)
        if not os.path.exists(track_dir):
            return jsonify({'error': 'Tracks not found'}), 404

        add_log(f"Merging tracks for job {job_id}: {', '.join(selected_tracks)}")

        # Load and mix the selected tracks
        mixed_audio = None
        sample_rate = None

        for track_name in selected_tracks:
            # Try mp3 first, fall back to wav
            track_file = None
            for ext in ('mp3', 'wav'):
                candidate = os.path.join(track_dir, f'{track_name}.{ext}')
                if os.path.exists(candidate):
                    track_file = candidate
                    break
            if not track_file:
                return jsonify({'error': f'Track {track_name} not found'}), 404

            # Load audio file
            waveform, sr = torchaudio.load(track_file)

            if mixed_audio is None:
                mixed_audio = waveform
                sample_rate = sr
            else:
                # Add (mix) the tracks together
                mixed_audio = mixed_audio + waveform

        # Create merged filename — save as wav first, then convert to mp3 via ffmpeg
        merged_name = '_'.join(sorted(selected_tracks))
        temp_wav = os.path.join(track_dir, f'merged_{merged_name}.wav')
        merged_file = os.path.join(track_dir, f'merged_{merged_name}.mp3')

        torchaudio.save(temp_wav, mixed_audio, sample_rate)

        # Convert to mp3 with ffmpeg
        result = subprocess.run(
            ['ffmpeg', '-y', '-i', temp_wav, '-b:a', '320k', merged_file],
            capture_output=True, text=True
        )
        os.remove(temp_wav)

        if result.returncode != 0:
            add_log(f"FFmpeg merge error: {result.stderr}")
            return jsonify({'error': 'Failed to encode merged audio'}), 500

        add_log(f"Merged tracks saved: merged_{merged_name}.mp3")

        return jsonify({
            'status': 'success',
            'filename': f'merged_{merged_name}.mp3',
            'download_url': f'/audio-separator/download/{job_id}/merged_{merged_name}'
        })

    except Exception as e:
        add_log(f"Error merging tracks: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/transcription/<job_id>')
def get_transcription(job_id):
    """Get transcription for speaker separation job"""
    status = processing_status.get(job_id, {})

    if status.get('status') != 'completed':
        return jsonify({'error': 'Transcription not ready'}), 404

    transcription = status.get('transcription', '')
    segments = status.get('segments', [])

    # Also provide download link for transcript file
    output_dir = status.get('output_dir', '')
    transcript_file = os.path.join(output_dir, 'transcript.txt')

    return jsonify({
        'transcription': transcription,
        'segments': segments,
        'download_url': f'/audio-separator/download_transcript/{job_id}'
    })

@app.route('/download_transcript/<job_id>')
def download_transcript(job_id):
    """Download transcript file"""
    status = processing_status.get(job_id, {})
    output_dir = status.get('output_dir', '')
    transcript_file = os.path.join(output_dir, 'transcript.txt')

    if not os.path.exists(transcript_file):
        return jsonify({'error': 'Transcript not found'}), 404

    return send_file(transcript_file, mimetype='text/plain', as_attachment=True, download_name=f'{job_id}_transcript.txt')

@app.route('/cleanup/<job_id>', methods=['POST'])
def cleanup(job_id):
    """Clean up uploaded and output files"""
    try:
        # Remove uploaded file
        upload_files = os.listdir(app.config['UPLOAD_FOLDER'])
        for f in upload_files:
            if f.startswith(job_id):
                os.remove(os.path.join(app.config['UPLOAD_FOLDER'], f))

        # Remove music separation output directory
        output_dir = os.path.join(app.config['OUTPUT_FOLDER'], 'htdemucs', job_id)
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)

        # Remove speaker separation output directory
        speaker_dir = os.path.join(app.config['OUTPUT_FOLDER'], 'speakers', job_id)
        if os.path.exists(speaker_dir):
            shutil.rmtree(speaker_dir)

        # Remove from status
        if job_id in processing_status:
            del processing_status[job_id]

        return jsonify({'status': 'cleaned'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

    # Use PORT from environment variable (Railway, Heroku, etc.) or default to 5000
    port = int(os.getenv('PORT', 5000))

    # Use 0.0.0.0 to allow external connections in Docker and cloud platforms
    app.run(host='0.0.0.0', debug=False, port=port)
