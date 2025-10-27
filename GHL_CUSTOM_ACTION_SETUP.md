# GHL Custom Action - Quick Setup Guide

## ✅ Two Ways to Provide API Key (Both Work!)

### Option 1: Header (Recommended)
```
Header Name: X-API-Key
Header Value: wqiuefdy8y18e
```

### Option 2: Query Parameter (Backup)
Add to URL:
```
https://tabit-worker.tony-578.workers.dev/catalog?api_key=wqiuefdy8y18e
```

---

## 🎯 GHL Custom Action Configuration

### Action Details
- **Action Name**: `Fetch Menu`
- **When to Execute**: When caller needs menu information
- **What to say before**: "Let me check the menu for you."

### API Configuration

**Method**: `POST` (or GET - both work!)

**URL** (Choose one):
- **With Header**: `https://tabit-worker.tony-578.workers.dev/catalog`
  - Add header: `X-API-Key: wqiuefdy8y18e`
  
- **With Query**: `https://tabit-worker.tony-578.workers.dev/catalog?api_key=wqiuefdy8y18e`
  - No headers needed

**Body**:
```json
{}
```
Or leave empty - it works either way!

---

## 🧪 Test Your Endpoint

**With Header**:
```powershell
Invoke-WebRequest -Uri "https://tabit-worker.tony-578.workers.dev/catalog" `
  -Method POST -Headers @{"X-API-Key"="wqiuefdy8y18e"}
```

**With Query Parameter**:
```powershell
Invoke-WebRequest -Uri "https://tabit-worker.tony-578.workers.dev/catalog?api_key=wqiuefdy8y18e" `
  -Method POST
```

Both should return the full menu (success: 200 OK)

---

## 📋 GHL Custom Action Fields

When configuring in GHL, you'll map response fields like:
- `menu_data` - Full menu JSON
- `menu_categories` - Categories array
- `menu_items` - All items array

---

## 🚨 If It Still Doesn't Work

1. Check the actual error message in GHL test
2. Try both header AND query parameter in URL
3. Use the `/menu-summary` endpoint for smaller response
4. Check that your API key matches: `wqiuefdy8y18e`

---

## 💡 Pro Tips

- The `/catalog` endpoint returns the **complete menu** (~269KB)
- The `/menu-summary` endpoint returns a **condensed version** (~8KB, 47 items)
- For testing, use `/menu-summary` first
- For production, use `/catalog` for full data

