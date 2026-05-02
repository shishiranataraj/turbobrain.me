# Raspberry Pi bare-metal setup

One-time setup for hosting turbobrain.me on the Pi without Docker. The existing `turbobrain.service` runs `start.sh`, which launches gunicorn and the Cloudflare Tunnel together.

## 1. Install system packages

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip nodejs npm git
```

## 2. Clone the repo

```bash
cd ~
git clone https://github.com/shishiranataraj/turbobrain.me.git
cd turbobrain.me
```

## 3. Create `.env`

The `.env` is gitignored — recreate it on the Pi:

```bash
nano .env
```

Minimum contents:

```
SECRET_KEY=<random-string>
TUNNEL_TOKEN=<your-cloudflare-tunnel-token>
```

## 4. Install Cloudflare Tunnel binary

```bash
sudo ./setup-tunnel.sh
```

(Installs the `cloudflared` binary. The tunnel itself is launched by `start.sh`, not as a separate systemd service.)

## 5. First deploy (creates venv, builds frontend, installs deps)

```bash
chmod +x deploy/deploy-pi.sh
./deploy/deploy-pi.sh
```

The deploy script will warn that the service isn't installed yet — that's expected on first run.

## 6. Install the systemd service

```bash
sudo cp deploy/turbobrain.service /etc/systemd/system/turbobrain.service
sudo systemctl daemon-reload
sudo systemctl enable --now turbobrain
```

## Updates

After the first deploy, every update is one command:

```bash
./deploy/deploy-pi.sh
```

It pulls, rebuilds, and restarts the service.

## Useful commands

```bash
sudo systemctl status turbobrain        # is it running?
sudo journalctl -u turbobrain -f        # tail logs
sudo systemctl restart turbobrain       # manual restart
```

## Notes

- The `audio-separator` proxy route in `backend/routes/audio_separator.py` points to the Docker hostname `http://audio-separator:5000`. On the Pi it won't resolve, but the project card is currently hidden as work-in-progress so no requests are made. When you wire up the second Cloudflare Tunnel to your PC, update `UPSTREAM` in that file.
- `gunicorn.conf.py` uses 4 workers. If the Pi's RAM is tight, lower it to 2.
