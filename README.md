# Tabit API Proxy for GHL Voice AI

Cloudflare Worker that proxies requests from GHL Voice AI Custom Actions to Tabit's demo middleware, with optional API key protection and webhook forwarding.

## Features

- **Menu Caching**: 10-minute in-memory cache for Tabit menu data
- **Optional API Key Protection**: Secure catalog and order endpoints
- **Webhook Support**: Receives and forwards order status updates
- **CORS Enabled**: Works with browser-based GHL Voice AI
- **Debug Endpoint**: Token validation helper (DEBUG mode)

## Environment Variables

Configure these in Cloudflare Dashboard → Workers & Pages → Your Worker → Settings → Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `TABIT_INTEGRATOR_TOKEN` | ✅ Yes | Tabit integrator token (see CREDENTIALS.md) |
| `TABIT_ORG_TOKEN` | ✅ Yes | Tabit organization token (see CREDENTIALS.md) |
| `PROXY_API_KEY` | ❌ No | Optional API key for authentication |
| `FORWARD_STATUS_URL` | ❌ No | URL to forward order-status webhooks to |
| `DEBUG` | ❌ No | Set to `"true"` to enable `/diag` endpoint |

⚠️ **Important**: 
- Always `.trim()` values to avoid "token mismatch" errors from hidden whitespace.
- Sandbox credentials are in `CREDENTIALS.md` (already in `.gitignore`)

## Routes

### GET /health
Returns health status.

### GET /catalog
Proxies Tabit menu request with 10-minute caching.

**Headers**: `X-API-Key: <PROXY_API_KEY>` (if configured)

### POST /order
Accepts GHL flat field format, transforms to Tabit payload format.

**Headers**: 
- `Content-Type: application/json`
- `X-API-Key: <PROXY_API_KEY>` (if configured)

**Body** (flat fields):
```json
{
  "ConsumerName": "John Doe",
  "Phone": "+15551234567",
  "OrderType": "takeaway",
  "PickupEta": "2025-11-05T17:15:00Z",
  "OrderNumber": 12345,
  "ExtId": "ext_12345",
  "Items": "[{\"id\":\"2361\",\"name\":\"6 Chicken Wings\",\"count\":1,\"options\":[...]}]"
}
```

### POST /webhooks/tabit/menu-update
Invalidates menu cache when Tabit sends menu updates.

### POST /webhooks/tabit/order-status
Receives order status updates from Tabit. Optionally forwards to `FORWARD_STATUS_URL`.

### GET /diag
Returns last 4 chars of tokens for troubleshooting. Only enabled when `DEBUG="true"`.

## Deploy

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Deploy
wrangler deploy
```

## Configure Secrets

```bash
wrangler secret put TABIT_INTEGRATOR_TOKEN
wrangler secret put TABIT_ORG_TOKEN
wrangler secret put PROXY_API_KEY  # optional
wrangler secret put FORWARD_STATUS_URL  # optional
```

## GHL Voice AI Custom Action Configuration

### A) Fetch Menu (via Proxy)

**Method**: `GET`  
**URL**: `https://<your-worker>.workers.dev/catalog`  
**Headers**:
```
X-API-Key: <PROXY_API_KEY>
Accept: application/json
```
**Parameters**: None  
**What to say before executing**: "Got it—checking the menu."

---

### B) Submit Order (via Proxy)

**Method**: `POST`  
**URL**: `https://<your-worker>.workers.dev/order`  
**Headers**:
```
Content-Type: application/json
X-API-Key: <PROXY_API_KEY>
```
**Parameters/Variables** (flat fields):

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `ConsumerName` | String | Customer name | "John Doe" |
| `Phone` | Phone Number | Customer phone | "+15551234567" |
| `OrderType` | String | Order type | "takeaway" or "delivery" |
| `PickupEta` | String | ISO timestamp | "2025-11-05T17:15:00Z" |
| `OrderNumber` | Integer | Order number | `12345` |
| `ExtId` | String | External ID | "ext_20251027_001" |
| `Items` | String | JSON array | See example below |

**Items Format** (must be JSON array string):
```json
[
  {
    "id": "2361",
    "name": "6 Chicken Wings",
    "count": 1,
    "options": [
      {
        "id": "68e7b82e893d90398a570415",
        "name": "Serving/Prep",
        "value_id": "68e7b82e893d90398a570417",
        "value": "Mix",
        "count": 1
      },
      {
        "id": "68e7b82e893d90398a570419",
        "name": "Dip",
        "value_id": "68e7b82e893d90398a57041a",
        "value": "Ranch Dip",
        "count": 1
      }
    ]
  }
]
```

## Webhook Registration

Register webhooks with Tabit (run locally, NOT in Worker):

**Endpoint**: `PUT https://us-demo-middleware.tabit-stage.com/third-party/me`

