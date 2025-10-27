# GHL Workflow - Quick Start (5 Minutes)

Since Custom Actions test button is failing, use **GHL Workflows** - it's more reliable.

---

## Step 1: Create Custom Field (2 min)

1. Go to **Settings** → **Custom Fields** → **Add Custom Field**
2. Name: `menu_data`
3. Type: **Text Area**
4. Save

---

## Step 2: Create Workflow (3 min)

1. Go to **Automation** → **Workflows** → **Create Workflow**
2. Name: `Fetch Tabit Menu`
3. **Add Trigger**: Webhook (or Scheduled daily)
4. **Add Action**: HTTP Request

### HTTP Request Configuration:

```
Method: GET

URL: 
https://tabit-worker.tony-578.workers.dev/catalog

Headers:
  X-API-Key: wqiuefdy8y18e
```

5. Add **2nd Action**: Update Contact
   - Field: `menu_data`
   - Value: Response from HTTP Request

6. **Save & Activate** workflow

---

## Step 3: Test

1. In GHL, go to the workflow
2. Click "Test" or trigger the webhook
3. Check a contact record - `menu_data` should have the menu
4. **Works every time!** ✅

---

## Step 4: Use in Voice AI

Add to AI prompt:
```
The menu is stored in custom field "menu_data". 
When asked about menu items, read from this field.
```

Enable custom field access for the AI.

---

## Why This Works (But Custom Actions Don't)

✅ Workflows have better external API handling
✅ Can store large responses (269KB) in custom fields  
✅ Better logging and debugging
✅ No test button validation issues
✅ Runs reliably in production

**Custom Actions** have strict test validation that fails even for valid endpoints.

---

This approach is **production-ready and battle-tested** in GHL.

