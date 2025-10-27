# 🚀 GHL-Tabit Integration Setup Checklist

## ✅ Completed

- [x] Cloudflare Worker deployed with `/submit-order` endpoint
- [x] Custom domain configured (`api.khashokausa.info`)
- [x] Worker returns `{"success": true}` format for GHL compatibility
- [x] Worker transforms GHL orders to Tabit format
- [x] Tabit sandbox credentials obtained
- [x] Testing endpoints configured

---

## ⏳ To Do

### Phase 1: GHL Custom Action Setup (30 min)

#### Step 1: Configure Menu Fetch Custom Action
- [ ] Go to GHL → Voice AI → Custom Actions
- [ ] Click "Create Custom Action"
- [ ] **Action Name:** "Fetch Menu"
- [ ] **Method:** GET
- [ ] **URL:** `https://us-demo-middleware.tabit-stage.com/menu`
- [ ] **Headers:**
  - Key: `organization-token`, Value: `217f096507444e7cbbbf9a40ed61e5f6`
  - Key: `integrator-token`, Value: `bcd1af29b23b40f4b642bb9c554b9b1f`
- [ ] **When to Execute:** "When caller asks about menu items or wants to see options"
- [ ] **What to Say:** "Let me grab our current menu for you..."
- [ ] Click **"Test Webhook"** → Should show "Status: Success" ✅
- [ ] Save

#### Step 2: Verify Response Fields
- [ ] Scroll down to "These are the fields you can use from the API response"
- [ ] Verify fields are visible:
  - `results[]`
  - `results[].children[]`
  - `results[].children[].name`
  - `results[].children[].price`
  - etc.
- [ ] Select any fields you want to use
- [ ] Save

---

### Phase 2: Create Custom Fields (10 min)

- [ ] Go to **Settings → Custom Fields**
- [ ] Create field: **`order_items`** (Text Area, Long)
- [ ] Create field: **`order_type`** (Dropdown: Pickup, Delivery)
- [ ] Create field: **`order_confirmed`** (Checkbox)
- [ ] Create field: **`order_status`** (Dropdown: Pending, Submitted, Error)
- [ ] Create field: **`customer_total`** (Currency)
- [ ] Create field: **`delivery_address`** (Text Area)
- [ ] Create field: **`delivery_notes`** (Text)

---

### Phase 3: Update Voice AI Agent (15 min)

- [ ] Go to **Voice AI → Your Agent → Settings**
- [ ] Paste the agent instructions from `HYBRID_APPROACH_FINAL.md`
- [ ] Enable all custom fields for Voice AI access
- [ ] Save

**Key Instructions for Agent:**
- Ask: "Will this be for pickup or delivery?" → Store in `order_type`
- Collect items: "What would you like?" → Store name, size, qty, mods
- Format: `item_name|size|qty|mods` (separate items with semicolons)
- Read back order: "Your order is: [items], total: $X. Is that correct?"
- If YES → Set `order_confirmed` = TRUE
- For DELIVERY → Ask for `delivery_address` and `delivery_notes`

---

### Phase 4: Create GHL Workflow (20 min)

- [ ] Go to **Automation → Workflows → Create Workflow**
- [ ] **Name:** "Submit Order to Tabit"

#### Trigger Configuration
- [ ] Event: **Call Completed**
- [ ] Filter: **`custom_field.order_confirmed`** = TRUE

#### Action 1: HTTP Request
- [ ] Click **"+ Add Action" → HTTP Request**
- [ ] **Method:** POST
- [ ] **URL:** `https://api.khashokausa.info/submit-order`
- [ ] **Headers:**
  ```
  Content-Type: application/json
  ```
- [ ] **Body:**
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
- [ ] Enable **"Save Response"**
- [ ] Save

#### Action 2: Conditional Logic
- [ ] Click **"+ Add Action" → If/Else**

**IF Success (Status = 200):**
1. Update Contact → Set `order_status` = "Submitted"
2. Send SMS:
   ```
   Hi {{contact.first_name}}! Your order #{{response.body.order_id}} has been submitted. You'll receive confirmation shortly.
   ```
3. Add Tag: **"order_submitted"**

**IF Error (Status ≠ 200):**
1. Update Contact → Set `order_status` = "Error"
2. Create Internal Task:
   ```
   Order failed for {{contact.full_name}}. Error: {{response.body}}
   ```
3. Send SMS:
   ```
   We're experiencing an issue with your order. Our team will contact you shortly.
   ```

- [ ] Save workflow

---

### Phase 5: Testing (30 min)

#### Test 1: Custom Action (Menu Fetch)
- [ ] Make a test call to your Voice AI number
- [ ] Say: "What do you have on the menu?"
- [ ] Verify agent says: "Let me grab our current menu for you..."
- [ ] Verify agent reads menu items from Tabit
- [ ] ✅ Pass

#### Test 2: Order Collection
- [ ] Make another test call
- [ ] Say: "I want pickup"
- [ ] Order: "2 Large Chicken Wings"
- [ ] When prompted, confirm order
- [ ] Hang up
- [ ] Go to Contact → Check custom fields
- [ ] Verify: `order_type` = "pickup"
- [ ] Verify: `order_items` contains data
- [ ] Verify: `order_confirmed` = TRUE
- [ ] ✅ Pass

#### Test 3: Workflow Execution
- [ ] After test call ends, check Cloudflare Worker logs
- [ ] Verify POST request to `/submit-order`
- [ ] Verify response: `{"success": true, "order_id": "..."}`
- [ ] Check contact's `order_status` = "Submitted"
- [ ] Check if SMS was sent
- [ ] ✅ Pass

#### Test 4: Full Integration
- [ ] Make a REAL order call
- [ ] Place actual order (pickup)
- [ ] Confirm order
- [ ] Verify workflow executed
- [ ] Check Tabit dashboard for order
- [ ] ✅ Complete!

---

## 🎉 Success Criteria

- [ ] Custom Action returns menu data during calls
- [ ] Voice AI can access menu information
- [ ] Orders are collected with all details
- [ ] Workflow triggers after confirmed orders
- [ ] Orders are submitted to Tabit successfully
- [ ] Customer receives SMS confirmation
- [ ] Tabit receives formatted order

---

## 📚 Reference Files

- `HYBRID_APPROACH_FINAL.md` - Complete implementation guide
- `GHL_DIRECT_TABIT_CONFIG.md` - Tabit sandbox configuration
- `GHL_WORKING_CONFIG.md` - Worker configuration details
- `GHL_TEST_ENDPOINTS.md` - Testing endpoints guide

---

## 🆘 Troubleshooting

**Custom Action shows "Failed":**
→ Use Tabit sandbox URL directly (it works there)

**Workflow doesn't trigger:**
→ Check that `order_confirmed` is set to TRUE
→ Check filter condition in workflow

**Order not reaching Tabit:**
→ Check Cloudflare Worker logs
→ Verify API credentials in Worker
→ Check Tabit dashboard for incoming orders

**SMS not sending:**
→ Verify workflow SMS action is configured
→ Check GHL SMS credits

---

**Estimated Total Time:** 2 hours for complete setup  
**Ready to start?** Begin with Phase 1! 🚀

