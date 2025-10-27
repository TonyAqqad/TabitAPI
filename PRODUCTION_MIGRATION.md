# Production Migration Guide

## Current Setup (Sandbox/Testing)

- **URL:** https://us-demo-middleware.tabit-stage.com
- **Integrator Token:** bcd1af29b23b40f4b642bb9c554b9b1f
- **Organization Token:** 217f096507444e7cbbbf9a40ed61e5f6 (shared for testing)

---

## Production Requirements

### 1. Get Production Credentials from Tabit

**Contact Tabit** to request:
- ✅ Production URL (not `-stage.com`)
- ✅ New Integrator Token (for production)
- ✅ Organization Token(s) for each restaurant

**Key Points:**
- Each restaurant gets a **unique Organization Token**
- Production URL will be different (not `-stage`)
- Integrator Token will be different (not test token)
- Production credentials have different rate limits

### 2. Multi-Tenant Setup (Multiple Restaurants)

Since each restaurant has a unique Organization Token, you need to handle multiple tenants.

**Options:**

#### Option A: Single Worker, Per-Restaurant API Keys
Store organization tokens in a database/array and select based on API key:
```javascript
const restaurants = {
  "api_key_restaurant_1": {
    orgToken: "restaurant_1_org_token",
    name: "Restaurant A"
  },
  "api_key_restaurant_2": {
    orgToken: "restaurant_2_org_token",
    name: "Restaurant B"
  }
};

// When API key validated, get corresponding org token
const restaurant = restaurants[apiKey];
const orgToken = restaurant.orgToken;
```

#### Option B: Separate Workers Per Restaurant
- Create separate Cloudflare Worker for each restaurant
- Each has its own API key and organization token
- Simpler but more Workers to manage

#### Option C: Request-Based Organization Token
Pass organization token in each request (if GHL can send it):
```
POST /order
Headers: X-Organization-Token: <restaurant_token>
```

---

## Implementation Steps

### Step 1: Get Production Credentials

Contact Tabit and request:
1. Production API URL
2. Production Integrator Token
3. Organization Token(s) for restaurant(s)

**Email Template:**
```
Subject: Production API Access Request

Hi Tabit Team,

We've completed sandbox integration testing with:
- Sandbox URL: https://us-demo-middleware.tabit-stage.com
- Integrator Token: bcd1af29b23b40f4b642bb9c554b9b1f

We're ready to move to production. Please provide:
- Production API URL
- Production Integrator Token
- Organization Token for: [Restaurant Name/Location]

Contact: [Your Contact Info]
```

---

### Step 2: Update Cloudflare Secrets

Once you have production credentials:

**Update Secrets in Cloudflare:**

```powershell
# Update Integrator Token
npx wrangler secret put TABIT_INTEGRATOR_TOKEN
# Enter production integrator token when prompted

# Update Organization Token
npx wrangler secret put TABIT_ORG_TOKEN
# Enter production organization token when prompted
```

**For Multiple Restaurants (if using Option A):**

Store in Cloudflare Workers KV or D1 Database instead of secrets:

```javascript
// In worker.js
const restaurants = await env.RESTAURANTS.get(apiKey);
const orgToken = JSON.parse(restaurants).orgToken;
```

---

### Step 3: Update Worker Code (If Needed)

### Update Production URL

In `worker.js`, change the fetchTabit function:

```javascript
async function fetchTabit(path, config, init = {}) {
  // Use production URL instead of sandbox
  const tabitUrl = env.TABIT_CONFIG.baseUrl || 'https://us-demo-middleware.tabit-stage.com';
  
  return fetch(`${tabitUrl}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      'integrator-token': config.integratorToken,
      'organization-token': config.orgToken,
    },
  });
}
```

Add base URL to secrets:
```powershell
npx wrangler secret put TABIT_BASE_URL
# Enter: https://us-middleware.tabit.com (or whatever production URL is)
```

---

### Step 4: Verify Source Information

**Current Order Handler** already sets source correctly:

```javascript:worker.js
// From handleOrder function
sources: [{ 
  key: "captureclient", 
  name: "Capture Client" 
}]
```

✅ This is already correct! No changes needed.

---

### Step 5: Test Production Credentials

**Update test in CREDENTIALS.md:**
```markdown
## Production Environment

