# YPEC Website Launch Checklist

## ✅ **COMPLETED**

### Site Files
- [x] Landing page (index.html)
- [x] Booking system (booking.html)
- [x] Chef map (admin/chef-map.html)
- [x] Lead upload (admin/lead-upload.html)
- [x] ANNIE chat widget (js/annie-chat-widget.js)
- [x] 404 error page (404.html)
- [x] Favicon (favicon.svg)
- [x] Robots.txt (SEO)

### Content
- [x] Meta tags (title, description, Open Graph)
- [x] Correct domain in meta tags
- [x] "Request Introduction" button → booking.html
- [x] All branding colors and fonts
- [x] Luxury, refined copy

---

## 🚀 **TO DO BEFORE LAUNCH**

### 1. Domain Setup (15 minutes)

#### Railway Dashboard
- [ ] Go to https://railway.app/dashboard
- [ ] Find "yourprivateestatechef" project
- [ ] Settings → Networking → "+ Custom Domain"
- [ ] Add: `yourprivateestatechef.com`
- [ ] Copy the CNAME record Railway provides

#### DNS Configuration (Your Domain Registrar)
- [ ] Log into your domain registrar (Namecheap/GoDaddy/Cloudflare)
- [ ] Add CNAME record:
  ```
  Type: CNAME
  Name: @
  Value: [Railway provides this - looks like "yourproject.up.railway.app"]
  TTL: 3600
  ```
- [ ] Add www CNAME record:
  ```
  Type: CNAME
  Name: www
  Value: [Same as above]
  TTL: 3600
  ```

#### Wait for Propagation
- [ ] Wait 5-60 minutes for DNS to propagate
- [ ] Railway will auto-verify and provision SSL certificate
- [ ] Check verification: https://railway.app/dashboard

#### Test
- [ ] Visit https://yourprivateestatechef.com
- [ ] Verify SSL certificate (green lock icon)
- [ ] Test https://www.yourprivateestatechef.com

---

### 2. Optional Enhancements (Nice to have)

#### Analytics (Optional)
- [ ] Set up Google Analytics 4
- [ ] Add tracking code to all pages
- [ ] Set up conversion goals (bookings)

#### SEO (Optional)
- [ ] Create sitemap.xml
- [ ] Submit to Google Search Console
- [ ] Submit to Bing Webmaster Tools

#### Social Media (Optional)
- [ ] Create Open Graph image (1200x630px)
- [ ] Update og:image in meta tags
- [ ] Test with Facebook Debugger
- [ ] Test with Twitter Card Validator

---

## 🧪 **TESTING CHECKLIST**

### Desktop Testing
- [ ] Chrome: Site loads correctly
- [ ] Safari: Site loads correctly
- [ ] Firefox: Site loads correctly
- [ ] All links work
- [ ] Smooth scrolling works
- [ ] ANNIE chat widget appears
- [ ] Chat widget opens/closes
- [ ] Booking system works (all 4 steps)
- [ ] Favicon appears in browser tab

### Mobile Testing
- [ ] iPhone Safari: Site loads correctly
- [ ] Android Chrome: Site loads correctly
- [ ] Mobile navigation works
- [ ] Touch interactions work
- [ ] Forms are mobile-friendly
- [ ] Chat widget works on mobile
- [ ] All text is readable

### Functionality Testing
- [ ] Click "Request an Introduction" → Goes to booking.html
- [ ] Complete booking form (all 4 steps)
- [ ] Submit booking → Shows success message
- [ ] ANNIE chat widget → Type message → Get response
- [ ] Admin pages accessible:
  - [ ] /admin/chef-map.html
  - [ ] /admin/lead-upload.html
- [ ] 404 page shows when visiting bad URL
- [ ] All internal links work
- [ ] No console errors (F12 → Console)

### Performance Testing
- [ ] PageSpeed Insights: Score >85
- [ ] GTmetrix: Grade A or B
- [ ] Mobile loading: <3 seconds
- [ ] Desktop loading: <2 seconds

### SEO Testing
- [ ] Google: "site:yourprivateestatechef.com" (after indexing)
- [ ] Title tag appears correctly in search
- [ ] Meta description appears correctly
- [ ] Robots.txt accessible: /robots.txt
- [ ] Favicon appears in search results

---

## 🔒 **SECURITY CHECKLIST**

- [ ] HTTPS enabled (SSL certificate active)
- [ ] No sensitive data in public files
- [ ] Admin pages not listed in robots.txt
- [ ] API endpoints secured (if applicable)
- [ ] No console warnings about insecure content
- [ ] Railway environment variables set

---

## 📱 **MARKETING CHECKLIST**

### Update All Materials
- [ ] Business cards: yourprivateestatechef.com
- [ ] Email signatures: yourprivateestatechef.com
- [ ] Social media bios: Update links
- [ ] Print materials: Update URLs

### Social Media Setup
- [ ] Facebook Business Page (if desired)
- [ ] Instagram Profile (if desired)
- [ ] LinkedIn Company Page (if desired)
- [ ] Link all to website

---

## 🎉 **GO LIVE CHECKLIST**

### Pre-Launch (Day Before)
- [ ] Final review of all content
- [ ] Test all forms one more time
- [ ] Verify DNS is fully propagated
- [ ] Verify SSL certificate is active
- [ ] Test on 3+ devices
- [ ] Screenshot working site for records

### Launch Day
- [ ] Announce to team
- [ ] Post on social media (if applicable)
- [ ] Send announcement email to existing contacts
- [ ] Monitor analytics for first 24 hours
- [ ] Check for any error reports

### Post-Launch (First Week)
- [ ] Monitor site uptime
- [ ] Check Google Search Console for crawl errors
- [ ] Review analytics for user behavior
- [ ] Collect feedback from test users
- [ ] Fix any reported issues

---

## 🔧 **QUICK FIXES FOR COMMON ISSUES**

### SSL Not Working
```bash
# Check if DNS propagated
dig yourprivateestatechef.com

# Wait for Railway to provision certificate (up to 30 min)
# Check Railway dashboard for status
```

### Site Not Loading
```bash
# Check DNS
dig yourprivateestatechef.com CNAME

# Should show Railway domain
# If not, recheck DNS settings
```

### Chat Widget Not Appearing
- Check browser console for errors (F12)
- Verify /js/annie-chat-widget.js exists
- Clear browser cache and reload

### Booking Form Not Working
- Check browser console for errors
- Verify booking.html file uploaded
- Test in incognito mode (no cache)

---

## 📊 **SUCCESS METRICS**

Track these after launch:

### Week 1
- Unique visitors
- Booking form submissions
- ANNIE chat widget usage
- Average time on site
- Bounce rate

### Month 1
- Total inquiries
- Conversion rate (visit → booking)
- Popular pages
- Traffic sources
- Mobile vs desktop ratio

---

## 🆘 **SUPPORT**

**Technical Issues:**
- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app
- DNS Checker: https://dnschecker.org

**Site Issues:**
- Check browser console (F12)
- Clear cache and cookies
- Try incognito/private mode
- Test different browser

---

## ✨ **THAT'S IT!**

Once you complete the domain setup (Step 1), your site will be live at:

**https://yourprivateestatechef.com**

Everything else is already done and ready to go! 🎯

---

**Last Updated:** 2026-01-12
**Status:** READY FOR DOMAIN SETUP
**Estimated Time to Launch:** 15 minutes + DNS propagation
