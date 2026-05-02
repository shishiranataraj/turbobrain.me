# Cloudflare Tunnel Fix Guide

## Symptom: 502 Bad Gateway or Error 1033

The site works on some devices/networks but not others, or stops working entirely.

## Quick Fix (works most of the time)

```bash
docker compose restart cloudflared
```

Wait 10 seconds, then test.

## Full Fix (if restart doesn't help)

### 1. Check containers are running

```bash
docker compose ps
docker compose logs --tail=20 cloudflared
```

Look for "Registered tunnel connection" lines — you need 4 healthy connections.

### 2. Force HTTP/2 protocol

The tunnel must use `--protocol http2` (not QUIC/UDP). This is already set in `docker-compose.yml`. If you see QUIC errors, verify the command line includes `--protocol http2`.

### 3. Nuclear option: delete and re-add DNS

If you're getting persistent 502s or 1033 errors:

1. Go to **Cloudflare Dashboard > DNS > Records**
2. **Delete** the CNAME record for `turbobrain.me`
3. Go to **Zero Trust > Networks > Tunnels**
4. Verify the public hostname `turbobrain.me` → `http://backend:8000` still exists
5. If the DNS record doesn't auto-recreate, manually add:
   - Type: **CNAME**
   - Name: **@**
   - Target: **6c153c1c-9ba7-498c-a780-fb16c6674169.cfargotunnel.com**
   - Proxy: **On** (orange cloud)
6. Restart the tunnel:
   ```bash
   docker compose restart cloudflared
   ```
7. Wait 10 seconds, test with `curl -s -o /dev/null -w "%{http_code}" https://turbobrain.me/`

## Debugging commands

```bash
# Check which Cloudflare edge you're hitting
curl -s https://turbobrain.me/cdn-cgi/trace

# Test backend directly (should return 200)
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/

# Check DNS resolution
nslookup turbobrain.me

# Full container logs
docker compose logs cloudflared
docker compose logs backend
```

## Root cause

Cloudflare's anycast routing can send requests to an edge server that hasn't picked up the tunnel connection yet. Deleting and re-adding the DNS record + restarting cloudflared forces a clean re-registration.
