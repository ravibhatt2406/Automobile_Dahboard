# Titan Auto — SMTP Provider Setup & Email Delivery Guide

This document outlines the configuration required to enable live external email delivery (password resets, OTP verification codes, and customer activation links) in the Titan Auto platform.

---

## 1. Current State: Simulated Mock Transport

- When `SMTP_HOST` is empty, `EmailService` runs in **simulated mock mode** (`jsonTransport: true`).
- In this mode, emails are logged in memory and recorded in the database `Notification` table with `deliveryStatus: 'SIMULATED_MOCK'`.
- **No emails leave the server.** To send real messages to customer and employee inboxes, you must configure a live SMTP provider below.

---

## 2. Supported Configuration Variables

Add or update these variables in `backend/.env`:

| Variable | Required | Default | Description |
|:---|:---:|:---:|:---|
| `EMAIL_PROVIDER` | No | `auto` | Set to `smtp` to enforce real SMTP delivery, or `mock` to force simulation. |
| `SMTP_HOST` | **Yes** | _empty_ | Hostname of the SMTP relay server (e.g. `smtp.sendgrid.net`). |
| `SMTP_PORT` | No | `587` | Port number (`587` for STARTTLS, `465` for SSL). |
| `SMTP_SECURE` | No | `false` | Set to `true` if using port `465`; `false` for port `587`. |
| `SMTP_USER` | **Yes** | _empty_ | Authenticated SMTP username or API key ID. |
| `SMTP_PASS` | **Yes** | _empty_ | Authenticated SMTP password or API key secret. |
| `EMAIL_FROM` | No | `"Titan Auto" <no-reply@titanauto.com>` | Sender display name and verified envelope address. |

---

## 3. Provider Setup Options

### Option A: Twilio SendGrid
1. Log in to [SendGrid](https://app.sendgrid.com/) and create an API Key under **Settings > API Keys** with **Mail Send** permissions.
2. Verify a Single Sender Identity or an entire Domain under **Settings > Sender Authentication**.
3. Set your `backend/.env`:
   ```ini
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=<YOUR_SENDGRID_API_KEY>
   EMAIL_FROM="Titan Auto Support" <verified-sender@yourdomain.com>
   ```

### Option B: Amazon Simple Email Service (SES)
1. In the AWS Management Console, verify your domain or email address in **Amazon SES**.
2. Go to **SES > SMTP Settings** and create SMTP Credentials (generates an SMTP username and password).
3. Set your `backend/.env`:
   ```ini
   EMAIL_PROVIDER=smtp
   SMTP_HOST=email-smtp.<aws-region>.amazonaws.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=<YOUR_SES_SMTP_USERNAME>
   SMTP_PASS=<YOUR_SES_SMTP_PASSWORD>
   EMAIL_FROM="Titan Auto" <verified-sender@yourdomain.com>
   ```

### Option C: Mailgun
1. In Mailgun, navigate to **Sending > Domains**, select your verified domain, and view the SMTP credentials.
2. Set your `backend/.env`:
   ```ini
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=postmaster@<your-domain>.mailgun.org
   SMTP_PASS=<YOUR_MAILGUN_SMTP_PASSWORD>
   EMAIL_FROM="Titan Auto" <notifications@yourdomain.com>
   ```

### Option D: Google Workspace (Dedicated App Password)
1. In the Google Admin console / Account Settings, ensure 2-Step Verification is active.
2. Generate an **App Password** under Security > App passwords.
3. Set your `backend/.env`:
   ```ini
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=notifications@yourdomain.com
   SMTP_PASS=<16_CHARACTER_APP_PASSWORD>
   EMAIL_FROM="Titan Auto" <notifications@yourdomain.com>
   ```

---

## 4. Sender Verification Note (Anti-Spam Compliance)

- **SPF & DKIM:** Ensure that the DNS records for the domain matching `EMAIL_FROM` include valid SPF and DKIM entries provided by your SMTP relay.
- If the sender domain is unverified, downstream mailbox providers (Gmail, Outlook, Yahoo) may reject messages or place them into Spam folders.

