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
async function fetchTabit(path, config, init = {}) {
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
 * Accepts key from header (X-API-Key) OR query parameter (?api_key=)
 * for maximum compatibility with different systems
 */
function validateApiKey(request, env) {
  const apiKey = env.TABIT_CONFIG.proxyApiKey;
  if (!apiKey) return null; // No key required
  
  // GHL Voice AI drops custom headers! Use query parameter instead.
  const url = new URL(request.url);
  let providedKey = url.searchParams.get('api_key');
  
  // Check query parameter first (GHL-friendly)
  if (!providedKey) {
    // Fallback to header for non-GHL clients
    providedKey = request.headers.get('X-API-Key');
  }
  
  if (providedKey !== apiKey) {
    return json({ error: 'Invalid or missing API key. Use ?api_key=YOUR_KEY query parameter' }, 401);
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
    const keyError = validateApiKey(request, env);
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
    const response = await fetchTabit('/menu', config, { method: 'GET' });
    const data = await response.json();
    
    // Store in cache
    menuCache.at = now;
    menuCache.data = data;
    
    return json(data, response.status);
  } catch (error) {
    log('catalog error', { error: error.message });
    return json({ error: error.message }, 500);
  }
}

/**
 * GET /menu-summary
 * Lightweight menu summary for GHL (much smaller response)
 */
async function handleMenuSummary(request, env) {
  try {
    // Check API key if required
    const keyError = validateApiKey(request, env);
    if (keyError) return keyError;
    
    // Fetch full menu
    const config = env.TABIT_CONFIG;
    const response = await fetchTabit('/menu', config, { method: 'GET' });
    const fullMenu = await response.json();
    
    // Create simple list format for GHL
    const allItems = [];
    fullMenu.slice(0, 10).forEach(category => {
      if (category.children && category.children.length > 0) {
        category.children.slice(0, 5).forEach(item => {
          allItems.push({
            id: item.id,
            name: item.name,
            category: category.name,
            price: item.price,
            description: item.description?.substring(0, 100) || ''
          });
        });
      }
    });
    
    // Return simple, flat structure
    return json({
      success: true,
      count: allItems.length,
      items: allItems
    });
  } catch (error) {
    log('menu-summary error', { error: error.message });
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
  try {
    // Check API key if required
    const keyError = validateApiKey(request, env);
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
    const config = env.TABIT_CONFIG;
    const response = await fetchTabit('/order', config, {
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
  } catch (error) {
    log('order error', { error: error.message });
    return json({ error: error.message }, 500);
  }
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
 * Handler for root path
 */
async function handleRoot() {
  return json({
    service: 'Tabit API Proxy',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      'GET /health': 'Health check',
      'GET /catalog?api_key=...': 'Fetch full menu (requires API key)',
      'GET /menu-summary?api_key=...': 'Fetch menu summary (requires API key)',
      'GET /ghl-test': 'GHL test endpoint',
      'POST /order': 'Submit order (requires API key)',
      'POST /webhooks/tabit/menu-update': 'Receive menu update webhook',
      'POST /webhooks/tabit/order-status': 'Receive order status webhook'
    }
  });
}

/**
 * GET /ghl-test
 * GHL test button validation - NO API KEY REQUIRED
 * Must return: {"success": true}
 */
async function handleGHLTest() {
  return json({ success: true });
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
      
      // Redirect HTTP to HTTPS
      if (url.protocol === 'http:') {
        url.protocol = 'https:';
        return Response.redirect(url.toString(), 301);
      }
      
      // Initialize config
      env.TABIT_CONFIG = env.TABIT_CONFIG || initConfig(env);
      
      // CORS preflight
      if (method === 'OPTIONS') {
        return cors();
      }
      
      // Route handlers
      switch (method) {
        case 'GET':
        case 'HEAD':
          if (path === '/') {
            const response = await handleRoot();
            // For HEAD requests, don't send body
            if (method === 'HEAD') {
              return new Response(null, { 
                status: response.status, 
                headers: response.headers 
              });
            }
            return response;
          }
          if (path === '/health') return handleHealth();
          if (path === '/ghl-test') return handleGHLTest();
          if (path === '/diag' && env.DEBUG === 'true') return handleDiag(env);
          if (path === '/catalog') return handleCatalog(request, env);
          if (path === '/menu-summary') return handleMenuSummary(request, env);
          break;
          
        case 'POST':
          if (path === '/') return json({ error: 'Root path only accepts GET' }, 405);
          if (path === '/order') return handleOrder(request, env);
          if (path === '/catalog') return handleCatalog(request, env);
          if (path === '/menu-summary') return handleMenuSummary(request, env);
          if (path === '/webhooks/tabit/menu-update') return handleMenuUpdate();
          if (path === '/webhooks/tabit/order-status') return handleOrderStatus(request, env);
          break;
      }
      
      // Not found
      return json({ error: 'Not Found', availableEndpoints: '/health, /catalog, /menu-summary, /order' }, 404);
      
    } catch (error) {
      log('request error', { error: error.message, stack: error.stack });
      return json({ error: error.message }, 500);
    }
  },
};
