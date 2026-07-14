# Cloudflare Tunnel Deployment Guide

## Overview

Deploy TradeFlo securely to the internet using Cloudflare Tunnels + Zero Trust.
No open ports required. Traffic is encrypted and protected by Cloudflare's edge.

---

## Prerequisites

- A **Cloudflare account** (free tier works)
- A **domain** added to Cloudflare
- `cloudflared` CLI installed on your VPS/machine

---

## Step 1 — Install cloudflared

```powershell
# Windows (PowerShell)
winget install Cloudflare.cloudflared
# Or download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

---

## Step 2 — Authenticate

```bash
cloudflared tunnel login
```

This opens a browser to authorize your Cloudflare account.

---

## Step 3 — Create the Tunnel

```bash
cloudflared tunnel create tradeflo
```

Note the **Tunnel ID** that's created (e.g. `abc123-def456-...`).

---

## Step 4 — Configure the Tunnel

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /home/user/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  # Frontend (Next.js)
  - hostname: tradeflo.yourdomain.com
    service: http://localhost:3000

  # Backend API
  - hostname: api.tradeflo.yourdomain.com
    service: http://localhost:8000

  # Catch-all
  - service: http_status:404
```

---

## Step 5 — Add DNS Records

```bash
cloudflared tunnel route dns tradeflo tradeflo.yourdomain.com
cloudflared tunnel route dns tradeflo api.tradeflo.yourdomain.com
```

---

## Step 6 — Secure with Zero Trust

1. Go to [one.dash.cloudflare.com](https://one.dash.cloudflare.com)
2. Navigate to **Access → Applications**
3. Add Application → Self-Hosted
4. Set **Application Domain** to `tradeflo.yourdomain.com`
5. Add a **Policy**:
   - Name: Allow Only Me
   - Action: Allow
   - Rule: Emails → `your@email.com`

This means only you can access TradeFlo even from the internet.

---

## Step 7 — Run the Tunnel

```bash
cloudflared tunnel run tradeflo
```

Or run as a Windows service:
```bash
cloudflared service install
```

---

## Step 8 — Update Frontend API URL

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://api.tradeflo.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.tradeflo.yourdomain.com
```

Then rebuild:
```bash
npm run build && npm start
```

---

## Result

| Service | URL |
|---------|-----|
| TradeFlo App | `https://tradeflo.yourdomain.com` |
| API | `https://api.tradeflo.yourdomain.com` |
| API Docs | `https://api.tradeflo.yourdomain.com/docs` |

All traffic is protected by Cloudflare Zero Trust — only you can log in.
