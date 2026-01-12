# Email Template: Welcome to YPEC (Household)

**Trigger:** Household status = 'active' AND first engagement created
**Sent By:** YPEC-Client bot
**Timing:** 3-5 days before first chef visit

---

## Plain Text Version

```
Subject: Welcome to Your Private Estate Chef

[First Name],

We're honored to welcome your family to Your Private Estate Chef.

Your chef, [Chef Name], will arrive on [first date] at [time]. Before then, [he/she] will reach out to confirm your menu preferences and any final details.

A few things to know:

YOUR CHEF
[Chef Name] specializes in [expertise] and has [X] years of experience in private estate dining. [Brief personal note about chef—e.g., "Marie trained in Paris and has a particular love for seasonal French cuisine."]

WHAT TO EXPECT
Your chef will arrive, prepare your meals in your kitchen, and depart—leaving you with exceptional food and a pristine space. This is invisible excellence.

Your kitchen will be used respectfully, and everything will be returned exactly as it was found. Groceries will be [sourced by chef / provided by you—clarify based on arrangement].

COMMUNICATION
You can always reach us at private@yourprivateestatechef.com or reply to this email. We check in regularly, but never intrusively.

If you ever need to adjust your schedule, update preferences, or address anything at all, we're here.

FEEDBACK MATTERS
After your first few sessions, we'll ask for your honest feedback. This helps us ensure your experience reflects the YPEC standard: excellence, intimacy, and discretion.

Welcome to the table.

[Your name]
Client Relations
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
        .section {
            margin: 30px 0;
        }
        .section-title {
            font-family: 'Times New Roman', serif;
            font-size: 11px;
            letter-spacing: 0.25em;
            text-transform: uppercase;
            color: #d4a855;
            margin-bottom: 10px;
            font-weight: normal;
        }
        .section-content {
            font-size: 14px;
            color: #3d2a3a;
            line-height: 1.8;
        }
        .highlight {
            background: #faf7f2;
            padding: 20px;
            margin: 25px 0;
            border-left: 3px solid #d4a855;
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

        <p>We're honored to welcome your family to Your Private Estate Chef.</p>

        <div class="highlight">
            <p style="margin: 0;">Your chef, <strong>[Chef Name]</strong>, will arrive on <strong>[first date]</strong> at <strong>[time]</strong>. Before then, [he/she] will reach out to confirm your menu preferences and any final details.</p>
        </div>

        <div class="section">
            <h3 class="section-title">Your Chef</h3>
            <div class="section-content">
                <p>[Chef Name] specializes in [expertise] and has [X] years of experience in private estate dining. [Brief personal note about chef].</p>
            </div>
        </div>

        <div class="section">
            <h3 class="section-title">What to Expect</h3>
            <div class="section-content">
                <p>Your chef will arrive, prepare your meals in your kitchen, and depart—leaving you with exceptional food and a pristine space. This is invisible excellence.</p>
                <p>Your kitchen will be used respectfully, and everything will be returned exactly as it was found.</p>
            </div>
        </div>

        <div class="section">
            <h3 class="section-title">Communication</h3>
            <div class="section-content">
                <p>You can always reach us at <a href="mailto:private@yourprivateestatechef.com" style="color: #d4a855; text-decoration: none;">private@yourprivateestatechef.com</a> or reply to this email. We check in regularly, but never intrusively.</p>
            </div>
        </div>

        <div class="section">
            <h3 class="section-title">Feedback Matters</h3>
            <div class="section-content">
                <p>After your first few sessions, we'll ask for your honest feedback. This helps us ensure your experience reflects the YPEC standard: excellence, intimacy, and discretion.</p>
            </div>
        </div>

        <p class="signature">Welcome to the table.</p>

        <p>
            [Your name]<br>
            <span style="font-size: 13px; color: #5d4a5a;">Client Relations</span><br>
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

- `[First Name]` - Household contact
- `[Chef Name]` - Assigned chef's name
- `[first date]` - Date of first session
- `[time]` - Time of first session
- `[he/she]` - Chef's pronoun
- `[expertise]` - Chef's specialties (e.g., "French and Mediterranean cuisine")
- `[X]` - Chef's years of experience
- `[Brief personal note]` - 1 sentence about chef's background
- `[Your name]` - Client relations coordinator

---

## Next Step

Week 1: Send feedback request after first session (Template 05)