**Production URL**: https://[production-url].tabit.com

**Credentials**:
- **Integrator Token**: [production_integrator_token]
- **Organization Token**: [production_org_token]
```

**Test with production:**
```powershell
# Test health (if available)
Invoke-WebRequest -Uri "https://[production-url]/health" -Headers @{
  "integrator-token"="[prod_token]"
  "organization-token"="[prod_org_token]"
}

# Test menu fetch
Invoke-WebRequest -Uri "https://[production-url]/menu" -Headers @{
  "integrator-token"="[prod_token]"
  "organization-token"="[prod_org_token]"
}
```

---

## Configuration Comparison

### Sandbox (Current)
- URL: `https://us-demo-middleware.tabit-stage.com`
- Integrator Token: `bcd1af29b23b40f4b642bb9c554b9b1f`
- Organization Token: `217f096507444e7cbbbf9a40ed61e5f6`
- Purpose: Testing/development
- Environment: Test data

### Production (To Configure)
- URL: `https://[prod].tabit.com` (from Tabit)
- Integrator Token: `[from Tabit]`
- Organization Token: `[unique per restaurant]`
- Purpose: Live orders
- Environment: Real customer data

---

## Multi-Tenant Architecture (If Multiple Restaurants)

### Database Schema (if using KV or D1)

```javascript
// KV Structure
{
  "api_key_restaurant_a": {
    "orgToken": "restaurant_a_token",
    "name": "Restaurant A",
    "location": "Downtown"
  },
  "api_key_restaurant_b": {
    "orgToken": "restaurant_b_token", 
    "name": "Restaurant B",
    "location": "Uptown"
  }
}
```

### Worker Logic:

```javascript
async function handleOrder(request, env) {
  // Validate API key
  const keyError = validateApiKey(request, env);
  if (keyError) return keyError;
  
  // Get restaurant info from API key
  const restaurant = await env.RESTAURANTS.get(apiKey);
  const { orgToken } = JSON.parse(restaurant);
  
  // Use restaurant-specific org token
  const tabitPayload = {
    // ... order data
  };
  
  const response = await fetchTabit('/order', {
    integratorToken: env.TABIT_INTEGRATOR_TOKEN,
    orgToken: orgToken // Restaurant-specific
  }, {
    method: 'POST',
    body: JSON.stringify(tabitPayload)
  });
}
```

---

## Checklist for Production Migration

- [ ] Contact Tabit for production credentials
- [ ] Receive production URL, integrator token, org token(s)
- [ ] Decide on multi-tenant architecture (Option A, B, or C)
- [ ] Update Cloudflare secrets with production credentials
- [ ] Update Worker code if using different base URL
- [ ] Test production endpoints with new credentials
- [ ] Verify source.key and source.name in orders
- [ ] Update documentation with production URLs
- [ ] Set up monitoring for production environment
- [ ] Get restaurant staff trained on system
- [ ] Go live!

---

## What You Need to Do NOW

1. **Contact Tabit** - Email them for production credentials
2. **Decide on Architecture** - Will you have multiple restaurants or just one?
3. **Plan Migration** - Set a date for switching from sandbox to production
4. **Test Thoroughly** - Test all endpoints with production credentials before going live

---

## Timeline Estimate

- **Getting Credentials:** 3-7 business days (Tabit response time)
- **Configuration:** 1-2 hours
- **Testing:** 1-2 days
- **Go Live:** When you're confident

**Total: 1-2 weeks from request to production**

---

## Important Notes

✅ **Keep Sandbox Active** - Don't delete sandbox credentials, keep for testing  
⚠️ **Different Rate Limits** - Production may have different limits  
⚠️ **Real Customer Data** - Production orders are REAL, sandbox is test data  
✅ **Source Info Already Correct** - No changes needed to source.key/name  
✅ **Your Worker is Ready** - Just need to update credentials  

---

**You're almost production-ready! Just need the production credentials from Tabit.** 🚀

