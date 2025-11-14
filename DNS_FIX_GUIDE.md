# DNS Resolution Fix Guide for Coolify/Contabo VPS

## Problem
Your bot is experiencing DNS resolution failures (`EAI_AGAIN`) when trying to connect to `api.tiny.com.br` in the Coolify/Contabo environment.

## Root Cause
Alpine Linux containers (used in your Node.js image) sometimes have DNS resolution issues, especially in virtualized environments. The error `getaddrinfo EAI_AGAIN` means the DNS server is not responding or timing out.

---

## Solutions (Try in Order)

### ✅ Solution 1: Configure DNS in Coolify (Recommended - Try First!)

**In Coolify Dashboard:**

1. Navigate to your application
2. Go to **Environment Variables** or **Advanced Settings**
3. Add these DNS settings:

**Option A: If Coolify supports Docker DNS settings:**
```yaml
dns:
  - 8.8.8.8       # Google Primary DNS
  - 8.8.4.4       # Google Secondary DNS
  - 1.1.1.1       # Cloudflare DNS
```

**Option B: Add as environment variable:**
Set `DNS_SERVERS=8.8.8.8,8.8.4.4,1.1.1.1`

**Option C: Edit the raw Docker settings (if available):**
Look for "Docker Compose Override" or "Raw Docker Config" and add:
```yaml
version: '3'
services:
  app:
    dns:
      - 8.8.8.8
      - 8.8.4.4
      - 1.1.1.1
```

### ✅ Solution 2: Code Changes (Already Applied!)

I've already updated the code to:
- **Force IPv4 resolution** (Alpine Linux sometimes has IPv6 issues)
- **Increased retry attempts** from 3 to 5
- **Increased retry delay** with exponential backoff (2s, 4s, 6s, 8s)
- **Increased timeout** to 60 seconds
- **Better error messages** for debugging

**Files Modified:**
- [application.service.ts](src/modules/application/application.service.ts)

### ✅ Solution 3: Fix DNS in Contabo VPS Directly

**SSH into your Contabo VPS and check DNS:**

```bash
# Check current DNS settings
cat /etc/resolv.conf

# If it looks wrong or empty, fix it:
sudo nano /etc/resolv.conf

# Add these lines:
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
```

**Test DNS resolution:**
```bash
# Test if DNS works
nslookup api.tiny.com.br
dig api.tiny.com.br

# Test from inside the container
docker exec -it <container-name> nslookup api.tiny.com.br
```

### ✅ Solution 4: Update Dockerfile (If Solution 1-3 Don't Work)

Add DNS resolution tools and configure DNS at build time:

```dockerfile
FROM node:20-alpine as builder

# Install DNS tools for troubleshooting
RUN apk add --no-cache bind-tools

ENV NODE_ENV build

USER node
WORKDIR /home/node

COPY package*.json ./

COPY --chown=node:node . .
RUN npm i \
    && npm run build

# ---

FROM node:20-alpine

# Install DNS tools in production image too
RUN apk add --no-cache bind-tools

ENV NODE_ENV production

USER node
WORKDIR /home/node

EXPOSE 3000

COPY --from=builder --chown=node:node /home/node/ ./

CMD ["npm", "run", "start:production"]
```

---

## Testing the Fixes

### After applying any solution, test with:

**1. Rebuild and redeploy in Coolify**
```bash
# In Coolify, trigger a new deployment
```

**2. Check logs for DNS retry messages:**
```bash
# You should see logs like:
# "DNS resolution failed..., retrying in 2000ms (attempt 1/5)..."
```

**3. Test DNS from inside the container:**
```bash
# Get into the running container
docker exec -it <container-name> sh

# Test DNS resolution
nslookup api.tiny.com.br
ping -c 3 api.tiny.com.br
```

---

## What Changed in the Code

### IPv4 Forcing
```typescript
const httpsAgent = new https.Agent({
  family: 4, // Force IPv4 (fixes Alpine DNS issues)
  keepAlive: true,
});
```

### Better Retry Logic
- **5 retries** instead of 3
- **Exponential backoff**: 2s, 4s, 6s, 8s, 10s
- **60-second timeout** instead of 30s
- More descriptive error messages

---

## Monitoring & Debugging

### Check if DNS is the issue:
```bash
# Inside the container
time nslookup api.tiny.com.br

# If it takes >5 seconds or fails, DNS is the issue
```

### Check Coolify logs:
```bash
# Look for these patterns:
# - "DNS resolution failed"
# - "EAI_AGAIN"
# - "ETIMEDOUT"
# - "getaddrinfo"
```

### Common DNS Issues in VPS:
1. **systemd-resolved conflicts** - Try disabling it
2. **IPv6 enabled but broken** - Disable IPv6 or force IPv4 (already done in code)
3. **Firewall blocking DNS** - Check port 53 UDP/TCP
4. **VPS provider DNS issues** - Use public DNS (8.8.8.8, 1.1.1.1)

---

## Quick Fix Checklist

- [ ] Add DNS servers in Coolify (Solution 1)
- [ ] Redeploy the application with updated code (Solution 2 - already in code)
- [ ] Test DNS resolution inside container
- [ ] Check VPS `/etc/resolv.conf` (Solution 3)
- [ ] If all else fails, update Dockerfile (Solution 4)

---

## Expected Result

After applying the fixes, you should see:
```
DNS resolution failed for https://api.tiny.com.br/api2/nota.fiscal.emitir.php, retrying in 2000ms (attempt 1/5)...
DNS resolution failed for https://api.tiny.com.br/api2/nota.fiscal.emitir.php, retrying in 4000ms (attempt 2/5)...
[Success on attempt 3]
Invoice sent successfully
```

Instead of immediate failure after 3 attempts.

---

## Still Having Issues?

1. **Contact Contabo Support** - There might be VPS-level DNS blocking
2. **Check Coolify Community** - Others may have similar issues
3. **Try a different DNS** - Try 9.9.9.9 (Quad9) or your ISP's DNS
4. **Use a DNS proxy** - Set up a local DNS cache/proxy in the VPS

---

## Deployment Steps

1. **Commit the code changes:**
```bash
git add src/modules/application/application.service.ts
git commit -m "Fix DNS resolution issues for Contabo VPS - force IPv4, increase retries"
git push
```

2. **In Coolify:**
   - Add DNS servers (Solution 1)
   - Trigger new deployment
   - Monitor logs

3. **Test the webhook** to see if invoices send successfully

---

**Last Updated:** 2025-11-14
