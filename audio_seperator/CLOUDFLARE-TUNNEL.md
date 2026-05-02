# Cloudflare Tunnel Setup Guide

Expose your local Audio Separator deployment to the internet securely using Cloudflare Tunnels (free).

## Why Cloudflare Tunnels?

- ✅ **Free** - No cost for basic usage
- ✅ **Secure** - No port forwarding needed
- ✅ **SSL/TLS** - Automatic HTTPS certificates
- ✅ **DDoS Protection** - Cloudflare's network protection
- ✅ **No public IP needed** - Works behind NAT/firewalls
- ✅ **Custom domain** - Use your own domain

## Quick Start (Temporary Tunnel)

Get a public URL in 30 seconds without configuration:

```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared

# Start your Docker app
docker-compose up -d

# Create temporary tunnel
cloudflared tunnel --url http://localhost:8080
```

You'll get a URL like: `https://random-name.trycloudflare.com`

**Note:** This URL changes each time and expires when you stop the tunnel. Use for testing only.

## Permanent Setup with Custom Domain

### Prerequisites

- Cloudflare account (free)
- Domain managed by Cloudflare
- `cloudflared` CLI installed

### Step 1: Install cloudflared

**macOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Linux:**
```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

**Windows:**
```powershell
winget install --id Cloudflare.cloudflared
```

### Step 2: Authenticate

```bash
cloudflared tunnel login
```

This opens your browser to authenticate with Cloudflare. Select your domain.

### Step 3: Create a Tunnel

```bash
cloudflared tunnel create audio-separator
```

Save the **Tunnel ID** shown in the output. You'll need it later.

### Step 4: Configure the Tunnel

Create configuration file at `~/.cloudflared/config.yml`:

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /Users/<your-username>/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  # Route your domain to local app
  - hostname: audio.yourdomain.com
    service: http://localhost:8080

  # Catch-all rule (required)
  - service: http_status:404
```

**Replace:**
- `<YOUR-TUNNEL-ID>` with the ID from Step 3
- `<your-username>` with your system username
- `audio.yourdomain.com` with your desired subdomain

### Step 5: Route DNS

```bash
cloudflared tunnel route dns audio-separator audio.yourdomain.com
```

This creates a CNAME record in Cloudflare DNS pointing to your tunnel.

### Step 6: Start the Tunnel

```bash
# Start your app
docker-compose up -d

# Start tunnel
cloudflared tunnel run audio-separator
```

Your app is now accessible at `https://audio.yourdomain.com`!

## Run as Background Service

### macOS/Linux (systemd)

```bash
# Install as service
sudo cloudflared service install

# Start service
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

### Docker Compose Integration

Add tunnel to your docker-compose.yml:

1. **Get tunnel token** from Cloudflare dashboard:
   - Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
   - Navigate to Networks → Tunnels
   - Click on your tunnel → Configure
   - Copy the tunnel token

2. **Add to `.env` file:**
   ```bash
   CLOUDFLARE_TUNNEL_TOKEN=your_tunnel_token_here
   ```

3. **Uncomment the cloudflared service** in `docker-compose.yml`:
   ```yaml
   cloudflared:
     image: cloudflare/cloudflared:latest
     container_name: cloudflared-tunnel
     command: tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN}
     restart: unless-stopped
     depends_on:
       - audio-separator
   ```

4. **Restart Docker Compose:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

Now both your app and tunnel run in Docker!

## Alternative: Dashboard Setup (No CLI)

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. Navigate to **Networks** → **Tunnels**
3. Click **Create a tunnel**
4. Name it `audio-separator`
5. Install connector:
   - Choose your OS
   - Run the provided command
6. Configure public hostname:
   - Subdomain: `audio`
   - Domain: `yourdomain.com`
   - Service: `http://localhost:8080`
7. Save and the tunnel is live!

## Configuration Options

### Multiple Services

Route different paths to different services:

```yaml
ingress:
  - hostname: audio.yourdomain.com
    service: http://localhost:8080

  - hostname: api.yourdomain.com
    service: http://localhost:3000

  - service: http_status:404
```

### Path-based Routing

```yaml
ingress:
  - hostname: yourdomain.com
    path: /audio/*
    service: http://localhost:8080

  - hostname: yourdomain.com
    service: http://localhost:80

  - service: http_status:404
```

### Access Control (Authentication)

Add authentication to your tunnel:

1. Go to Cloudflare Zero Trust → Access → Applications
2. Create new application
3. Select your tunnel domain
4. Add authentication method (Google, GitHub, email OTP, etc.)
5. Define access policies

Now users must authenticate before accessing your app!

## Monitoring

### View Tunnel Status

```bash
cloudflared tunnel info audio-separator
```

### View Logs

```bash
# If running as service
sudo journalctl -u cloudflared -f

# If running in Docker
docker-compose logs -f cloudflared
```

### Dashboard Metrics

Go to Cloudflare dashboard → Analytics → Traffic

## Troubleshooting

### Tunnel not connecting

```bash
# Check tunnel status
cloudflared tunnel info audio-separator

# Test connection
cloudflared tunnel run audio-separator --loglevel debug
```

### DNS not resolving

```bash
# Verify DNS record
dig audio.yourdomain.com

# Re-create DNS route
cloudflared tunnel route dns audio-separator audio.yourdomain.com
```

### Connection timeout

1. Ensure your app is running: `docker-compose ps`
2. Test locally first: `curl http://localhost:8080`
3. Check firewall isn't blocking cloudflared

### SSL/Certificate errors

Cloudflare handles SSL automatically. If you see SSL errors:
1. Check SSL/TLS mode in Cloudflare dashboard (use "Full" or "Flexible")
2. Ensure your local app uses `http://` not `https://`

## Security Best Practices

1. **Enable Access Control** - Add authentication for public deployments
2. **Use WAF Rules** - Configure Web Application Firewall in Cloudflare
3. **Rate Limiting** - Set up rate limits to prevent abuse
4. **Keep Secrets Safe** - Don't commit tunnel credentials to git

Add to `.gitignore`:
```
.cloudflared/
*.json
```

## Cost

Cloudflare Tunnels are **free** for:
- Up to 50 users (with Access)
- Unlimited bandwidth
- Unlimited requests

Perfect for personal projects and small teams!

## Comparison: Cloudflare Tunnel vs Railway

| Feature | Cloudflare Tunnel (Local) | Railway (Cloud) |
|---------|--------------------------|-----------------|
| **Cost** | Free | $10-30/month |
| **Setup** | 5 minutes | 2 minutes |
| **Uptime** | Depends on your computer | 99.9%+ |
| **Resources** | Your hardware | Up to 48GB RAM |
| **Scaling** | Manual | Automatic |
| **Best for** | Development, testing | Production, always-on |

**Recommendation:**
- Use **Cloudflare Tunnel** for development and demos
- Use **Railway** for production deployments

## Next Steps

Once your tunnel is running:

1. ✅ Test your app at `https://audio.yourdomain.com`
2. ✅ Set up Access Control for security
3. ✅ Configure rate limiting
4. ✅ Monitor traffic in Cloudflare dashboard
5. ✅ Share your app with others!

---

**Your local app is now accessible worldwide with enterprise-grade security!** 🚀
