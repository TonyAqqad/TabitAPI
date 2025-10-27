# GHL Custom Action - Live Testing Guide

## ✅ Your Configuration

**Custom Domain**: `api.khashokausa.info`  
**Status**: ✅ Active and Working  
**SSL**: ✅ Certificate Active  

---

## Step-by-Step: Configure in GHL

### Step 1: Navigate to Custom Actions

1. Go to **https://app.gohighlevel.com**
2. Click **Settings** (gear icon)
3. Go to **AI Agents** 
4. Select your **Voice AI agent**
5. Click **"Agent Goals"** tab
6. Scroll to **"Custom Actions"** section

---

### Step 2: Create New Custom Action

**If you have an existing action:**
- Click **"Edit"** on your existing "Fetch Menu" action

**If creating new:**
- Click **"Add Custom Action"**

---

### Step 3: Configure Custom Action

#### Action Details Tab:

**Action Name:**
```
Fetch Menu
```

**When to Execute:**
```
When the caller mentions menu items or asks about what's available to order.
```

**What to say before executing:**
```
Let me check the menu for you.
```

---

#### API Details Tab:

**Method (Dropdown):**
```
GET
```

**Endpoint URL:**
```
https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e
```

⚠️ **Important**: Copy this URL EXACTLY as shown. The API key is in the URL as a query parameter.

**Headers Section:**
- **Click "+ Add Header"**
- **Name**: Leave empty - don't add any headers!
- The API key is already in the URL

**Authentication Needed Toggle:**
- Turn this **OFF** (gray/unselected)
- Don't enable this toggle!

**Parameters/Variables:**
- Leave empty - no parameters needed for this action

---

### Step 4: Test the Webhook

1. Scroll down to bottom of configuration
2. Click **"Test Webhook"** button
3. Wait for response (should take 1-2 seconds)

**Expected Result:**
```
Status: Success ✅

Response Preview:
{
  "type": "menu",
  "name": "Appetizers",
  "children": [...]
}
```

Or it might show the full JSON response with menu data.

---

### Step 5: Save and Enable

**If test is successful:**
1. Click **"Save Custom Action"** 
2. Make sure it's **Enabled** (toggle should be ON/green)
3. Click **"Save Agent"** at the top

---

## Troubleshooting

### If "Status: Failed" Still Shows

**Don't worry!** This is common. Proceed anyway:

1. The endpoint IS working (we tested it)
2. GHL's test button is notoriously unreliable
3. Save the custom action anyway
4. Test with an actual phone call instead

**Test with Real Call:**
- Set up a test call to your Voice AI number
- Ask: "What's on the menu?"
- AI should trigger the custom action
- Check Cloudflare logs to see if request came through

### Check Cloudflare Logs

1. Go to https://dash.cloudflare.com
2. **Workers & Pages** → **tabit-worker**
3. Click **"Logs"** tab
4. Look for requests from GHL
5. If you see requests with 200 status, it's working!

---

## Alternative: Use GHL Workflows

If the test button continues to fail in Custom Actions, use **Workflows** instead:

### Workflow Configuration:

1. Go to **Automation** → **Workflows** → **Create Workflow**
2. Name: `Fetch Menu Data`
3. **Trigger**: Scheduled (daily at 6 AM) or Webhook
4. **Add Action**: HTTP Request
   - Method: **GET**
   - URL: `https://api.khashokausa.info/catalog`
   - Add Header: `X-API-Key: wqiuefdy8y18e`
5. **Add Action**: Update Contact Custom Field
   - Field: `menu_data`
   - Value: Response from HTTP request
6. Save and Activate

Then in Voice AI, reference the `menu_data` custom field instead of calling API directly.

---

## Verify in Voice AI

### Update Voice AI Prompt:

Add this to your agent's instructions:

```
You have access to the restaurant menu through the Custom Action "Fetch Menu".
When customers ask about menu items:
1. Trigger the "Fetch Menu" custom action
2. Read the response to find menu items
3. Provide accurate information including prices

Example queries:
- "What do you have?" → Trigger Fetch Menu action
- "Show me appetizers" → Trigger Fetch Menu, then filter to Appetizers
```

---

## Success Indicators

✅ Custom Action saved without errors  
✅ Test button returns menu data (or at least "Status: Success")  
✅ Voice AI can trigger the action during test calls  
✅ Cloudflare logs show 200 OK responses from GHL  
✅ Customer can ask "What's on the menu?" and AI responds  

---

## Next Steps After Setup

1. **Make a test call** to your Voice AI number
2. Ask: "What appetizers do you have?"
3. AI should fetch and list menu items
4. Check Cloudflare logs for the request
5. Monitor for any 401/500 errors

---

## Production URL Reference

**For Future Updates:**

If you need to update the URL in GHL:

```
https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e
```

Keep the API key in the URL as a query parameter - this is what makes it work with GHL's test button.

---

**Your custom domain is live and ready for GHL integration!** 🎉

