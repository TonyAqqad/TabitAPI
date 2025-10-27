# GHL Workflow Integration for Tabit API

## Overview

Instead of using Custom Actions (which have limitations), we'll use **GHL Workflows** to:
1. Fetch menu data from Tabit via your Cloudflare Worker
2. Store menu in GHL Custom Fields
3. Voice AI accesses the stored menu data
4. Submit orders via workflow webhooks

This approach is **more reliable, faster, and properly supported** by GHL.

---

## Architecture

```
┌─────────────────┐
│  GHL Workflow   │
│  (Scheduled)    │
└────────┬────────┘
         │
         │ GET /catalog
         ↓
┌─────────────────────┐
│ Cloudflare Worker   │
│ tabit-worker        │
└────────┬────────────┘
         │
         │ GET /menu
         ↓
┌─────────────────┐
│   Tabit API     │
│   (Sandbox)     │
└─────────────────┘
         │
         ↓
┌─────────────────┐
│ GHL Custom      │
│ Field Storage   │
│ (menu_data)     │
└─────────────────┘
         │
         ↓
┌─────────────────┐
│  Voice AI       │
│  (reads field)  │
└─────────────────┘
```

---

## Step 1: Create Custom Field for Menu Storage

### In GHL Settings:

1. Go to **Settings** → **Custom Fields**
2. Click **"Add Custom Field"**
3. Configure:
   - **Field Name**: `menu_data`
   - **Field Type**: **Text Area** (large text)
   - **Object Type**: **Contact** or **Opportunity** (your choice)
   - **Description**: "Tabit menu data for Voice AI"
4. Click **Save**

---

## Step 2: Create Workflow to Fetch Menu

### Workflow Configuration:

1. Go to **Automation** → **Workflows**
2. Click **"Create Workflow"**
3. Name it: **"Fetch Tabit Menu"**

### Trigger Options:

Choose ONE of these trigger types:

#### Option A: Scheduled Trigger (Recommended)
- **Trigger**: Time-based
- **Schedule**: Daily at 6:00 AM (before business hours)
- **Why**: Menu updates once per day, fresh data

#### Option B: Webhook Trigger
- **Trigger**: Webhook
- **Copy webhook URL** (use this to manually refresh)
- **Why**: Refresh menu on-demand when needed

#### Option C: Conversation Start
- **Trigger**: Voice AI conversation started
- **Condition**: Only if menu_data is empty or older than 24 hours
- **Why**: Fetch menu when first needed

### Workflow Actions:

#### Action 1: HTTP Request - Fetch Menu

1. Click **"Add Action"**
2. Select **"HTTP Request"**
3. Configure:

```
Method: GET (or POST, both work)
URL: https://tabit-worker.tony-578.workers.dev/catalog

Headers:
  Accept: application/json
  X-API-Key: wqiuefdy8y18e

Response: 
  Save to custom field: menu_data
  Store as: JSON string
```

**Note**: Using `/catalog` gives you the **complete menu** with full structure (~269KB), perfect for storing once and accessing later.

4. **Test** the HTTP request (should return 200 OK)

#### Action 2: Update Custom Field

1. Click **"Add Action"**
2. Select **"Update Contact/Opportunity"**
3. Configure:
   - **Field**: `menu_data`
   - **Value**: `{{http_request_1.response}}`
   - **Timestamp**: Current date/time

5. Click **Save Workflow**
6. **Activate** the workflow

---

## Step 3: Configure Voice AI to Use Menu Data

### In Voice AI Settings:

1. Go to **Conversations AI** → **Voice AI**
2. Select your AI assistant
3. Go to **"Knowledge Base"** or **"Instructions"**

### Add to AI Prompt:

