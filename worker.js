/**
 * Tabit API Proxy Worker
 * 
 * Proxies requests from GHL Voice AI to Tabit demo middleware,
 * with optional API key protection and webhook forwarding.
 */

// Global cache for menu data (10 minute TTL)
let menuCache = { at: 0, data: null };
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Helper: Return JSON response
 */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Helper: Fetch from Tabit API with required headers
 */
async function fetchTabit(path, init = {}) {
  const config = env.TABIT_CONFIG;
  
  return fetch(`https://us-demo-middleware.tabit-stage.com${path}`, {
    ...init,
    headers: {
      ...init.headers,
      'integrator-token': config.integratorToken,
      'organization-token': config.orgToken,
    },
  });
}

/**
 * Helper: Validate API key if required
 */
function validateApiKey(request) {
  const apiKey = env.TABIT_CONFIG.proxyApiKey;
  if (!apiKey) return null; // No key required
  
  const providedKey = request.headers.get('X-API-Key');
  if (providedKey !== apiKey) {
    return json({ error: 'Invalid or missing X-API-Key header' }, 401);
  }
  return null;
}

/**
 * Helper: CORS response
 */
function cors(allowMethods = 'GET, POST, OPTIONS') {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': allowMethods,
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}

/**
 * Helper: Log with masking
 */
function log(message, data = {}) {
  const masked = { ...data };
  if (masked.phone) masked.phone = masked.phone.slice(-4).padStart(masked.phone.length, '*');
  if (masked.items) masked.item_count = masked.items?.length || 0;
  
  console.log(`[${new Date().toISOString()}] ${message}`, masked);
}

/**
 * GET /health
 * Returns health status
 */
async function handleHealth() {
  return json({ status: 'healthy' });
}

/**
 * GET /catalog
 * Proxies menu request with caching
 */
async function handleCatalog(request, env) {
  try {
    // Check API key if required
    const keyError = validateApiKey(request);
    if (keyError) return keyError;
    
    // Check cache
    const now = Date.now();
    if (menuCache.data && (now - menuCache.at) < CACHE_TTL_MS) {
      log('catalog cache hit');
      return json(menuCache.data);
    }
    
    // Fetch from Tabit
    log('catalog cache miss, fetching from Tabit');
    const config = env.TABIT_CONFIG;
    log('fetching with config', { hasIntegrator: !!config?.integratorToken, hasOrg: !!config?.orgToken });
    
    const response = await fetchTabit('/menu', { method: 'GET' });
    const data = await response.json();
    
    // Store in cache
    menuCache.at = now;
    menuCache.data = data;
    
    return json(data, response.status);
  } catch (error) {
    log('catalog error', { error: error.message, stack: error.stack });
    return json({ error: error.message }, 500);
  }
}

/**
 * POST /webhooks/tabit/menu-update
 * Invalidates menu cache
 */
async function handleMenuUpdate() {
  menuCache = { at: 0, data: null };
  log('menu cache invalidated');
  return json({ status: 'cache cleared' }, 200);
}

/**
 * POST /order
 * Accepts flat fields from GHL, transforms to Tabit format
 */
async function handleOrder(request, env) {
  // Check API key if required
  const keyError = validateApiKey(request);
  if (keyError) return keyError;
  
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  
  // Validate required fields
  const { ConsumerName, Phone, OrderType, OrderNumber, ExtId, Items } = body;
  
  if (!ConsumerName || !Phone || !OrderType) {
    return json({ error: 'Missing required fields: ConsumerName, Phone, OrderType' }, 400);
  }
  
  // Parse Items (can be string or array)
  let ItemsArray;
  try {
    ItemsArray = typeof Items === 'string' ? JSON.parse(Items) : Items;
    
    if (!Array.isArray(ItemsArray) || ItemsArray.length === 0) {
      return json({ error: 'Items must be a non-empty array' }, 400);
    }
  } catch (e) {
    return json({ error: 'Invalid Items format - must be JSON array' }, 400);
  }
  
  // Build Tabit payload
  const timestamp = Date.now();
  const tabitPayload = {
    id: ExtId || `ext_${timestamp}`,
    order_number: Number(OrderNumber) || Number(timestamp % 1e6),
    consumer_name: ConsumerName,
    consumer_phone: Phone,
    delivery: { type: OrderType },
    ...(body.PickupEta && { pickup_eta: body.PickupEta }),
    items: ItemsArray,
    sources: [{ key: 'captureclient', name: 'Capture Client' }],
  };
  
  log('order received', { phone: Phone, item_count: ItemsArray.length });
  
  // Post to Tabit
  const response = await fetchTabit('/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tabitPayload),
  });
  
  const responseData = await response.json();
  
  // Log status
  log('order forwarded to Tabit', { 
    status: response.status, 
    ext_id: tabitPayload.id 
  });
  
  return json(responseData, response.status);
}

