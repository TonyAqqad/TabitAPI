# Goal: GET Menu Request in GHL Custom Actions

## 🎯 Our Goal

**Fetch current menu data from Tabit so Voice AI can read it to customers during calls.**

---

## What We're Doing

When a customer calls and asks "What do you have?" or "Show me the menu":

1. **Trigger Custom Action** → HTTP Request to GET menu
2. **Worker Fetches** → Calls Tabit API (with caching)
3. **Returns Menu Data** → Categories, items, prices, descriptions
4. **Voice AI Uses Data** → Reads available items to customer

---

## GHL Custom Action Setup

### Action Description

```
Fetch restaurant menu from Tabit API to provide current menu items, prices, 
and availability to the Voice AI during order-taking calls.
```

### HTTP Request Action Configuration

**Method:** GET  
**URL:** `https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e`

**Headers:** None required (API key in URL)

---

## Expected Response Structure

The menu data will be returned in Tabit's format:

```json
[
  {
    "type": "menu",
    "name": "Appetizers",
    "id": "u7uxgg00u1",
    "children": [
      {
        "type": "offer",
        "id": "2361",
        "name": "6 Chicken Wings",
        "description": "Downtown Savannah's Best Wings...",
        "price": 12.99,
        "groups": [
          {
            "name": "Serving/Prep",
            "id": "68e7b82e893d90398a570415",
            "type": "required",
            "min": 1,
            "max": 1,
            "members": [
              {
                "name": "Mix",
                "id": "68e7b82e893d90398a570417",
                "price": 0,
                "available": true
              }
            ]
          }
        ]
      }
    ]
  }
]
```

---

## How Voice AI Will Use It

The AI can extract and read:

1. **Categories:** `results[].name` (e.g., "Appetizers")
2. **Items:** `results[].children[].name` (e.g., "Chicken Wings")
3. **Descriptions:** `results[].children[].description`
4. **Prices:** `results[].children[].price`
5. **Sizes/Options:** `results[].children[].groups[].members[].name`

**Example Response:**
```
"We have several categories: Appetizers, Salads, Handhelds...

From Appetizers, we have 6 Chicken Wings for $12.99 - Downtown Savannah's 
Best Wings with choices for serving and dip options."
```

---

## Benefits

✅ **Always Current** - Menu updates automatically from Tabit  
✅ **Fast** - Cached for 10 minutes, no delay  
✅ **Complete** - Full menu with all details  
✅ **Structured** - Easy for AI to parse and read  

---

## Next Step: Test with Webhook.site

### Method 1: Direct Test in Webhook.site

1. Go to https://webhook.site
2. Copy your unique webhook URL
3. Use this configuration in webhook.site or Postman:

**Request:**
```
Method: GET
URL: https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e
Headers: None required
```

### Method 2: Using Postman Collection

Import this JSON into Postman or test directly:

```json
{
  "name": "Get Menu Catalog",
  "request": {
    "method": "GET",
    "header": [],
    "url": {
      "raw": "https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e",
      "protocol": "https",
      "https": "api.khashokausa.info",
      "path": ["catalog"],
      "query": [
        {
          "key": "api_key",
          "value": "wqiuefdy8y18e"
        }
      ]
    }
  }
}
```

### Method 3: curl Command

```bash
curl "https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e"
```

### Method 4: PowerShell

```powershell
Invoke-WebRequest -Uri "https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e" | Select-Object StatusCode, Content
```

---

## Expected JSON Response Structure

When you call the endpoint, you'll receive JSON that webhook.site can parse:

```json
[
  {
    "type": "menu",
    "name": "Appetizers",
    "id": "u7uxgg00u1",
    "children": [
      {
        "type": "offer",
        "id": "2361",
        "name": "6 Chicken Wings",
        "description": "Downtown Savannah's Best Wings...",
        "price": 12.99,
        "groups": [
          {
            "name": "Serving/Prep",
            "id": "68e7b82e893d90398a570415",
            "type": "required",
            "min": 1,
            "max": 1,
            "members": [
              {
                "name": "Mix",
                "id": "68e7b82e893d90398a570417",
                "price": 0,
                "available": true
              }
            ]
          }
        ]
      }
    ]
  }
]
```

---

## How to Use in Webhook.site

1. **Go to:** https://webhook.site
2. **Copy your unique URL** (e.g., `https://webhook.site/your-unique-id`)
3. **In another tab/browser:**
   - Open Postman or curl
   - Make GET request to: `https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e`
   - Copy the response
4. **Back in webhook.site:**
   - Click "Send Custom Request" or use the webhook URL
   - Paste the copied response
5. **View parsed JSON** in webhook.site's JSON viewer

The JSON structure will be visible and you can see all the menu data webhook.site can parse!

