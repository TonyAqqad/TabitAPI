# Setup Custom Domain: api.khashokausa.info

## Quick Summary

This guide will connect your GoDaddy domain `khashokausa.info` to Cloudflare and set up the subdomain `api.khashokausa.info` for your Worker.

**Time Required:** 15-30 minutes (plus 24-48 hour DNS propagation)

---

## Step 1: Add Domain to Cloudflare

1. Go to https://dash.cloudflare.com
2. Click **"Add Site"** (top right)
3. Enter your domain: `khashokausa.info`
4. Click **"Add Site"**
5. Select **"Free"** plan
6. Click **"Continue"**

### Cloudflare Will Scan Your Existing DNS

Cloudflare will automatically detect your current DNS records from GoDaddy.

7. Review the detected records and click **"Continue"**

### Cloudflare Provides Nameservers

You'll see something like:
```
Nameserver 1: ns1.cloudflare.com
Nameserver 2: ns2.cloudflare.com
```

**Copy these nameservers!** You'll need them for Step 2.

---

## Step 2: Update Nameservers at GoDaddy

1. Go to https://www.godaddy.com
2. Log in to your account
3. Click **"My Products"**
4. Find `khashokausa.info` and click **"DNS"** or **"Manage"**
5. Look for **"Nameservers"** section
6. Click **"Change"** next to Nameservers

### Update to Cloudflare Nameservers

7. Select **"Custom"** (not "Default")
8. Enter the Cloudflare nameservers:
   - Nameserver 1: `ns1.cloudflare.com`
   - Nameserver 2: `ns2.cloudflare.com`
9. Click **"Save"** or **"Update"**

**Note:** DNS propagation takes 24-48 hours. Your site will work on Cloudflare immediately once nameservers are updated.

---

## Step 3: Configure Custom Domain in Cloudflare Worker

Once DNS nameservers are updated (wait at least 15 minutes):

1. Go to https://dash.cloudflare.com
2. Click **"Workers & Pages"**
3. Click on **"tabit-worker"**
4. Click **"Settings"** tab
5. Scroll to **"Domains & Routes"** section
6. Click **"Add Custom Domain"**
7. Enter: `api.khashokausa.info`
8. Click **"Save"**

### What Cloudflare Does Automatically:

- ✅ Creates CNAME record: `api.khashokausa.info` → `tabit-worker.tony-578.workers.dev`
- ✅ Provisions SSL certificate (takes 5-15 minutes)
- ✅ Configures routing to your Worker

**Wait 5-15 minutes for SSL certificate to be issued.**

---

## Step 4: Verify Subdomain is Active

### Check DNS Propagation

**In PowerShell:**
```powershell
nslookup api.khashokausa.info
```

Should return Cloudflare IP addresses.

**Or use online tool:**
- Go to https://dnschecker.org
- Enter: `api.khashokausa.info`
- Check that CNAME points to Worker

### Check SSL Certificate

**In PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://api.khashokausa.info/health"
```

Should return:
```
StatusCode        : 200
Content           : {"status":"healthy"}
```

### Check in Cloudflare Dashboard

1. Go to Workers & Pages → tabit-worker → Domains & Routes
2. Status should show: ✅ **Active** (green checkmark)
3. SSL/TLS should show: **Active**

---

## Step 5: Update GHL Configuration

### New URL for GHL Custom Action:

**Old URL:**
```
https://tabit-worker.tony-578.workers.dev/catalog?api_key=wqiuefdy8y18e
```

**New URL:**
```
https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e
```

### Update in GHL:

1. Go to **Settings** → **AI Agents** → **[Your Agent]**
2. Click **"Agent Goals"** → **"Custom Actions"**
3. Edit the **"Fetch Menu"** action
4. Update **Endpoint URL** to:
   ```
   https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e
   ```
5. Click **"Test Webhook"**
6. Should now show **"Status: Success"** ✅
7. Click **"Save"**

---

## Step 6: Test Everything

### Test in PowerShell:

```powershell
# Health check
Invoke-WebRequest -Uri "https://api.khashokausa.info/health"

# Full catalog
Invoke-WebRequest -Uri "https://api.khashokausa.info/catalog?api_key=wqiuefdy8y18e"
```

### Test in Postman:

Import the updated `test.postman.json` collection and run tests.

### Test in Browser:

Visit:
```
https://api.khashokausa.info/health
```

Should see: `{"status":"healthy"}`

---

## Troubleshooting

### SSL Certificate Not Active

**Wait longer:** SSL provisioning can take 15-60 minutes
**Check in Cloudflare:** Workers & Pages → tabit-worker → Domains & Routes → SSL/TLS should show "Active"

### DNS Not Propagating

**Check nameservers:** Make sure you updated GoDaddy nameservers to Cloudflare
**Wait:** DNS propagation can take up to 48 hours
**Clear DNS cache:**
```powershell
ipconfig /flushdns
```

### Worker Not Responding

**Check deployment:** Make sure Worker is deployed and active
**Check domain:** Verify `api.khashokausa.info` is in the Domains list
**Check logs:** Workers & Pages → tabit-worker → Logs

### GHL Still Failing

**Test the exact URL:** Run PowerShell test above and confirm it works
**Check Cloudflare logs:** Look for GHL requests coming in
**Verify API key:** Make sure API key in URL is correct

---

## Alternative: Option 2 (Keep GoDaddy DNS)

If you prefer NOT to transfer DNS management to Cloudflare:

### In GoDaddy DNS Settings:

1. Go to GoDaddy → My Products → khashokausa.info → DNS
2. Add CNAME record:
   - **Type:** CNAME
   - **Name:** `api`
   - **Value:** `tabit-worker.tony-578.workers.dev`
   - **TTL:** 600 seconds
3. Save

### In Cloudflare Worker:

1. Workers & Pages → tabit-worker → Settings → Domains & Routes
2. Add Custom Domain: `api.khashokausa.info`
3. Wait for SSL certificate (5-15 minutes)

### Test:

```powershell
Invoke-WebRequest -Uri "https://api.khashokausa.info/health"
```

Should return 200 OK.

**This approach is simpler but you keep managing DNS in GoDaddy.**

---

## Success Indicators

✅ DNS propagates (check dnschecker.org)  
✅ SSL certificate active (green checkmark in Cloudflare)  
✅ Health endpoint works: `https://api.khashokausa.info/health`  
✅ Catalog endpoint works: `https://api.khashokausa.info/catalog?api_key=...`  
✅ GHL Custom Action test passes  
✅ Response time < 2 seconds  

---

## Next Steps After Setup

1. Update all documentation with new URL
2. Test all endpoints with new domain
3. Update GHL Custom Actions
4. Monitor Cloudflare logs for requests
5. Set up alerts in Cloudflare for errors

**Your integration is now production-ready with a business domain!** 🎉

