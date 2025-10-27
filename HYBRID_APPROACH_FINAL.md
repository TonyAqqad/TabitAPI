# 🎯 Hybrid Approach: Custom Actions + Workflows

## Strategy Overview

Use **Custom Actions** to fetch menu data during calls, but use **Workflows** for order submission (more reliable).

---

## Part 1: Custom Action for Menu Data

### Configuration in GHL

**Action Name:** "Fetch Menu from Tabit"

**Method:** GET

**URL:** `https://us-demo-middleware.tabit-stage.com/menu`

**Headers:**
```
organization-token: 217f096507444e7cbbbf9a40ed61e5f6
integrator-token: bcd1af29b23b40f4b642bb9c554b9b1f
```

**When to Execute:**
```
When the caller asks:
- "What's on the menu?"
- "Show me what you have"
- "What do you sell?"
- "I want to see options"
```

**What to Say Before Executing:**
```
"Let me grab our current menu for you..."
```

---

### Voice AI Prompt with Menu Data

**Important:** Update your Voice AI agent's system prompt to include menu items! 

```
You are a friendly order-taking assistant for Khashoka Restaurant.

# MENU ITEMS
[This will be populated by the Custom Action when user asks about menu]

When a customer asks "What do you have?" or "Show me the menu":
1. Trigger the "Fetch Menu from Tabit" custom action
2. Wait for response
3. Read back items from results[].children[].name with descriptions and prices

IMPORTANT MENU FORMAT (what you'll receive from the API):
- results[] - contains all menu categories
- Each category has results[].children[] - actual menu items
- Items have: name, description, price, groups[] (for sizes/options)

Example response format:
"Our menu includes:
- {results[].children[].name} - {results[].children[].description} - ${results[].children[].price}"

Sizes and options:
- results[].children[].groups[] contains size/option groups
- results[].children[].groups[].members[] contains available choices
- Ask customer to select from available groups when ordering

WHEN TAKING ORDERS:
1. Confirm item name
2. Ask for size (if groups exist)
3. Ask for quantity
4. Ask for modifications (additional groups)
5. Repeat until customer says "that's all"
6. Confirm pickup/delivery
7. For delivery, collect address
8. Confirm total order
```

---

## Part 2: Workflow for Order Submission

This is MORE RELIABLE than Custom Actions for order submission.

### Step 1: Create Custom Fields in GHL

Go to **Settings → Custom Fields** and add:

1. **`order_items`** (Text Area, Long)
   - Store: "ItemName|Size|Qty|Mods;ItemName2|Size|Qty|Mods"

2. **`order_type`** (Dropdown: Pickup, Delivery)

3. **`order_confirmed`** (Checkbox)

4. **`order_status`** (Dropdown: Pending, Submitted, Error)

5. **`customer_total`** (Currency)

6. **`delivery_address`** (Text Area) 

7. **`delivery_notes`** (Text)

---

### Step 2: Configure Voice AI Agent

**Voice AI Agent Instructions:**

```
You are a friendly order-taking assistant for Khashoka Restaurant.

## ORDERING FLOW

1. GREETING: "Hi! Welcome to Khashoka. Will this be for pickup or delivery?"
   - Store response in: order_type

2. COLLECT ITEMS:
   For each item customer wants:
   - "What would you like?"
   - Store: item_name
   - "What size?" (if applicable - from groups[].name)
   - Store: size
   - "How many?"
   - Store: quantity
   - "Any modifications?"
   - Store: modifications
   
   Format as: item_name|size|qty|mods
   Add to order_items (append, separate by semicolon)

3. CONTINUE until customer says "that's all" or "that's everything"

4. READ BACK:
   "Let me confirm your order:
   - 2x Large Chicken Wings with Mix and Ranch Dip
   - 1x Caesar Salad
   Total: $24.98
   
   Is that correct?"

5. IF YES:
   - Set order_confirmed = TRUE
   - "Perfect! Your order is being processed. You'll receive confirmation shortly."

6. IF NO:
   - "Let me fix that. What would you like to change?"
   - Adjust and repeat step 4

7. FOR DELIVERY:
   - "What's your delivery address?"
   - Store in: delivery_address
   - "Any special delivery instructions?"
   - Store in: delivery_notes

## STORE DATA IN THESE CUSTOM FIELDS:
- order_items: Concatenated string of all items
- order_type: pickup or delivery
- order_confirmed: true/false
- delivery_address: (only for delivery)
- delivery_notes: (optional)
- customer_total: Calculate from items
```