**Headers**:
```
integrator-token: <TABIT_INTEGRATOR_TOKEN>
organization-token: <TABIT_ORG_TOKEN>
Content-Type: application/json
```

**Body**:
```json
{
  "callbackWebhook": "https://<your-worker>.workers.dev/webhooks/tabit/order-status",
  "menuWebhook": "https://<your-worker>.workers.dev/webhooks/tabit/menu-update"
}
```

### PowerShell Example

```powershell
$headers = @{
    "integrator-token" = "<TABIT_INTEGRATOR_TOKEN>"
    "organization-token" = "<TABIT_ORG_TOKEN>"
    "Content-Type" = "application/json"
}

$body = @{
    callbackWebhook = "https://your-worker.workers.dev/webhooks/tabit/order-status"
    menuWebhook = "https://your-worker.workers.dev/webhooks/tabit/menu-update"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://us-demo-middleware.tabit-stage.com/third-party/me" -Method PUT -Headers $headers -Body $body
```

### Bash Example

```bash
curl -X PUT "https://us-demo-middleware.tabit-stage.com/third-party/me" \
  -H "integrator-token: <TABIT_INTEGRATOR_TOKEN>" \
  -H "organization-token: <TABIT_ORG_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "callbackWebhook": "https://your-worker.workers.dev/webhooks/tabit/order-status",
    "menuWebhook": "https://your-worker.workers.dev/webhooks/tabit/menu-update"
  }'
```

### Postman

1. Create a new request
2. Method: `PUT`
3. URL: `https://us-demo-middleware.tabit-stage.com/third-party/me`
4. Headers:
   - `integrator-token`: `<your-token>`
   - `organization-token`: `<your-token>`
   - `Content-Type`: `application/json`
5. Body (raw JSON):
   ```json
   {
     "callbackWebhook": "https://your-worker.workers.dev/webhooks/tabit/order-status",
     "menuWebhook": "https://your-worker.workers.dev/webhooks/tabit/menu-update"
   }
   ```

## Test Plan

### 1. Health Check
```bash
curl https://<worker>/health
```
Expected: `{"status":"healthy"}`

### 2. Catalog (Proxy Direct)
```bash
curl https://<worker>/catalog -H "X-API-Key: <key>"
```
Expected: JSON array with `type: "menu"` nodes

### 3. Order (Proxy Direct)
```bash
curl -X POST https://<worker>/order \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <key>" \
  -d '{
    "ConsumerName": "Test User",
    "Phone": "+15551234567",
    "OrderType": "takeaway",
    "OrderNumber": 12345,
    "ExtId": "ext_test_001",
    "Items": "[{\"id\":\"2361\",\"name\":\"Wings\",\"count\":1}]"
  }'
```
Expected: `2xx` ACK or meaningful `4xx`

### 4. GHL → Proxy
Test Custom Actions in GHL Voice AI dashboard.

### 5. Callback Reception
Place test order, check Worker logs for POST to `/webhooks/tabit/order-status`.

## Troubleshooting

### "token mismatch" Error

**Cause**: Wrong env var values or trailing whitespace.

**Solution**:
1. Check `/diag` endpoint (requires `DEBUG=true`):
   ```bash
   curl https://<worker>/diag
   ```
2. Verify token lengths and last 4 chars
3. Re-enter values in Cloudflare dashboard (ensure no trailing spaces)
4. Redeploy worker

### 401 Unauthorized from Worker

**Cause**: Missing or invalid `X-API-Key`.

**Solution**: 
- Ensure `PROXY_API_KEY` is set in Worker env vars
- Include `X-API-Key` header in requests
- Verify key value matches exactly (case-sensitive)

### "Endpoint not exists!" from Tabit

**Cause**: Called Tabit directly without headers or headers are missing.

**Solution**: Always go through proxy or include `integrator-token` and `organization-token` headers.

### 400 from Tabit

**Cause**: Wrong Items JSON, missing required groups, or invalid member ids.

**Solution**:
- Ensure Items is a valid JSON array
- Include required option groups for menu items
- Verify `id` and `value_id` match Tabit menu structure

### No Callbacks Received

**Cause**: Webhooks not registered or wrong URLs.

**Solution**:
1. Re-PUT `/third-party/me` with actual worker URLs (no placeholders)
2. Verify Worker has the webhook routes deployed
3. Check Worker logs in Cloudflare dashboard

## Stretch Goals

These features are not yet implemented but could be added:

- `/nlu/resolve-offer` - Resolve caller utterances to menu items
- Rate limiting per IP
- Server-side validation of required groups
- Minimal metrics aggregation

## Code Quality

- ✅ Clean, commented, production-ready
- ✅ No secrets in repo (env vars only)
- ✅ Minimal dependencies (pure Worker APIs)
- ✅ Comprehensive error handling
- ✅ Masked logging (no tokens exposed)

## License

MIT
