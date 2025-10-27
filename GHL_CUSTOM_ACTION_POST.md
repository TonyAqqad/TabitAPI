# GHL Custom Action - Fetch Menu (POST Method)

This guide shows how to configure GHL Custom Actions using **POST requests** instead of GET, which is more compatible with GHL's testing and validation.

## Custom Action Configuration

### Action Details

- **Action Name**: `Fetch Menu from Tabit`
- **When to Execute**: When the caller needs menu data to answer questions
- **What to say before executing**: "Let me check the menu for you."

### API Configuration

- **Method**: `POST` ⭐ (Use POST instead of GET)
- **URL**: `https://tabit-worker.tony-578.workers.dev/menu-summary`
- **Headers**:
  ```
  Content-Type: application/json
  ```

### Request Body (JSON)

Since we're using POST, we can send a body. Keep it simple:

```json
{
  "action": "fetch_menu"
}
```

**Alternatively**, you can leave the body empty `{}` - the endpoint works with or without body data.

### Expected Response

The `/menu-summary` endpoint returns:

```json
{
  "success": true,
  "count": 50,
  "items": [
    {
      "id": "item-id-1",
      "name": "Item Name",
      "category": "Category Name",
      "price": 15.99,
      "description": "Item description..."
    },
    ...
  ]
}
```

This is a **lightweight, flat structure** perfect for Voice AI.

---

## Testing in GHL

1. **Click "Test Webhook"** in the Custom Action editor
2. GHL will make a POST request to your endpoint
3. You should see a **successful response** with the menu data
4. The endpoint works with GET too, so you can test with:
   ```bash
   curl https://tabit-worker.tony-578.workers.dev/menu-summary
   ```

---

## Why POST Instead of GET?

- GHL's test button is **more reliable with POST requests**
- POST requests have better validation in GHL Custom Actions
- The endpoint accepts both GET and POST for maximum compatibility
- POST allows you to send additional context in the body if needed

---

## Troubleshooting

### "Status: Failed" in GHL Test

If you still see "Status: Failed":
1. Check the actual response in the test output
2. Verify the URL is correct: `tabit-worker.tony-578.workers.dev/menu-summary`
3. Try testing the endpoint directly in your browser or Git Bash:
   ```bash
   curl -X POST https://tabit-worker.tony-578.workers.dev/menu-summary
   ```

### Empty Body in Request

The endpoint works fine with an empty body. You can configure the request body as:
- `{}` (empty object)
- `{ "action": "fetch_menu" }` (with data)
- No body at all (but GHL will send `{}` by default)

The handler returns the same menu data regardless of body content.

---

## Next Steps

1. Deploy the updated worker with the POST handler
2. Configure the GHL Custom Action with POST method
3. Test the webhook using GHL's Test button
4. If successful, save the Custom Action
5. Use it in your Voice AI agent configuration

---

## Alternative: If POST Still Fails

If both GET and POST fail in GHL Custom Actions, the issue is likely GHL's strict test validation. In that case:

- Use the **GHL Workflow approach** (see `GHL_WORKFLOW_GUIDE.md`)
- Workflows don't have the same test restrictions as Custom Actions
- This is the recommended production approach anyway
