# Project Structure

```
tabit-api-proxy/
├── worker.js              # Main Cloudflare Worker code
├── wrangler.toml          # Cloudflare deployment config
├── package.json           # Dependencies and scripts
├── .gitignore             # Git ignore rules
├── README.md              # Full documentation
├── QUICKSTART.md          # Quick start guide
├── PROJECT_STRUCTURE.md   # This file
├── test.postman.json      # Postman collection for testing
└── .cursor/
    └── rules/
        └── agentrules.mdc # Cursor AI rules
```

## File Descriptions

### worker.js
Main Cloudflare Worker implementation with:
- Route handlers for all endpoints
- Menu caching (10-minute TTL)
- API key validation
- CORS support
- Webhook forwarding
- Error handling and logging

### wrangler.toml
Cloudflare Worker configuration:
- Worker name
- Compatibility date
- Environment configurations (production/staging)

### package.json
Project metadata and npm scripts:
- Dependencies (wrangler)
- Deploy scripts
- Secret management shortcuts

### README.md
Comprehensive documentation including:
- Feature overview
- Environment variables
- Route specifications
- GHL Voice AI configs
- Webhook registration
- Test plan
- Troubleshooting guide

### QUICKSTART.md
Fast-track setup guide for getting started in 5 minutes

### test.postman.json
Postman collection with:
- All endpoint requests
- Example payloads
- Environment variables

## Environment Variables

Secrets are managed via Cloudflare Dashboard or Wrangler CLI:

| Secret | Description |
|--------|-------------|
| `TABIT_INTEGRATOR_TOKEN` | Tabit integrator token |
| `TABIT_ORG_TOKEN` | Tabit organization token |
| `PROXY_API_KEY` | Optional API key |
| `FORWARD_STATUS_URL` | Optional webhook forward URL |
| `DEBUG` | Enable debug endpoint |

## Deployment

```bash
# Development
npm run dev

# Deploy to production
npm run deploy

# Deploy to staging
npm run deploy:staging

# Watch logs
npm run tail

# Set secrets
npm run secret:integrator
npm run secret:org
npm run secret:apikey
```

## Testing

Import `test.postman.json` into Postman or use curl:

```bash
# Health
curl https://your-worker.workers.dev/health

# Catalog
curl https://your-worker.workers.dev/catalog \
  -H "X-API-Key: your-key"
```

## Architecture

```
GHL Voice AI → Worker Proxy → Tabit Demo API
                      ↓
              (Optional) Forward
                      ↓
              Custom Callback URL
```

Key features:
- ✅ API key protection (optional)
- ✅ Menu caching (10min TTL)
- ✅ Webhook forwarding
- ✅ CORS enabled
- ✅ Error handling
- ✅ Masked logging
