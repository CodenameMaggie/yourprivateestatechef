# Custom Domain Setup for YPEC

## Quick Setup Guide

### Step 1: Railway Dashboard

1. Go to https://railway.app/dashboard
2. Find your **yourprivateestatechef** project
3. Click on the service/deployment
4. Go to **Settings** tab
5. Scroll to **Networking** section
6. Click **+ Custom Domain**
7. Enter: `yourprivateestatechef.com`
8. Click **Add Domain**

Railway will show you the DNS records you need to add.

---

## Step 2: DNS Configuration

Railway will give you one of these options:

### Option A: CNAME Record (Recommended)

If Railway shows a CNAME target like `yourproject.up.railway.app`:

**Add to your DNS provider:**
```
Type: CNAME
Name: @  (or leave blank for root domain)
Value: yourproject.up.railway.app
TTL: 3600 (or Auto)
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: yourproject.up.railway.app
TTL: 3600
```

### Option B: A Record

If Railway provides IP addresses:

```
Type: A
Name: @
Value: [Railway IP Address]
TTL: 3600
```

---

## Step 3: Where to Add DNS Records

Depending on where you registered your domain:

### Namecheap
1. Log in to Namecheap
2. Dashboard → Domain List
3. Click "Manage" next to yourprivateestatechef.com
4. Go to "Advanced DNS" tab
5. Add the records shown by Railway

### GoDaddy
1. Log in to GoDaddy
2. My Products → Domains
3. Click DNS next to yourprivateestatechef.com
4. Add the records shown by Railway

### Cloudflare
1. Log in to Cloudflare
2. Select yourprivateestatechef.com
3. Go to DNS tab
4. Add the records shown by Railway
5. **Important:** Set proxy status to "DNS only" (grey cloud, not orange)

---

## Step 4: SSL Certificate

Railway automatically provisions SSL certificates via Let's Encrypt.

**No action needed** - SSL will be set up automatically once DNS propagates (usually 5-60 minutes).

---

## Step 5: Verify Setup

### Check DNS Propagation
```bash
# Check if CNAME is set
dig yourprivateestatechef.com CNAME

# Check if domain resolves
dig yourprivateestatechef.com

# Check from multiple locations
https://dnschecker.org
```

### Test HTTPS
Once DNS propagates (5-60 minutes):
```bash
curl -I https://yourprivateestatechef.com
```

Should return `200 OK` and show SSL certificate info.

---

## Complete DNS Configuration

Here's the **complete DNS setup** you'll need for YPEC:

### 1. Website (Railway)
```
Type: CNAME
Name: @
Value: [Railway provides this]
TTL: 3600
```

```
Type: CNAME
Name: www
Value: [Railway provides this]
TTL: 3600
```

### 2. Email (Forbes Command)

**MX Record:**
```
Type: MX
Name: @
Value: mail.yourprivateestatechef.com
Priority: 10
TTL: 3600
```

**Mail Server A Record:**
```
Type: A
Name: mail
Value: 5.78.139.9
TTL: 3600
```

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 ip4:5.78.139.9 -all
TTL: 3600
```

**DMARC Record:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourprivateestatechef.com
TTL: 3600
```

**DKIM (Generate on Forbes Command):**
```bash
# On Forbes Command server
ssh root@5.78.139.9
cd /etc/opendkim/keys
opendkim-genkey -s ypec -d yourprivateestatechef.com
cat ypec.txt
```

Then add to DNS:
```
Type: TXT
Name: ypec._domainkey
Value: [Copy from ypec.txt file]
TTL: 3600
```

---

## Troubleshooting

### "Domain not verified" in Railway

**Cause:** DNS not propagated yet
**Fix:** Wait 5-60 minutes, then click "Retry Verification" in Railway

### "SSL certificate pending"

**Cause:** Waiting for DNS + Let's Encrypt
**Fix:** Wait up to 30 minutes after DNS propagates

### "CNAME already exists" error

**Cause:** Conflicting DNS records
**Fix:** Remove any existing A or CNAME records for @ and www before adding new ones

### Site not loading

**Check:**
1. DNS propagated: `dig yourprivateestatechef.com`
2. Points to Railway: Should show Railway IP or CNAME
3. Railway deployment active: Check Railway dashboard
4. No Cloudflare proxy: Set to "DNS only" if using Cloudflare

---

## Testing Checklist

Once DNS propagates:

- [ ] `https://yourprivateestatechef.com` loads landing page
- [ ] `https://www.yourprivateestatechef.com` loads landing page
- [ ] SSL certificate shows valid (green lock icon)
- [ ] ANNIE chat widget appears
- [ ] Booking link works: `https://yourprivateestatechef.com/booking.html`
- [ ] Admin interfaces accessible:
  - [ ] `https://yourprivateestatechef.com/admin/chef-map.html`
  - [ ] `https://yourprivateestatechef.com/admin/lead-upload.html`

---

## Next Steps After Domain Setup

1. **Update .env on Forbes Command:**
```bash
ssh root@5.78.139.9
nano /root/mfs/api/ypec/.env
# Change BASE_URL to: https://yourprivateestatechef.com
```

2. **Update Email Templates:**
Update all bot email templates to use new domain

3. **Test Email Routing:**
Send test email to concierge@yourprivateestatechef.com

4. **Update Marketing Materials:**
- Business cards
- Email signatures
- Social media profiles

---

## Quick Reference

**Domain:** yourprivateestatechef.com
**Railway:** https://railway.app/dashboard
**DNS Checker:** https://dnschecker.org
**SSL Checker:** https://www.ssllabs.com/ssltest/

**Support:**
- Railway Docs: https://docs.railway.app/guides/public-networking#custom-domains
- DNS Propagation: Usually 5-60 minutes
- SSL Provisioning: Usually 10-30 minutes after DNS

---

**Last Updated:** 2026-01-12
**Status:** Ready to configure