/**
 * POST /webhooks/tabit/order-status
 * Receives status updates from Tabit, optionally forwards them
 */
async function handleOrderStatus(request, env) {
  // Read raw body without mutation
  const rawBody = await request.text();
  
  // Try to parse for logging
  let data = null;
  try {
    data = JSON.parse(rawBody);
  } catch (e) {
    log('order-status webhook received (invalid JSON)');
    return json({ status: 'received' }, 200);
  }
  
  // Log minimal info
  const statusType = data.status || data.type || 'unknown';
  const extId = data.external_id || data.id || 'unknown';
  log('order-status webhook received', { status_type: statusType, ext_id: extId });
  
  // Forward if URL configured
  if (env.TABIT_CONFIG.forwardStatusUrl) {
    try {
      await fetch(env.TABIT_CONFIG.forwardStatusUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: rawBody,
      });
      log('order-status forwarded', { to: env.TABIT_CONFIG.forwardStatusUrl });
    } catch (e) {
      log('order-status forward failed', { error: e.message });
    }
  }
  
  return json({ status: 'received' }, 200);
}

/**
 * GET /diag (DEBUG only)
 * Returns last 4 chars of tokens for troubleshooting
 */
async function handleDiag(env) {
  const config = env.TABIT_CONFIG;
  return json({
    integrator_len: config.integratorToken.length,
    integrator_tail: config.integratorToken.slice(-4),
    org_len: config.orgToken.length,
    org_tail: config.orgToken.slice(-4),
    debug: env.DEBUG,
    has_proxy_key: !!env.PROXY_API_KEY,
    has_forward_url: !!env.FORWARD_STATUS_URL,
  });
}

/**
 * Initialize config from env vars (with .trim())
 */
function initConfig(env) {
  return {
    integratorToken: (env.TABIT_INTEGRATOR_TOKEN || '').trim(),
    orgToken: (env.TABIT_ORG_TOKEN || '').trim(),
    proxyApiKey: (env.PROXY_API_KEY || '').trim() || null,
    forwardStatusUrl: (env.FORWARD_STATUS_URL || '').trim() || null,
  };
}

/**
 * Main request handler
 */
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;
      
      // Initialize config
      env.TABIT_CONFIG = env.TABIT_CONFIG || initConfig(env);
      
      // CORS preflight
      if (method === 'OPTIONS') {
        return cors();
      }
      
      // Route handlers
      switch (method) {
        case 'GET':
          if (path === '/health') return handleHealth();
          if (path === '/test') {
            return json({
              hasIntegratorToken: !!env.TABIT_INTEGRATOR_TOKEN,
              hasOrgToken: !!env.TABIT_ORG_TOKEN,
              integratorLen: env.TABIT_INTEGRATOR_TOKEN ? env.TABIT_INTEGRATOR_TOKEN.length : 0,
              orgLen: env.TABIT_ORG_TOKEN ? env.TABIT_ORG_TOKEN.length : 0
            });
          }
          if (path === '/test-tabit') {
            try {
              const config = env.TABIT_CONFIG;
              const response = await fetch('https://us-demo-middleware.tabit-stage.com/menu', {
                headers: {
                  'integrator-token': config.integratorToken,
                  'organization-token': config.orgToken,
                }
              });
              const data = await response.json();
              return json({ success: true, status: response.status, dataType: typeof data, hasData: !!data });
            } catch (e) {
              return json({ success: false, error: e.message }, 500);
            }
          }
          if (path === '/diag' && env.DEBUG === 'true') return handleDiag(env);
          if (path === '/catalog') return handleCatalog(request, env);
          break;
          
        case 'POST':
          if (path === '/order') return handleOrder(request, env);
          if (path === '/webhooks/tabit/menu-update') return handleMenuUpdate();
          if (path === '/webhooks/tabit/order-status') return handleOrderStatus(request, env);
          break;
      }
      
      // Not found
      return json({ error: 'Not Found' }, 404);
      
    } catch (error) {
      log('request error', { error: error.message, stack: error.stack });
      return json({ error: error.message }, 500);
    }
  },
};
