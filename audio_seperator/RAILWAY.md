# Railway Deployment Guide

Deploy your Audio Separator application to Railway with one click.

## Prerequisites

- Railway account ([Sign up free](https://railway.app))
- GitHub account (for connecting your repository)
- HuggingFace token ([Get token](https://huggingface.co/settings/tokens))

## Quick Deploy

### Option 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Create new project on Railway**
   - Go to [railway.app/new](https://railway.app/new)
   - Click "Deploy from GitHub repo"
   - Select your `audio-separator` repository
   - Railway will auto-detect the Dockerfile and deploy

3. **Configure environment variables**
   - In Railway dashboard, go to your service
   - Click "Variables" tab
   - Add:
     ```
     HUGGINGFACE_TOKEN=your_token_here
     ```

4. **Configure resources**
   - Go to "Settings" tab
   - Recommended allocation:
     - **Memory**: 8192 MB (8GB)
     - **CPU**: 4 vCPU
   - You can start here and adjust based on usage

5. **Access your app**
   - Railway will provide a public URL like `https://your-app.up.railway.app`
   - Click "Generate Domain" in the Settings tab if not auto-generated

### Option 2: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set HUGGINGFACE_TOKEN=your_token_here

# Deploy
railway up
```

## Configuration

### Resource Allocation

Your plan supports up to 48 vCPU / 48 GB RAM. Recommended settings:

| Use Case | Memory | CPU | Monthly Cost (approx) |
|----------|--------|-----|----------------------|
| **Light use** (testing) | 4 GB | 2 vCPU | ~$10-15 |
| **Moderate use** (personal) | 8 GB | 4 vCPU | ~$20-30 |
| **Heavy use** (production) | 16 GB | 8 vCPU | ~$40-60 |

To adjust resources:
1. Go to your service in Railway dashboard
2. Click "Settings" → "Resources"
3. Adjust Memory and CPU sliders

### Environment Variables

Required:
- `HUGGINGFACE_TOKEN` - Your HuggingFace API token

Optional:
- `PORT` - Railway sets this automatically (defaults to 5000)

### Persistent Storage (Volumes)

Railway services are ephemeral by default. For production, add persistent volumes:

1. In Railway dashboard, click "Volumes"
2. Click "+ New Volume"
3. Configure:
   - **Mount Path**: `/app/uploads`
   - **Size**: 10 GB (adjust based on needs)
4. Add another volume:
   - **Mount Path**: `/app/outputs`
   - **Size**: 20 GB

**Note**: Volumes add to your monthly cost (~$0.25/GB/month)

## Monitoring

### View Logs

```bash
# Via CLI
railway logs

# Or in Railway dashboard
# Click "Observability" → "Logs"
```

### Check Deployment Status

```bash
railway status
```

### Metrics

In Railway dashboard:
- CPU usage
- Memory usage
- Network traffic
- Response times

Set up alerts for high memory/CPU usage.

## Cost Optimization

### Tips to reduce costs:

1. **Right-size resources**
   - Start with 4GB RAM, scale up if needed
   - Monitor actual usage and adjust

2. **Sleep on inactivity** (if not needed 24/7)
   - Railway can sleep services after inactivity
   - Settings → Sleep Mode (Hobby plan only)

3. **Optimize processing**
   - Use smaller Whisper model (base → tiny)
   - Limit concurrent uploads
   - Add cleanup automation

4. **Use volumes sparingly**
   - Only if you need persistent storage
   - Clean up old files regularly

### Estimated Monthly Costs

| Configuration | Cost |
|--------------|------|
| 4GB RAM, 2 vCPU, no volumes | ~$10-15 |
| 8GB RAM, 4 vCPU, no volumes | ~$20-30 |
| 8GB RAM, 4 vCPU, 30GB volumes | ~$30-40 |
| 16GB RAM, 8 vCPU, 50GB volumes | ~$50-70 |

*Actual costs depend on usage patterns and uptime*

## Troubleshooting

### Deployment fails

**Check build logs:**
```bash
railway logs --deployment
```

**Common issues:**
- Missing Dockerfile → Ensure Dockerfile is in root
- Build timeout → Increase build timeout in Settings
- Out of memory during build → Temporarily increase resources

### App crashes after deployment

**Check runtime logs:**
```bash
railway logs
```

**Common causes:**
- Out of memory → Increase memory allocation
- Missing environment variables → Check HUGGINGFACE_TOKEN is set
- Model download fails → Check internet connectivity, HF token validity

### Slow performance

1. **Check CPU/Memory usage** in dashboard
2. **Increase resources** if consistently high (>80%)
3. **Consider GPU** - Railway doesn't support GPU yet, use AWS/GCP if needed

### Connection timeout

If processing takes too long:
1. Increase healthcheck timeout in `railway.json`
2. Use smaller audio files for testing
3. Consider background job queue for production

## Production Best Practices

### 1. Enable Auto-scaling (Enterprise plan)
```json
{
  "deploy": {
    "replicas": {
      "min": 1,
      "max": 5
    }
  }
}
```

### 2. Add Health Checks
Already configured in `railway.json`:
```json
{
  "healthcheckPath": "/",
  "healthcheckTimeout": 300
}
```

### 3. Configure Restart Policy
```json
{
  "restartPolicyType": "ON_FAILURE",
  "restartPolicyMaxRetries": 10
}
```

### 4. Set up Custom Domain

1. Go to Settings → Domains
2. Click "Custom Domain"
3. Add your domain (e.g., `audio.yourdomain.com`)
4. Update DNS records as instructed

### 5. Enable HTTPS (automatic)
Railway provides SSL certificates automatically for all domains.

### 6. Add Rate Limiting
Implement in your app or use Railway's upcoming rate limiting features.

## Updating Your Deployment

### Automatic Deployments (GitHub)
Railway auto-deploys on every push to main branch.

### Manual Deployment
```bash
railway up
```

### Rollback
```bash
railway rollback
```

Or in dashboard: Deployments → Select previous deployment → Rollback

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Community**: [Railway Discord](https://discord.gg/railway)
- **Status**: [status.railway.app](https://status.railway.app)

## Migration from Other Platforms

### From Vercel
1. Remove `vercel.json` (not needed)
2. Push to GitHub
3. Connect to Railway
4. Add environment variables
5. Deploy

### From Heroku
1. Update `Procfile` is not needed (we use Dockerfile)
2. Railway auto-detects Python apps
3. Add environment variables
4. Deploy

## Next Steps

After successful deployment:

1. ✅ Test with a sample audio file
2. ✅ Monitor resource usage for 24 hours
3. ✅ Adjust memory/CPU if needed
4. ✅ Set up custom domain (optional)
5. ✅ Configure volumes for persistence (if needed)
6. ✅ Set up monitoring alerts
7. ✅ Share your app URL!

---

**Your app should now be live at your Railway domain!** 🚀
