# Email Template: Feedback Request

**Trigger:** 24 hours after event/session completed
**Sent By:** YPEC-Client bot
**Timing:** Automated, 24 hours post-event

---

## Plain Text Version (After Weekly Session)

```
Subject: How Was This Week?

[First Name],

How was this week's session with Chef [Name]?

We'd love to hear your thoughts—just a quick note or even a star rating helps us ensure we're delivering the YPEC standard.

Reply to this email, or if you prefer, you can fill out this short survey:
[Link to feedback form]

Thank you for being part of the YPEC family.

[Your name]
Client Relations
Your Private Estate Chef
```

---

## Plain Text Version (After Event/Dinner Party)

```
Subject: How Was [Event Name]?

[First Name],

How was [event name] last night? We'd love to hear your thoughts.

What stood out?
Was there anything we could improve for next time?

Simply reply to this email, or use this quick survey:
[Link to feedback form]

[Your name]
Client Relations
Your Private Estate Chef
```

---

## HTML Version (Universal)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Georgia, serif;
            line-height: 1.8;
            color: #2d1f2b;
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .header {
            text-align: center;
            padding-bottom: 30px;
            border-bottom: 1px solid #e8d0ca;
            margin-bottom: 30px;
        }
        .monogram {
            font-family: 'Times New Roman', serif;
            font-size: 24px;
            color: #d4a855;
            letter-spacing: 0.2em;
            margin-bottom: 10px;
        }
        .brand {
            font-family: 'Times New Roman', serif;
            font-size: 12px;
            color: #5d4a5a;
            letter-spacing: 0.3em;
            text-transform: uppercase;
        }
        .content {
            font-size: 15px;
            color: #3d2a3a;
            line-height: 1.9;
        }
        .content p {
            margin-bottom: 20px;
        }
        .cta {
            text-align: center;
            margin: 35px 0;
        }
        .cta a {
            display: inline-block;
            padding: 14px 35px;
            background: #c9a8a0;
            color: #2d1f2b;
            text-decoration: none;
            font-family: sans-serif;
            font-size: 11px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            transition: background 0.3s ease;
        }
        .cta a:hover {
            background: #d9bbb4;
        }
        .or {
            text-align: center;
            font-size: 13px;
            color: #9d8a8a;
            margin: 20px 0;
        }
        .signature {
            margin-top: 40px;
            color: #5d4a5a;
        }
        .footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #e8d0ca;
            text-align: center;
            font-size: 12px;
            color: #5d4a5a;
        }
        .footer a {
            color: #d4a855;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="monogram">YPEC</div>
        <div class="brand">Your Private Estate Chef</div>
    </div>

    <div class="content">
        <p>[First Name],</p>

        <p>How was [event/session description]? We'd love to hear your thoughts.</p>

        <div class="cta">
            <a href="[SURVEY_LINK]">Share Feedback</a>
        </div>

        <p class="or">— or —</p>

        <p style="text-align: center; color: #5d4a5a; font-size: 14px;">Simply reply to this email with your thoughts.</p>

        <p class="signature">
            Thank you for being part of the YPEC family.<br><br>
            [Your name]<br>
            <span style="font-size: 13px; color: #5d4a5a;">Client Relations</span><br>
            <span style="font-size: 13px; color: #d4a855;">Your Private Estate Chef</span>
        </p>
    </div>

    <div class="footer">
        <p>
            <strong>Your Private Estate Chef</strong><br>
            <a href="https://www.yourprivateestatechef.com">www.yourprivateestatechef.com</a>
        </p>
    </div>
</body>
</html>
```

---

## Feedback Form Questions

**For Weekly Sessions:**
1. Overall satisfaction (1-5 stars)
2. Food quality (1-5 stars)
3. Chef professionalism (1-5 stars)
4. Menu variety satisfaction (1-5 stars)
5. Any issues or concerns? (text)
6. What stood out this week? (text)
7. Anything to improve? (text)

**For Events/Dinner Parties:**
1. Overall satisfaction (1-5 stars)
2. Food quality (1-5 stars)
3. Presentation (1-5 stars)
4. Chef professionalism (1-5 stars)
5. Would you recommend YPEC? (Yes/No/Maybe)
6. What was the highlight of the evening? (text)
7. Any suggestions for next time? (text)

---

## Variables

- `[First Name]` - Household contact
- `[Chef Name]` - Chef's first name
- `[Event Name]` - Name of event (e.g., "your anniversary dinner", "this week's meal prep")
- `[event/session description]` - Context-specific (e.g., "last night's dinner party", "this week's meals")
- `[SURVEY_LINK]` - Link to Typeform/Google Form
- `[Your name]` - Client relations coordinator

---

## Automation Logic

```javascript
// Trigger: 24 hours after event.event_date
if (event.status === 'completed' && !event.feedback) {
  sendFeedbackRequest(event.household_id, event.event_id);
}

// Follow-up: If no response after 5 days, send gentle reminder
if (daysSince(feedbackRequestSent) === 5 && !event.feedback) {
  sendFeedbackReminder(event.household_id);
}
```

---

## Next Step

Log feedback in `ypec_events.feedback` and `ypec_events.household_rating`

If rating < 3.5 → Alert YPEC-Operations and YPEC-ChefRelations
