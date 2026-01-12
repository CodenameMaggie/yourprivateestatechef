# Email Template: Consultation Invitation

**Trigger:** Inquiry qualified by YPEC-Concierge
**Sent By:** YPEC-Concierge bot
**Timing:** Within 48 hours of inquiry

---

## Plain Text Version

```
Subject: Let's Begin the Conversation

[First Name],

We've reviewed your inquiry, and we'd be honored to learn more about your household.

I'd like to invite you to a private consultation—a conversation where we learn your family's rhythm, your preferences, and the way you gather around the table. From there, we can match you with a chef whose expertise aligns with your household.

Are you available for a 30-minute call on any of these dates:
• [Date/Time Option 1]
• [Date/Time Option 2]
• [Date/Time Option 3]

Simply reply with your preferred time, or suggest another day that works better.

Looking forward to speaking with you.

[Your name]
Private Inquiry Coordinator
Your Private Estate Chef

---
Your Private Estate Chef | By Introduction Only
www.yourprivateestatechef.com
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
        .options {
            background: #faf7f2;
            padding: 20px;
            margin: 25px 0;
            border-left: 3px solid #d4a855;
        }
        .options ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .options li {
            padding: 8px 0;
            font-size: 15px;
            color: #3d2a3a;
        }
        .options li:before {
            content: "•";
            color: #d4a855;
            font-weight: bold;
            display: inline-block;
            width: 1em;
            margin-left: -1em;
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

        <p>We've reviewed your inquiry, and we'd be honored to learn more about your household.</p>

        <p>I'd like to invite you to a private consultation—a conversation where we learn your family's rhythm, your preferences, and the way you gather around the table. From there, we can match you with a chef whose expertise aligns with your household.</p>

        <div class="options">
            <p style="margin-top: 0; margin-bottom: 10px; font-weight: 500;">Are you available for a 30-minute call:</p>
            <ul>
                <li>[Date/Time Option 1]</li>
                <li>[Date/Time Option 2]</li>
                <li>[Date/Time Option 3]</li>
            </ul>
        </div>

        <p>Simply reply with your preferred time, or suggest another day that works better.</p>

        <p class="signature">Looking forward to speaking with you.</p>

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
    </div>
</body>
</html>
```

---

## Variables

- `[First Name]` - Household contact first name
- `[Date/Time Option 1-3]` - Calendar availability slots
- `[Your name]` - Coordinator name

---

## Next Step

After consultation completed → YPEC-Operations begins chef matching
