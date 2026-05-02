import requests
from flask import Blueprint, request, Response, stream_with_context

audio_separator_bp = Blueprint("audio_separator", __name__)

UPSTREAM = "http://audio-separator:5000"

# Hop-by-hop headers that must not be proxied
_HOP_HEADERS = {"transfer-encoding", "connection", "keep-alive", "upgrade"}


@audio_separator_bp.route("/audio-separator/", defaults={"path": ""})
@audio_separator_bp.route("/audio-separator/<path:path>", methods=["GET", "POST"])
def proxy(path):
    url = f"{UPSTREAM}/{path}"

    headers = {
        k: v for k, v in request.headers if k.lower() not in ("host", "transfer-encoding")
    }

    is_sse = path == "logs"
    timeout = (5, None) if is_sse else 600

    resp = requests.request(
        method=request.method,
        url=url,
        headers=headers,
        data=request.get_data(),
        params=request.args,
        stream=True,
        allow_redirects=False,
        timeout=timeout,
    )

    if is_sse:
        def sse_stream():
            try:
                for line in resp.iter_lines():
                    if line:
                        yield line.decode("utf-8", errors="replace") + "\n\n"
                    else:
                        yield "\n"
            except GeneratorExit:
                resp.close()

        return Response(
            stream_with_context(sse_stream()),
            status=resp.status_code,
            content_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    # Preserve content-length and content-type for proper audio streaming / seeking
    response_headers = [
        (k, v) for k, v in resp.raw.headers.items() if k.lower() not in _HOP_HEADERS
    ]

    return Response(
        stream_with_context(resp.iter_content(chunk_size=65536)),
        status=resp.status_code,
        headers=response_headers,
    )
