# Admin Login Setup Guide

## Status
✅ Admin login page created: `/admin.html`
✅ Admin dashboard created: `/dashboard.html`
✅ Authentication endpoint ready: `/api/ypec/operations` (action: admin_login)
⚠️ Database tables need to be created in Supabase

---

## Setup Instructions

### Step 1: Create Database Tables

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your YPEC project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the entire contents of `database/02-admin-tables.sql`
6. Click **Run** (or press Ctrl+Enter)

This creates:
- `ypec_staff` table (admin users)
- `ypec_admin_sessions` table (login sessions)
- Default admin accounts (see credentials below)

### Step 2: Access Admin Panel

**URL:** https://yourprivateestatechef.com/admin.html

**Default Credentials:**
```
Email: admin@yourprivateestatechef.com
Password: ypec2026
```

**Backup Admin:**
```
Email: system@maggieforbesstrategies.com
Password: mfs2026
```

⚠️ **IMPORTANT:** Change these passwords immediately after first login!

---

## Features

### Admin Login Page (`/admin.html`)
- Luxury Forbes Command branded interface
- Email/password authentication
- Session token generation
- Auto-redirect to dashboard
- Error handling

### Admin Dashboard (`/dashboard.html`)
- Real-time metrics from Forbes Command bots:
  - Active households
  - Active chefs
  - Upcoming events (next 7 days)
  - Pending inquiries
- Auto-refreshes every 30 seconds
- Quick action links
- Session management

---

## User Roles

The system supports 5 role types in `ypec_staff.role`:

| Role | Access Level | Purpose |
|------|--------------|---------|
| `admin` | Full system access | CEO/Owner level |
| `chef_manager` | Chef operations | Recruitment, scheduling, relations |
| `operations` | Event management | Scheduling, logistics, coordination |
| `finance` | Revenue & invoicing | Payments, reports, accounting |
| `marketing` | Lead generation | Campaigns, waitlist, referrals |

---

## Security Notes

### Current Implementation (Development)
- ⚠️ Passwords stored as plain text in `password_hash` column
- ⚠️ Simple token generation (timestamp + random)
- ✅ Session expiration (24 hours)
- ✅ Database-backed sessions

### Production Requirements (TODO)
1. **Install bcrypt for password hashing:**
   ```bash
   npm install bcryptjs
   ```

2. **Update admin_login function in `api/ypec/operations.js`:**
   ```javascript
   const bcrypt = require('bcryptjs');

   // When creating users:
   const hashedPassword = await bcrypt.hash(plainPassword, 10);

   // When verifying login:
   const isValid = await bcrypt.compare(password, staff.password_hash);
   ```

3. **Add password reset functionality**
4. **Implement HTTPS-only cookies** (instead of localStorage)
5. **Add rate limiting** to prevent brute force
6. **Enable 2FA** for admin accounts (optional)

---

## Adding New Admin Users

### Via SQL (Supabase SQL Editor)
```sql
INSERT INTO ypec_staff (full_name, email, password_hash, role, phone)
VALUES (
    'Jane Doe',
    'jane@yourprivateestatechef.com',
    'temporary123',  -- CHANGE IMMEDIATELY
    'operations',
    '555-0123'
);
```

### Via Future Admin UI (Coming Soon)
Dashboard will include user management panel for admins to:
- Create new staff accounts
- Reset passwords
- Assign roles
- Deactivate users

---

## Session Management

### Session Duration
- Default: 24 hours
- Configurable in `api/ypec/operations.js` line with `expires_at`

### Manual Session Cleanup
Run this in Supabase SQL Editor to remove expired sessions:
```sql
SELECT cleanup_expired_sessions();
```

### Automatic Cleanup (Recommended)
Add to `api/ypec/cron-config.js`:
```javascript
// Daily 2:00 AM - Clean up expired sessions
sessionCleanup: cron.schedule('0 2 * * *', async () => {
  const { data } = await getSupabase().rpc('cleanup_expired_sessions');
  console.log(`[CRON] Cleaned up ${data} expired sessions`);
})
```

---

## Troubleshooting

### "Invalid credentials" error
- Verify database tables exist: `SELECT * FROM ypec_staff;`
- Check email spelling (case-sensitive)
- Confirm password matches exactly

### Dashboard shows "0" for all metrics
- Ensure Forbes Command bots are running
- Check API health: `curl https://yourprivateestatechef.com/api/health`
- Verify Supabase environment variables in Railway

### Session expired immediately
- Check system time is correct
- Verify `ypec_admin_sessions` table exists
- Inspect session expiration: `SELECT expires_at FROM ypec_admin_sessions;`

---

## Next Steps

After setup:
1. ✅ Run `database/02-admin-tables.sql` in Supabase
2. ✅ Login at `/admin.html` with default credentials
3. ⚠️ Change admin passwords immediately
4. 📝 Add new staff users as needed
5. 🔒 Implement bcrypt password hashing (production requirement)
6. 🚀 Begin using dashboard for daily operations

---

## Support

**Technical Issues:**
- Check Railway logs: `railway logs`
- Check Supabase logs: Project → Logs
- Verify environment variables in Railway dashboard

**YPEC System Status:**
GET `/api/health` → Server uptime
POST `/api/ypec/operations` + action: status → Bot metrics
