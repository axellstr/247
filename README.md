# Daily Stoic Quote Email Service

A professional email service that sends a different stoic quote to recipients every day, powered by Trigger.dev.

## Overview

This service automatically sends a daily email containing a curated stoic quote from philosophers like Marcus Aurelius, Seneca, and Epictetus. Each day, all recipients receive the same quote, ensuring consistency while providing daily wisdom.

## Features

- ✅ **Scheduled Daily Delivery**: Automatically sends emails every day at 8:00 AM UTC
- ✅ **30+ Curated Quotes**: Rotating collection of stoic wisdom
- ✅ **Professional Email Design**: Beautiful HTML email template with plain text fallback
- ✅ **Multiple Recipients**: Send to multiple recipients simultaneously
- ✅ **Reliable Execution**: Built-in retries and error handling
- ✅ **No Timeouts**: Long-running tasks supported

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

**For Local Development:**
Create or update your `.env` file:

```env
# Trigger.dev Secret Key (from your dashboard)
TRIGGER_SECRET_KEY=tr_dev_your_secret_key_here

# Email Service Configuration
# Option 1: Using Resend (recommended)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=Daily Stoic <quotes@yourdomain.com>

# Option 2: Using SendGrid
# SENDGRID_API_KEY=SG.your_sendgrid_key
# EMAIL_FROM=Daily Stoic <quotes@yourdomain.com>

# Recipients (comma-separated list)
STOIC_QUOTE_RECIPIENTS=recipient1@example.com,recipient2@example.com,recipient3@example.com
```

**Important:** For scheduled tasks to work in production, you also need to set these environment variables in your Trigger.dev dashboard:
1. Go to your project dashboard
2. Navigate to "Environment Variables" in the sidebar
3. Add `STOIC_QUOTE_RECIPIENTS`, `RESEND_API_KEY`, and `EMAIL_FROM` for the `dev` environment

### 3. Configure Email Service

Choose one of the following email providers:

#### Option A: Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add `RESEND_API_KEY` to your `.env`
4. Uncomment the Resend code in `sendStoicQuoteEmail` task

#### Option B: SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key
3. Add `SENDGRID_API_KEY` to your `.env`
4. Update the email sending code to use SendGrid API

#### Option C: Other Email Services

Update the `sendStoicQuoteEmail` task to use your preferred email service.

### 4. Start Development Server

```bash
npm run dev:trigger
```

The scheduled task will run automatically at 8:00 AM UTC each day.

## Usage

### Manual Testing

You can manually trigger the email task from the Trigger.dev dashboard:

1. Go to your project dashboard
2. Navigate to "Test" page
3. Select "send-stoic-quote-email" task
4. Use this payload:

```json
{
  "to": "test@example.com",
  "quote": "You have power over your mind - not outside events. Realize this, and you will find strength.",
  "author": "Marcus Aurelius",
  "date": "Monday, December 23, 2024"
}
```

### Scheduled Execution

The `dailyStoicQuote` task runs automatically every day at 8:00 AM UTC. It will:
1. Select a quote based on the day of the year
2. Send it to all recipients in `STOIC_QUOTE_RECIPIENTS`
3. Log the results

### Adding Recipients

Update the `STOIC_QUOTE_RECIPIENTS` environment variable:

```env
STOIC_QUOTE_RECIPIENTS=user1@example.com,user2@example.com,user3@example.com
```

Or integrate with a database to manage recipients dynamically.

## Email Template

The service sends beautifully formatted HTML emails with:
- Professional gradient header
- Elegant quote display
- Author attribution
- Responsive design
- Plain text fallback

## Deployment

When ready to deploy:

```bash
npm run deploy:trigger
```

Make sure to:
1. Set environment variables in the Trigger.dev dashboard
2. Configure your email service API keys
3. Update recipient list

## Customization

### Change Schedule

Edit the cron expression in `dailyStoicQuote`:

```typescript
cron: "0 8 * * *", // 8:00 AM UTC
// Change to your preferred time, e.g., "0 9 * * *" for 9:00 AM
```

### Add More Quotes

Add quotes to the `STOIC_QUOTES` array in `daily-stoic-quote.ts`.

### Customize Email Template

Modify the `emailHtml` template in the `sendStoicQuoteEmail` task.

## Monitoring

- View task runs in the Trigger.dev dashboard
- Check email delivery status
- Monitor scheduled task execution
- Review logs and errors

## Support

For issues or questions:
- Trigger.dev Docs: https://trigger.dev/docs
- Trigger.dev Discord: https://trigger.dev/discord

---

**Built with Trigger.dev** - Reliable background jobs with no timeouts and automatic retries.
