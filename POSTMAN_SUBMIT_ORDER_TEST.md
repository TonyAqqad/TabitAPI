# ✅ Postman Test for /submit-order Endpoint

## Working Endpoint Configuration

### Request Setup

**Method:** `POST` (must be POST, not GET!)

**URL:** 
```
https://api.khashokausa.info/submit-order
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "order_items": "Chicken Wings|Large|2|Mix+Ranch",
  "order_type": "pickup",
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "delivery_address": "",
  "delivery_notes": ""
}
```

---

## Expected Response

**Status:** `200 OK`

**Body:**
```json
{
  "success": true,
  "order_id": "ORD_1761617373776_zxb8zkckx",
  "order_number": 1761617373,
  "order_total": 20,
  "status": "submitted",
  "message": "Order submitted successfully"
}
```

---

## Common Issues

### ❌ Getting "Not Found" Error?

**Problem:** Using GET instead of POST

**Solution:** Make sure you select **POST** method in Postman!

### ❌ Getting "Method Not Allowed"?

**Problem:** Endpoint expects POST but receiving OPTIONS or other method

**Solution:** Configure Postman to send POST request, not OPTIONS preflight

---

## Test Cases

### Test 1: Basic Pickup Order
```json
{
  "order_items": "6 Chicken Wings|Mix|2",
  "order_type": "pickup",
  "customer_name": "Jane Smith",
  "customer_phone": "+15551234567"
}
```

### Test 2: Delivery Order with Address
```json
{
  "order_items": "8 Chicken Tenders|Regular|1",
  "order_type": "delivery",
  "customer_name": "Bob Johnson",
  "customer_phone": "+15559876543",
  "delivery_address": "123 Main St, City, State 12345",
  "delivery_notes": "Ring doorbell twice"
}
```

### Test 3: Multiple Items
```json
{
  "order_items": "6 Chicken Wings|Mix|2;Small Onion Rings|Regular|1",
  "order_type": "pickup",
  "customer_name": "Alice Williams",
  "customer_phone": "+15555555555"
}
```

---

## Response Fields for GHL

After testing in Postman, you'll see these fields available in GHL:

- `success` → Use in If/Else condition
- `order_id` → For customer reference
- `order_number` → For SMS confirmation
- `order_total` → For SMS total
- `status` → For logging
- `message` → For error handling

---

## ✅ Verified Working!

Tested on: October 28, 2025  
Response: Success ✅  
Order ID: ORD_1761617373776_zxb8zkckx  
Status: 200 OK

