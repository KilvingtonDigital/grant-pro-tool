# GrantPro Setup & Start Guide

## Quick Start

### 1. Copy and fill in environment variables
```
copy .env.example .env.local
```
Edit `.env.local` and set at minimum:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-key-here"
```

### 2. Install dependencies
```
npm install
```

### 3. Run development server
```
npm run dev
```
App runs at: http://localhost:3010

### 4. Build for production
```
npm run build
npm start
```

---

## Google Maps API — Required APIs
Enable all of these on the same API key in Google Cloud Console:
- **Places API** (address autocomplete)
- **Geocoding API** (lat/lng + county/state lookup)
- **Maps Static API** (satellite imagery confirmation card)

Your existing RoofQuote key already has these enabled — just copy it.

---

## Lead Notification Setup

Configure one or more of these in `.env.local`:

### Option A: Webhook (Zapier, Make, CRM)
```
GRANT_LEAD_WEBHOOK_URL="https://hooks.zapier.com/hooks/catch/..."
```

### Option B: Email via Resend
```
RESEND_API_KEY="re_..."
GRANT_LEAD_TO_EMAIL="inspector@yourcompany.com"
GRANT_LEAD_FROM_EMAIL="grants@yourdomain.com"
```

### Option C: Google Sheets (via Apps Script)
Create a Google Apps Script web app that accepts POST requests and appends to a sheet:
```
GRANT_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/.../exec"
```

All three can be active simultaneously — GrantPro fans out to all configured destinations.

---

## Iframe Embedding

GrantPro is pre-configured to be embeddable on any website:

```html
<iframe
  src="https://your-grantpro-domain.vercel.app"
  width="100%"
  height="700"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);"
></iframe>
```

---

## Vercel Deployment

1. Push to a GitHub repo
2. Connect to Vercel
3. Set environment variables in Vercel dashboard (same as `.env.local`)
4. Deploy

For contractor-branded subdomains: add a custom domain in Vercel project settings.