---

### Step 3: Create GHL Workflow

**Workflow Name:** "Submit Order to Tabit"

**Trigger:**
- Event: Call Completed
- Condition: `{{custom_field.order_confirmed}}` = TRUE

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
- **Enable:** "Save Response" (to get order_id)

#### Action 2: Conditional Logic

**IF** `{{response.status}}` = 200:

1. Update Contact → Set `order_status` = "Submitted"
2. Send SMS:
   ```
   Hi {{contact.first_name}}! Your order #{{response.body.order_id}} has been submitted. You'll receive confirmation shortly.
   ```
3. Add Tag: "order_submitted"

**IF** `{{response.status}}` ≠ 200:

1. Update Contact → Set `order_status` = "Error"
2. Create Internal Task:
   ```
   Order failed for {{contact.full_name}}. Error: {{response.body}}
   Assign to: [Your Team]
   ```
3. Send SMS:
   ```
   We're experiencing an issue with your order. Our team will contact you shortly.
   ```

---

## Part 3: Update Cloudflare Worker

The `/submit-order` endpoint is already deployed! ✅

**Endpoint:** `https://api.khashokausa.info/submit-order`

**No API key required** (for Workflow compatibility)

**Expected Payload:**
```json
{
  "order_items": "Burger|Large|2|Extra Cheese;Fries|Regular|1",
  "order_type": "pickup",
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "delivery_address": "",
  "delivery_notes": "",
  "order_total": "25.98"
}
```

**Response:**
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
┌─────────────────────────────────────────┐
│  Customer Calls GHL Voice AI           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Agent: "Will this be pickup/delivery?" │
│  Store in: order_type                   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Customer: "I want chicken wings"    │
│  Agent triggers: Fetch Menu action    │
│  Reads: results[].children[].name     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Agent collects:                       │
│  - Item: Chicken Wings                  │
│  - Size: Large (from groups[])          │
│  - Qty: 2                               │
│  - Mods: Mix + Ranch (from groups[])    │
│  Store as: Chicken Wings|Large|2|Mix+Ranch│
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Continue until "that's all"           │
│  Read back order                        │
│  Set: order_confirmed = TRUE            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Call Ends                              │
│  Workflow Triggered                     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  HTTP POST to Worker                    │
│  URL: /submit-order                    │
│  Payload: order_items, type, etc.     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Worker transforms to Tabit format     │
│  Submits to Tabit API                  │
│  Returns: {success: true, order_id}    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  GHL receives response                  │
│  Updates order_status = "Submitted"    │
│  Sends SMS to customer                  │
└─────────────────────────────────────────┘
```

---

## Key Benefits of This Approach

✅ **Custom Action** → Dynamic menu data during calls  
✅ **Workflow** → Reliable order submission (no test button issues)  
✅ **Worker** → Handles transformation & forwarding  
✅ **Tabit** → Receives formatted orders  

---

## Next Steps

1. ✅ Worker is deployed with `/submit-order` endpoint
2. ⏳ Configure Custom Action in GHL (use Tabit sandbox URL directly)
3. ⏳ Create custom fields in GHL
4. ⏳ Update Voice AI agent prompt
5. ⏳ Create GHL Workflow for order submission
6. ⏳ Test with a real call

Ready to start! 🚀

