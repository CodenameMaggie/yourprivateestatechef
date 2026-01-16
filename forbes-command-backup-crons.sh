#!/bin/bash
# ============================================================================
# FORBES COMMAND BACKUP CRON JOBS FOR YPEC
# Install these on Forbes Command server (5.78.139.9) as redundancy
# ============================================================================

# YPEC Railway URL
YPEC_URL="https://yourprivateestatechef.com"

# ============================================================================
# BACKUP CRON SCHEDULE - Add to Forbes Command /etc/crontab
# ============================================================================

# Daily 9:05 AM - Send queued emails (5 min after Railway cron)
# 5 9 * * * root curl -X POST ${YPEC_URL}/api/ypec/email-sender -H "Content-Type: application/json" -d '{"action":"send_queued"}' >> /var/log/ypec-backup-crons.log 2>&1

# Monday 10:05 AM - Culinary school outreach (5 min after Railway cron)
# 5 10 * * 1 root curl -X POST ${YPEC_URL}/api/ypec/culinary-outreach -H "Content-Type: application/json" -d '{"action":"run"}' >> /var/log/ypec-backup-crons.log 2>&1

# Tuesday 10:05 AM - B2B partnership outreach (5 min after Railway cron)
# 5 10 * * 2 root curl -X POST ${YPEC_URL}/api/ypec/partnership-outreach -H "Content-Type: application/json" -d '{"action":"run"}' >> /var/log/ypec-backup-crons.log 2>&1

# Daily 2:05 PM - Client lead follow-ups (5 min after Railway cron)
# 5 14 * * * root curl -X POST ${YPEC_URL}/api/ypec/client-leads -H "Content-Type: application/json" -d '{"action":"run"}' >> /var/log/ypec-backup-crons.log 2>&1

# Daily 6:05 PM - Daily YPEC summary to HENRY (5 min after Railway cron)
# 5 18 * * * root curl -X POST ${YPEC_URL}/api/ypec/operations -H "Content-Type: application/json" -d '{"action":"daily_summary"}' >> /var/log/ypec-backup-crons.log 2>&1

# Friday 4:05 PM - Weekly revenue report (5 min after Railway cron)
# 5 16 * * 5 root curl -X POST ${YPEC_URL}/api/ypec/revenue -H "Content-Type: application/json" -d '{"action":"weekly_report"}' >> /var/log/ypec-backup-crons.log 2>&1

# ============================================================================
# INSTALLATION INSTRUCTIONS FOR FORBES COMMAND
# ============================================================================

# 1. SSH into Forbes Command server:
#    ssh root@5.78.139.9

# 2. Create log file:
#    touch /var/log/ypec-backup-crons.log
#    chmod 644 /var/log/ypec-backup-crons.log

# 3. Edit crontab:
#    nano /etc/crontab

# 4. Add the cron lines above (uncommented)

# 5. Verify crontab syntax:
#    crontab -l

# 6. Monitor logs:
#    tail -f /var/log/ypec-backup-crons.log

# ============================================================================
# WHY BACKUP CRONS?
# ============================================================================

# PRIMARY SYSTEM: Railway runs crons at exact times (9:00 AM, 10:00 AM, etc.)
# BACKUP SYSTEM: Forbes Command runs same crons 5 minutes later (9:05 AM, 10:05 AM, etc.)

# BENEFITS:
# 1. If Railway is down, Forbes Command triggers the jobs
# 2. 5-minute delay prevents duplicate triggers (Railway would have run by then)
# 3. YPEC bots have deduplication, so even if both fire, no duplicate emails
# 4. Forbes Command server is highly stable (direct Linux box vs cloud platform)
# 5. Single point of monitoring - all YPEC activity logged on Forbes Command

# DEDUPLICATION SAFETY:
# - Email queue has unique dedup_key constraint
# - Even if both Railway and Forbes Command trigger the same campaign,
#   the second attempt will be rejected with "duplicate prevented" message
# - This is BY DESIGN - better to have redundant triggers than missed campaigns

# ============================================================================
# MONITORING
# ============================================================================

# Check if backup crons are firing:
# grep "EMAIL SENDING ACTIVATED" /var/log/ypec-backup-crons.log

# Check if Railway crons are working (backups should rarely fire):
# grep "duplicate" /var/log/ypec-backup-crons.log
# If you see lots of "duplicate prevented", it means Railway is working fine

# Check if Railway is down (backups should be sending emails):
# grep "emails_queued.*[1-9]" /var/log/ypec-backup-crons.log
# If backup crons are queueing emails, Railway might be down
