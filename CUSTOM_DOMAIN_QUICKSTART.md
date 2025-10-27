# Custom Domain Quick Start: api.khashokausa.info

## What You Need to Do (3 Steps)

### 1. Add Domain to Cloudflare (5 min)
- Go to https://dash.cloudflare.com
- Click "Add Site" → Enter: `khashokausa.info`
- Select Free plan
- Cloudflare will show nameservers - **COPY THESE**

### 2. Update GoDaddy Nameservers (2 min)
- Go to https://www.godaddy.com
- My Products → khashokausa.info → Manage → Nameservers
- Change to Custom → Enter Cloudflare nameservers
- Save

### 3. Configure Custom Domain in Worker (2 min)
- Wait 15 minutes for DNS to propagate
- Go to Cloudflare → Workers & Pages → tabit-worker → Settings
- Scroll to "Domains & Routes" → Add Custom Domain
- Enter: `api.khashokausa.info`
- Save
- Wait 5-15 minutes for SSL certificate

---

## Test After Setup

```powershell
# Test health
Invoke-WebRequest -Uri "https://api.khashokausa.info/health"

# Test catalog
Invoke-WebRequest -Uri "https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e"
```

Both should return 200 OK.

---

## Update GHL Custom Action

Change URL to:
```
https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e
```

Click "Test Webhook" - should now pass!

---

**Full detailed guide:** See `SETUP_CUSTOM_DOMAIN.md`