```
You are a restaurant assistant with access to the full menu.

Menu Data Access:
- The complete menu is stored in the custom field "menu_data"
- Always reference this field when asked about menu items
- The menu includes: item names, prices, descriptions, and categories

When a customer asks about the menu or specific items:
1. Read the menu_data field
2. Search for relevant items
3. Provide accurate information including prices
4. Suggest related items from the same category

Available menu categories: Appetizers, Salads, Handhelds, Flatbreads, Entree Bowls, Rolls and Folds, Sides, Desserts, Kids Menu

Example queries:
- "What appetizers do you have?" → Read menu_data, list Appetizers category
- "How much are chicken wings?" → Read menu_data, find "6 Chicken Wings" ($13.95)
- "Do you have salads?" → Read menu_data, list Salads category items
```

### Give AI Access to Custom Field:

4. Go to **"Advanced Settings"** → **"Custom Fields Access"**
5. Enable access to: `menu_data`
6. Save changes

---

## Step 4: Create Order Submission Workflow

### New Workflow: "Submit Tabit Order"

1. Create another workflow: **"Submit Tabit Order"**
2. **Trigger**: Webhook (or conversation event)

### Workflow Actions:

#### Action 1: HTTP Request - Submit Order

```
Method: POST
URL: https://tabit-worker.tony-578.workers.dev/order

Headers:
  Content-Type: application/json

Body (JSON):
{
  "ConsumerName": "{{contact.name}}",
  "Phone": "{{contact.phone}}",
  "OrderType": "takeaway",
  "OrderNumber": {{conversation.id}},
  "ExtId": "ghl_{{conversation.id}}",
  "Items": "{{order.items}}"
}
```

#### Action 2: Store Order Response

- Save response to custom field: `last_order_status`
- Log the order ID for tracking

---

## Step 5: Test the Integration

### Test Menu Fetch:

1. **Trigger the workflow** manually (or wait for schedule)
2. Go to a contact record
3. Check the `menu_data` custom field
4. Should contain JSON with menu items

### Test Voice AI:

1. **Call your Voice AI number**
2. Ask: "What's on the menu?"
3. AI should read from `menu_data` field
4. Should list categories or items

### Test Order Submission:

1. During conversation, place test order
2. Trigger order workflow
3. Check logs for successful submission
4. Verify order appears in Tabit (sandbox)

---

## Step 6: Register Tabit Webhooks (Optional)

To receive order status updates back from Tabit:

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

When Tabit sends updates, your worker can forward them to a GHL workflow webhook.

---

## Advanced: Menu Update Notifications

### Auto-refresh menu when Tabit updates:

1. Create GHL workflow: **"Receive Menu Update"**
2. **Trigger**: Webhook
3. Copy the webhook URL
4. Update worker to forward menu updates:

In Cloudflare, set environment variable:
```
FORWARD_STATUS_URL = <your-ghl-workflow-webhook-url>
```

When Tabit updates menu → Worker forwards → GHL workflow → Refreshes menu_data

---

## Benefits of This Approach

✅ **Reliable**: No custom action test failures  
✅ **Fast**: Menu cached in GHL, instant AI access  
✅ **Flexible**: Easy to modify/update workflows  
✅ **Scalable**: Can handle large menu data  
✅ **Debuggable**: See workflow logs for troubleshooting  
✅ **Cost-effective**: Fewer API calls to Tabit  
✅ **Proper**: Uses GHL features as intended  

---

## Troubleshooting

### Menu not updating:
- Check workflow is active
- Check HTTP request action succeeds
- Verify URL is correct: `https://tabit-worker.tony-578.workers.dev/catalog`
- Verify header: `X-API-Key: wqiuefdy8y18e`
- Test endpoint manually in browser (with API key header)

### AI can't see menu:
- Verify custom field access enabled
- Check prompt includes menu_data reference
- Ensure field has data (check contact record)

### Orders not submitting:
- Check order workflow trigger fires
- Verify Items format is correct JSON array
- Check worker logs in Cloudflare

---

## Next Steps

1. ✅ Create custom field `menu_data`
2. ✅ Create workflow "Fetch Tabit Menu" 
3. ✅ Configure Voice AI to read field
4. ✅ Test with real conversation
5. ✅ Create order submission workflow
6. ✅ Register Tabit webhooks (optional)

---

**Ready to implement? Let me know if you need help with any specific step!**

