# Stripe Payment Integration - Setup Guide

## Current Status
✅ **Stripe integration code is READY** - bookings work without payment for now
🔒 **Payment processing DISABLED** - will be enabled when you get your first paid client

## How It Works Now (FREE MODE)
- Bookings go through without requiring payment
- Consultation scheduling works normally
- System tracks service interest and pricing
- Ready to enable Stripe when needed

---

## Enable Stripe (When You're Ready for Paid Services)

### Step 1: Create Stripe Account
1. Go to https://stripe.com
2. Sign up for a free account
3. Complete business verification

### Step 2: Get Your API Keys
1. Log into Stripe Dashboard
2. Go to **Developers → API keys**
3. Copy your **Secret key** (starts with `sk_live_...` or `sk_test_...`)

### Step 3: Add to Railway
1. Go to Railway dashboard → Your Private Estate Chef project
2. **Variables** tab
3. Add new variable:
   ```
   STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
   ```
4. Save - Railway will auto-redeploy

### Step 4: Install Stripe Module (if needed)
```bash
cd api
npm install stripe
```

### Step 5: Test Payment
```bash
curl -X POST https://yourprivateestatechef.com/api/ypec/payments \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}'
```

Should return: `{"stripe_enabled":true,"message":"Stripe active"}`

---

## Pricing Structure (As Defined in Booking System)

| Service | Price | Deposit | Cancellation Policy |
|---------|-------|---------|-------------------|
| Consultation | FREE | None | 24hr notice |
| Private Dinner | From $800 | 50% | 7 days: full refund<br>3-6 days: 50%<br><3 days: no refund |
| Weekly Service | $1,500/month | First month | 30-day notice |
| Full-Time Chef | $6,000/month | First month | 60-day notice |

---

## Payment Flow

### Without Stripe (Current)
1. Customer fills booking form
2. Accepts cancellation policy
3. Booking confirmed immediately
4. No payment required
5. You invoice them manually later

### With Stripe Enabled
1. Customer fills booking form
2. Accepts cancellation policy
3. **NEW:** Redirected to Stripe checkout (for paid services)
4. Payment processed securely by Stripe
5. Booking confirmed after payment
6. Receipt emailed automatically

---

## Revenue Bot Integration

The Revenue bot (`ypec-revenue`) automatically:
- Tracks all paid bookings
- Creates invoices in Supabase
- Monitors payment status
- Sends weekly revenue reports to DAVE (CFO)
- Alerts on overdue payments

---

## Testing Stripe (Test Mode)

Use Stripe test cards:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Auth:** `4000 0025 0000 3155`

Any future date, any 3-digit CVC

---

## Security Notes

- ✅ Stripe keys are stored as Railway environment variables (secure)
- ✅ Payment processing handled entirely by Stripe (PCI compliant)
- ✅ No credit card data ever touches your servers
- ✅ Refunds processed through Stripe dashboard or API
- ✅ All transactions logged in Supabase for accounting

---

## Support

**Stripe Issues:**
https://stripe.com/support

**Railway Variables:**
https://railway.app/dashboard → yourprivateestatechef → Variables

**YPEC Payment Endpoint:**
POST https://yourprivateestatechef.com/api/ypec/payments
Actions: `status`, `create_checkout`, `verify_payment`, `refund`
