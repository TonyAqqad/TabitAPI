# Quick Start Guide

## Prerequisites

- Node.js 16+ installed
- Cloudflare account
- Tabit demo credentials

## Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Deploy Worker

```bash
wrangler deploy
```

### 4. Configure Secrets

```bash
# Required
wrangler secret put TABIT_INTEGRATOR_TOKEN
wrangler secret put TABIT_ORG_TOKEN

# Optional
wrangler secret put PROXY_API_KEY
wrangler secret put FORWARD_STATUS_URL

# Enable debug endpoint
wrangler secret put DEBUG
# Enter: true
```

### 5. Register Webhooks

Use PowerShell, bash, or Postman to register webhooks with Tabit:

**PowerShell**:
```powershell
$headers = @{
    "integrator-token" = "<YOUR_TOKEN>"
    "organization-token" = "<YOUR_TOKEN>"
    "Content-Type" = "application/json"
}

$body = @{
    callbackWebhook = "https://tabit-worker.tony-578.workers.dev/webhooks/tabit/order-status"
    menuWebhook = "https://tabit-worker.tony-578.workers.dev/webhooks/tabit/menu-update"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://us-demo-middleware.tabit-stage.com/third-party/me" `
    -Method PUT -Headers $headers -Body $body
```

**Bash**:
```bash
curl -X PUT "https://us-demo-middleware.tabit-stage.com/third-party/me" \
  -H "integrator-token: <YOUR_TOKEN>" \
  -H "organization-token: <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "callbackWebhook": "https://tabit-worker.tony-578.workers.dev/webhooks/tabit/order-status",
    "menuWebhook": "https://tabit-worker.tony-578.workers.dev/webhooks/tabit/menu-update"
  }'
```

### 6. Test

```bash
# Health check
curl https://tabit-worker.tony-578.workers.dev/health

# Get catalog (if using API key)
curl https://tabit-worker.tony-578.workers.dev/catalog \
  -H "X-API-Key: your-key"
```

## GHL Voice AI Setup

### Custom Action 1: Fetch Menu

1. Go to GHL Voice AI dashboard
2. Create custom action
3. Configure:
   - **Method**: `GET`
   - **URL**: `https://tabit-worker.tony-578.workers.dev/catalog`
   - **Headers**: 
     - `X-API-Key`: `<your-proxy-api-key>` (if configured)
   - **Pre-execute message**: "Got it—checking the menu."

### Custom Action 2: Submit Order

1. Create custom action
2. Configure:
   - **Method**: `POST`
   - **URL**: `https://tabit-worker.tony-578.workers.dev/order`
   - **Headers**: 
     - `Content-Type`: `application/json`
     - `X-API-Key`: `<your-proxy-api-key>` (if configured)
   - **Body Variables**:
     - `ConsumerName` (String)
     - `Phone` (Phone Number)
     - `OrderType` (String) - "takeaway" or "delivery"
     - `PickupEta` (String) - ISO timestamp
     - `OrderNumber` (Integer)
     - `ExtId` (String)
     - `Items` (String) - JSON array string

## Local Development

```bash
# Start local dev server
wrangler dev

# Watch logs
wrangler tail
```

## Troubleshooting

### Check Worker Status

```bash
wrangler tail
```

### Test Diag Endpoint

```bash
# First enable DEBUG
wrangler secret put DEBUG
# Enter: true

# Then test
curl https://tabit-worker.tony-578.workers.dev/diag
```

### Common Issues

1. **"token mismatch"**: 
   - Run `/diag` to see token tails
   - Re-enter secrets (ensure no trailing spaces)
   
2. **401 Unauthorized**: 
   - Check `X-API-Key` header
   - Verify `PROXY_API_KEY` secret matches
   
3. **No callbacks**: 
   - Re-register webhooks
   - Check Worker logs in Cloudflare dashboard

## Next Steps

- Review [README.md](README.md) for full documentation
- Import [test.postman.json](test.postman.json) into Postman
- Test with actual GHL Voice AI integration
