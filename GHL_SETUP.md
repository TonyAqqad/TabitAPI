# GHL Voice AI - Tabit Integration Setup

## ✅ Ready to Use Endpoints

Your Cloudflare Worker is deployed and ready!

**Base URL**: `https://tabit-worker.tony-578.workers.dev`

### Endpoints

| Endpoint | Method | Description | Size |
|----------|--------|-------------|------|
| `/menu-summary` | GET | Lightweight menu (for GHL) | ~8KB |
| `/catalog` | GET | Full menu (if needed) | ~270KB |
| `/order` | POST | Submit orders | N/A |
| `/health` | GET | Health check | <1KB |

---

## GHL Custom Action 1: Get Menu

### Configuration

```
Action Name: Get Menu

When to execute: 
When the caller mentions items directly and the agent needs menu data to resolve names/options in the background.

What to say before executing: 
Got it—checking the menu.

API Details:
- Method: GET
- URL: https://tabit-worker.tony-578.workers.dev/menu-summary

Headers (click "+ Add Header"):
- Accept: application/json

Parameters/Variables: (leave empty)

Authentication Needed: OFF
```

### Test It

1. Click "Save" (test will work now!)
2. Click "Test" - should return status 200 ✅
3. Make a test call to your GHL number
4. Say: "What's on the menu?" or "What items do you have?"
5. AI should trigger the custom action and get menu data

---

## GHL Custom Action 2: Submit Order (Coming Next)

This will be a POST request with body parameters. Let me know when you want to set this up!

---

## Webhook Registration

Register with Tabit so they can send order status updates:

```powershell
$headers = @{
    "integrator-token" = "bcd1af29b23b40f4b642bb9c554b9b1f"
    "organization-token" = "217f096507444e7cbbbf9a40ed61e5f6"
    "Content-Type" = "application/json"
}

$body = @{
    callbackWebhook = "https://tabit-worker.tony-578.workers.dev/webhooks/tabit/order-status"
    menuWebhook = "https://tabit-worker.tony-578.workers.dev/webhooks/tabit/menu-update"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://us-demo-middleware.tabit-stage.com/third-party/me" `
    -Method PUT -Headers $headers -Body $body
```

---

## Testing Checklist

- [ ] Menu summary endpoint works in GHL test
- [ ] Saved custom action successfully
- [ ] Made test call to GHL Voice AI
- [ ] AI received menu data
- [ ] AI can answer questions about menu items
- [ ] Webhooks registered with Tabit
- [ ] Test order submission (coming next)

---

**Next Step**: Use `/menu-summary` in your GHL custom action. It will pass the test now!

