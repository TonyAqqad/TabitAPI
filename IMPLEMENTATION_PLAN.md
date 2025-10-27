# Implementation Plan: Voice AI → GHL Workflows → Tabit POS

## Strategy Overview

**Voice AI:** Collects order verbally (NO API fetching needed)  
**GHL Workflows:** Submits order to Tabit after call completes  
**Cloudflare Worker:** Middleware that handles GHL → Tabit transformation  

This is MORE reliable than trying to force Custom Actions to fetch menu data.

---

## Phase 1: Update Cloudflare Worker

Create a `/submit-order` endpoint that receives GHL's order data and forwards to Tabit.

---

## Phase 2: GHL Configuration

### A. Set Up Custom Fields (Data Storage)

1. Go to Settings → Custom Fields → Add Custom Fields:

**Required Fields:**
- `order_items` (Text Area) - Stores "Item|Size|Qty|Mods" format
- `order_type` (Dropdown) - Options: Pickup, Delivery  
- `order_confirmed` (Checkbox) - Set to TRUE when customer confirms
- `order_status` (Dropdown) - Options: Pending, Submitted, Confirmed, Error
- `customer_total` (Currency) - Order total

**Optional Fields:**
- `delivery_address` (Text Area) - If delivery
- `delivery_notes` (Text) - Special instructions

---

### B. Configure Voice AI Agent

**Enable these custom fields for access**

**Add to Agent Instructions/Prompt:**
```
You are a friendly order-taking assistant for [Restaurant Name].

MENU (Hard-coded in prompt - use this since Custom Actions can't fetch menu):
[Paste your full menu here with items, descriptions, prices]

WHEN TAKING ORDERS:
1. Ask: "Will this be for pickup or delivery?"
2. Store response in custom_field.order_type
3. Collect items one at a time: "What would you like to order?"
4. Ask for: name, size, quantity, modifications
5. Store as: "ItemName|Size|Qty|Mods" in custom_field.order_items
6. Continue until customer says "that's all"
7. READ BACK ENTIRE ORDER
8. Ask: "Is everything correct?"
9. If YES, set custom_field.order_confirmed = TRUE

IMPORTANT: Only confirm order after explicit "yes" confirmation.
```

---

### C. Create Post-Call Workflow

**Workflow Name:** "Submit Order to Tabit POS"

**Trigger:**
- Event: Call Completed from Voice AI
- Filter: `custom_field.order_confirmed` equals TRUE

**Actions:**

1. **Custom Webhook** → Submit to Worker
   - URL: `https://api.khashokausa.info/submit-order`
   - Method: POST
   - Headers: `Content-Type: application/json`
   - Body:
   ```json
   {
     "order_items": "{{custom_field.order_items}}",
     "order_type": "{{custom_field.order_type}}",
     "customer_name": "{{contact.full_name}}",
     "customer_phone": "{{contact.phone}}",
     "delivery_address": "{{custom_field.delivery_address}}",
     "delivery_notes": "{{custom_field.delivery_notes}}",
     "order_total": "{{custom_field.customer_total}}"
   }
   ```

2. **Check Response** → If status = 200

3. **Update Contact**
   - Set: `custom_field.order_status` = "submitted"

4. **Send SMS** → Confirmation to customer

5. **Add Tag** → "order_submitted"

---

## Next Step: Update Worker

I'll add the `/submit-order` endpoint to your Worker that:
1. Receives GHL's order data
2. Transforms to Tabit format  
3. Submits to Tabit
4. Returns success/error to GHL

Ready to proceed with Worker updates?

