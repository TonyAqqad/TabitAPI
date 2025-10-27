# ✅ GHL Custom Action - WORKING Configuration

## Why It Works Now

The Worker now returns the **same format** as Tabit's sandbox API, which GHL successfully parsed!

**Key insight:** GHL expects `results[]` as the top-level structure.

---

## Configuration

### GHL Custom Action Setup

**Action Name:** Fetch Menu

**Endpoint URL:**
```
https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e
```

**Method:** GET

**Headers:**
- None (API key is in the URL as a query parameter)

**Authentication:** Toggle OFF

---

## What GHL Will Receive

```json
{
  "results": [
    {
      "type": "menu",
      "name": "Appetizers",
      "id": "u7uxgg00u1",
      "children": [
        {
          "name": "Fried Calamari",
          "id": "abc123",
          "description": "Crispy fried squid rings",
          "price": 12.99,
          "groups": [
            {
              "name": "Size",
              "id": "size_1",
              "type": "required",
              "min": 1,
              "max": 1,
              "members": [
                {
                  "name": "Regular",
                  "id": "reg",
                  "price": 0
                },
                {
                  "name": "Large",
                  "id": "large",
                  "price": 3.99
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Available Response Fields in GHL

GHL will automatically discover these fields from the API response:

- `results[]`
- `results[].type`
- `results[].name`
- `results[].children[]`
- `results[].children[].id`
- `results[].children[].name`
- `results[].children[].description`
- `results[].children[].groups[]`
- `results[].children[].groups[].name`
- `results[].children[].groups[].members[]`
- `results[].children[].groups[].members[].name`
- `results[].children[].groups[].members[].price`
- `results[].children[].groups[].members[].available`
- `results[].children[].groups[].members[].code`
- `results[].children[].price`
- `results[].children[].available`
- `results[].children[].serviceAvailability[]`
- ... and more!

---

## How to Use in Voice AI

**Voice AI Agent Setup:**

```
When the caller asks:
- "What do you have?" → Trigger "Fetch Menu" custom action
- "Show me the menu" → Trigger "Fetch Menu" custom action
- "What's on your menu?" → Trigger "Fetch Menu" custom action

After executing the custom action, you'll have access to:
- {results[].children[].name} - item names
- {results[].children[].description} - item descriptions
- {results[].children[].price} - item prices
- {results[].children[].groups[].name} - size/option names
- {results[].children[].groups[].members[].name} - specific size/option values
```

**Example Response to Customer:**
```
Our appetizers include:
- {results[].children[].name} - {results[].children[].description} - ${results[].children[].price}

Or:

"What sizes are available?"
Sizes: {results[].children[].groups[? (@.name == "Size")].members[].name}
```

---

## Test It Now

1. Go to GHL → Voice AI → Custom Actions
2. Create new action
3. Set URL: `https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e`
4. Click **"Test Webhook"**
5. Status should show: **"Success"** ✅
6. You should see all the response fields listed below!

---

## Why It Works

**Original Problem:**
- Worker returned raw array without `results` wrapper
- GHL couldn't parse it
- Test button always failed

**Solution:**
- Worker now wraps response in `results[]` structure
- Matches Tabit's format exactly
- GHL can parse and display all fields

This is the **same format** that Tabit's sandbox uses, which is why GHL's test button works! 🎉

