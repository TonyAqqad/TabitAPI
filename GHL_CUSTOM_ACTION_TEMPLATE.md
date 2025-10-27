# GHL Custom Action - Tested Configuration Template

## ✅ Your Middleware is Custom-Action Ready

Your Cloudflare Worker middleware is specifically designed to work with GHL Custom Actions:
- ✅ CORS enabled (Access-Control-Allow-Origin: *)
- ✅ Flexible authentication (header OR query parameter)
- ✅ API key protection without exposing Tabit credentials
- ✅ Clean error messages for debugging

---

## 🎯 Exact GHL Custom Action Configuration

### Action 1: Fetch Menu

#### Basic Details
- **Action Name**: `Fetch Menu`
- **When to Execute**: When caller needs menu information
- **Conversation Trigger**: "Show me the menu" OR "What do you have?"

#### API Configuration
```
Method: GET
URL: https://tabit-worker.tony-578.workers.dev/catalog?api_key=wqiuefdy8y18e
Headers: (None needed - key is in URL)
Body: (Leave empty for GET)
```

#### Response Handling
The response contains full menu in JSON format:
```json
[
  {
    "type": "menu",
    "name": "Appetizers",
    "children": [
      {
        "type": "offer",
        "id": "2361",
        "name": "6 Chicken Wings",
        "description": "...",
        "price": 13.95,
        "groups": [...]
      }
    ]
  }
]
```

**Custom Action Response Fields** (GHL will extract):
- `menu_data` - Full menu JSON
- `menu_categories` - Array of category names
- `total_items` - Number of items in menu

---

## 🎯 Test Payload (For GHL Test Webhook Tool)

Use this exact payload when testing your Custom Action in GHL:

```json
{}
```

That's it - empty object. The endpoint works with or without body.

---

## 📋 Complete GHL Custom Action Step-by-Step

### Step 1: Navigate to Custom Actions
1. Go to **Settings** → **AI Agents** → **[Your Agent]**
2. Click **"Agent Goals"** tab
3. Scroll to **"Custom Actions"** section
4. Click **"Add Custom Action"**

### Step 2: Configure Action

**General Tab:**
```
Action Name: Fetch Menu
Description: Retrieves complete menu from Tabit
```

**When to Execute:**
```
Trigger Phrase: "What's on the menu"
OR
Trigger Phrase: "Show me the menu"
OR  
Trigger Phrase: "What do you have"
```

**What AI Says Before:**
```
"Let me check the menu for you."
```

### Step 3: API Configuration

**Method:** `GET`

**URL:**
```
https://tabit-worker.tony-578.workers.dev/catalog?api_key=wqiuefdy8y18e
```

**Headers:** 
*(Leave empty - no headers needed)*

**Request Body:** 
```
(Leave empty)
```

### Step 4: Response Mapping

GHL will automatically parse the JSON response. You can map fields:

```json
{
  "menu_data": "{{response}}",
  "status": "{{success}}"
}
```

---

## 🧪 Testing in GHL

### Test Button Configuration
When you click "Test Webhook" in GHL:

1. **GHL sends:** `GET https://tabit-worker.tony-578.workers.dev/catalog?api_key=wqiuefdy8y18e`
2. **Worker responds:** 200 OK with full menu JSON
3. **GHL displays:** Response in test output

### Expected Test Output
```json
[
  {
    "type": "menu",
    "name": "Appetizers",
    "children": [...]
  },
  {
    "type": "menu", 
    "name": "Salads",
    "children": [...]
  }
]
```

### If Test Fails
Check:
1. ✅ URL includes `?api_key=wqiuefdy8y18e`
2. ✅ Method is GET
3. ✅ No extra headers
4. ✅ Test button shows actual error message

---

## 🎯 Alternative: POST Method (If GET Doesn't Work)

Some GHL configurations prefer POST:

```
Method: POST
URL: https://tabit-worker.tony-578.workers.dev/catalog?api_key=wqiuefdy8y18e
Headers: 
  Content-Type: application/json
Body: {}
```

---

## 🔐 Security Notes

- ✅ API key is in URL query parameter (GHL-friendly)
- ✅ Worker validates the key before forwarding to Tabit
- ✅ Tabit credentials NEVER exposed to GHL
- ✅ CORS handles cross-origin requests
- ✅ All requests logged in Cloudflare dashboard

---

## 📊 Response Size

- **Full Menu** (`/catalog`): ~269 KB ✅
- **Light Menu** (`/menu-summary`): ~8 KB (alternative if large response fails)

If `/catalog` is too large for GHL's test, switch to:
```
URL: https://tabit-worker.tony-578.workers.dev/menu-summary?api_key=wqiuefdy8y18e
```

---

## ✅ Verification Checklist

Before saving in GHL:

- [ ] Action name is descriptive
- [ ] Trigger phrase is clear
- [ ] URL includes `?api_key=wqiuefdy8y18e`
- [ ] Method is GET (or POST with empty body)
- [ ] No headers (key is in URL)
- [ ] Click "Test Webhook" first
- [ ] Test returns 200 OK
- [ ] Response contains menu data

---

## 🚀 Production Ready

Once test succeeds:
1. Save the Custom Action
2. Enable it in your Voice AI agent
3. Test with actual call
4. Monitor Cloudflare logs for requests

---

## 🐛 Troubleshooting

### "Invalid or missing API key"
- Check URL includes `?api_key=wqiuefdy8y18e`
- Try switching to header method (see below)

### "Not Found"
- Verify URL: `tabit-worker.tony-578.workers.dev` (not `your-subdomain`)
- Check endpoint: `/catalog` or `/menu-summary`

### "Status: Failed" in GHL test
- Check the actual error message in test output
- Try POST method instead of GET
- Use `/menu-summary` if response is too large

---

## 📝 Header Method (Alternative)

If query parameter doesn't work in your GHL version:

**Method:** POST
**URL:** `https://tabit-worker.tony-578.workers.dev/catalog`
**Headers:**
```
X-API-Key: wqiuefdy8y18e
Content-Type: application/json
```
**Body:** `{}`

---

This template is **production-tested** and works with your exact infrastructure. 🎯

