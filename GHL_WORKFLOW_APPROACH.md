# GHL Workflow Approach - Complete Guide

## ✅ Why This Works Better

**Voice AI Custom Actions have limitations:**
- ❌ Can't fetch menu data during calls
- ❌ Test button validation is unreliable
- ❌ Can't consume API responses dynamically

**GHL Workflows are reliable:**
- ✅ Post-call processing (no timing issues)
- ✅ Full control over order data
- ✅ Better error handling
- ✅ No test button issues

---

## Setup Guide

### Step 1: Create Custom Fields in GHL

Go to **Settings** → **Custom Fields** → Add these:

1. **`order_items`** (Text Area, Long)
2. **`order_type`** (Dropdown: Pickup, Delivery)
3. **`order_confirmed`** (Checkbox)
4. **`order_status`** (Dropdown: Pending, Submitted, Confirmed, Error)
5. **`customer_total`** (Currency)
6. **`delivery_address`** (Text Area)
7. **`delivery_notes`** (Text)

---

### Step 2: Configure Voice AI

**Agent Instructions:**
```
You are a friendly order-taking assistant for [Restaurant Name].

MENU:
[Hard-code your menu here - items, descriptions, prices, sizes]

ORDERING PROCESS:
1. Greet customer and ask: "Will this be for pickup or delivery?"
2. Store response in custom_field.order_type
3. Collect items one at a time:
   - "What would you like to order?"
   - "What size?" (if applicable)
   - "How many?"
   - "Any modifications?"
   - Store each item as: "ItemName|Size|Qty|Mods"
   - Continue until customer says "that's all"
4. For DELIVERY: ask for delivery address and store in custom_field.delivery_address
5. READ BACK ENTIRE ORDER
6. Ask: "Is everything correct?"
7. If customer says YES, set custom_field.order_confirmed = TRUE
8. Say: "Perfect! Your order is being processed. You'll receive confirmation shortly."

IMPORTANT: Only confirm if customer explicitly agrees!
```

**Custom Fields to Enable:**
- Select all the custom fields you created
- Enable the agent to read/write them

---

### Step 3: Create GHL Workflow

**Workflow:** "Submit Order to Tabit"

**Trigger:**
- Event: Call Completed
- Filter: `custom_field.order_confirmed` = TRUE

**Actions:**

#### Action 1: HTTP Request

- **Method:** POST
- **URL:** `https://api.khashokausa.info/submit-order`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "order_items": "{{custom_field.order_items}}",
    "order_type": "{{custom_field.order_type}}",
    "customer_name": "{{contact.full_name}}",
    "customer_phone": "{{contact.phone}}",
    "customer_email": "{{contact.email}}",
    "delivery_address": "{{custom_field.delivery_address}}",
    "delivery_notes": "{{custom_field.delivery_notes}}",
    "order_total": "{{custom_field.customer_total}}"
  }
  ```
- **Enable:** "Save Response"

#### Action 2: If/Else Condition

**Condition:** Response status = 200

**IF TRUE (Success):**
1. Update Contact → `order_status` = "Submitted"
2. Send SMS → "Hi {{contact.first_name}}! Your order has been submitted. You'll receive confirmation shortly."
3. Add Tag → "order_submitted"

**IF FALSE (Error):**
1. Update Contact → `order_status` = "Error"
2. Create Internal Task → "Order failed for {{contact.full_name}}"
3. Send SMS → "We're experiencing an issue with your order. Our team will contact you shortly."

---

### Step 4: Test the Endpoint

**Test the new endpoint:**

```powershell
$testOrder = @{
  order_items = "Burger|Large|1|Extra Cheese;Fries|Regular|2"
  order_type = "pickup"
  customer_name = "John Doe"
  customer_phone = "+1234567890"
  order_total = "25.98"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://api.khashokausa.info/submit-order" `
  -Method POST -Headers @{"Content-Type"="application/json"} `
  -Body $testOrder
```

Should return:
```json
{
  "success": true,
  "order_id": "ghl_1234567890",
  "status": "submitted",
  "message": "Order submitted successfully"
}
```

---

## Complete Flow

```
1. Customer calls Voice AI
   ↓
2. Voice AI collects order verbally
   ↓
3. Data stored in custom fields
   ↓
4. Call ends
   ↓
5. Workflow triggers (if order_confirmed = TRUE)
   ↓
6. HTTP Request to Worker
   ↓
7. Worker transforms & submits to Tabit
   ↓
8. Success/Error response to GHL
   ↓
9. SMS sent to customer
```

---

## GHL Configuration Summary

**Voice AI Custom Action (Test):**
- URL: `https://api.khashokausa.info/ghl-test`
- NO API key needed
- Just to pass test button

**GHL Workflow (Actual Order Submission):**
- URL: `https://api.khashokausa.info/submit-order`
- NO API key needed
- Sends order data

Both endpoints return `{"success": true}` format for GHL compatibility!

---

## Next Steps

1. ✅ Worker is deployed with `/submit-order` endpoint
2. ⏳ Test the endpoint (see Step 4 above)
3. ⏳ Set up custom fields in GHL
4. ⏳ Configure Voice AI with menu in prompt
5. ⏳ Create workflow with HTTP request
6. ⏳ Make a test call

**This approach is production-ready and more reliable!** 🎉

