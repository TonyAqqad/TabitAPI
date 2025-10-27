# Production URLs Reference

## Base URL
```
https://api.khashokausa.info
```

---

## Available Endpoints

### 1. Health Check
```
GET https://api.khashokausa.info/health
Response: {"status":"healthy"}
Auth: None required
```

### 2. Get Full Catalog (Production)
```
GET https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e
Response: Complete menu JSON (~269KB)
Auth: API key required
```

### 3. Get Menu Summary (Lightweight)
```
GET https://api.khashokausa.info/menu-summary?api_key=wqiuefdy8y18e
Response: Condensed menu (~8KB)
Auth: API key required
```

### 4. Submit Order
```
POST https://api.khashokausa.info/order
Headers: X-API-Key: wqiuefdy8y18e
Body: Order JSON
Response: Tabit order confirmation
Auth: API key required
```

### 5. Menu Update Webhook
```
POST https://api.khashokausa.info/webhooks/tabit/menu-update
Response: {"status":"cache cleared"}
Auth: None required
```

### 6. Order Status Webhook
```
POST https://api.khashokausa.info/webhooks/tabit/order-status
Response: {"status":"received"}
Auth: None required
```

---

## GHL Configuration

### Custom Action: Fetch Menu
- **Method:** GET
- **URL:** `https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e`
- **Headers:** (none)
- **Body:** (empty)

### Workflow: Fetch Menu
- **Method:** GET
- **URL:** `https://api.khashokausa.info/catalog`
- **Headers:**
  - `X-API-Key: wqiuefdy8y18e`
- **Body:** (empty)

---

## Testing Commands

### PowerShell
```powershell
# Health check
Invoke-WebRequest -Uri "https://api.khashokausa.info/health"

# Full catalog
Invoke-WebRequest -Uri "https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e"

# Menu summary
Invoke-WebRequest -Uri "https://api.khashokausa.info/menu-summary?api_key=wqiuefdy8y18e"
```

### cURL
```bash
# Health check
curl https://api.khashokausa.info/health

# Full catalog
curl "https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e"

# Menu summary
curl "https://api.khashokausa.info/menu-summary?api_key=wqiuefdy8y18e"
```

---

## Fallback URL (Original)

If custom domain has issues, fallback to:
```
https://tabit-worker.tony-578.workers.dev
```

But the custom domain should always be primary for production.

---

## Monitoring

- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Worker Logs:** Workers & Pages → tabit-worker → Logs
- **Analytics:** Workers & Pages → tabit-worker → Analytics

---

## API Key

**Current API Key:** `wqiuefdy8y18e`

To rotate (optional):
1. Generate new key in Cloudflare Secrets
2. Update all GHL configurations
3. Update this documentation

---

**Last Updated:** January 2025  
**Status:** ✅ Active and Production Ready

