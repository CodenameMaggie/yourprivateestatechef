# Email Template: Inquiry Acknowledgment

**Trigger:** New inquiry received at private@yourprivateestatechef.com
**Sent By:** YPEC-Concierge bot
**Timing:** Within 4 hours (promise: 48 hours)

---

## Plain Text Version

```
Subject: Your Inquiry - Your Private Estate Chef

[First Name],

Thank you for reaching out to Your Private Estate Chef.

We've received your inquiry and will review it personally within the next 48 hours. We serve a limited number of households each season, and each engagement begins with a private consultation to understand your family, your table, and your preferences.

If your household aligns with our current availability and service area, we'll reach out to schedule a conversation.

Until then,

[Your name]
Private Inquiry Coordinator
Your Private Estate Chef

---
Your Private Estate Chef | By Introduction Only
www.yourprivateestatechef.com
Part of the Sovereign Economy
```

---

## HTML Version

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
        .signature {
            margin-top: 40px;
            font-style: italic;
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

        <p>Thank you for reaching out to Your Private Estate Chef.</p>

        <p>We've received your inquiry and will review it personally within the next 48 hours. We serve a limited number of households each season, and each engagement begins with a private consultation to understand your family, your table, and your preferences.</p>

        <p>If your household aligns with our current availability and service area, we'll reach out to schedule a conversation.</p>

        <p class="signature">Until then,</p>

        <p>
            [Your name]<br>
            <span style="font-size: 13px; color: #5d4a5a;">Private Inquiry Coordinator</span><br>
            <span style="font-size: 13px; color: #d4a855;">Your Private Estate Chef</span>
        </p>
    </div>

    <div class="footer">
        <p>
            <strong>Your Private Estate Chef</strong><br>
            By Introduction Only<br>
            <a href="https://www.yourprivateestatechef.com">www.yourprivateestatechef.com</a>
        </p>
        <p style="font-size: 11px; color: #9d8a8a; margin-top: 20px;">
            Part of the Sovereign Economy
        </p>
    </div>
</body>
</html>
```

---

## Variables

- `[First Name]` - Extract from inquiry email
- `[Your name]` - Bot sends as "The YPEC Team" or human coordinator name

---

## Next Step

If qualified → Send "Consultation Invitation" (Template 02)
If not qualified → Send "Polite Decline" (Template 02b)
