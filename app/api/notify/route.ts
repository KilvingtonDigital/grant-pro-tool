import { NextRequest, NextResponse } from 'next/server';

/**
 * Lead Notification Route
 * Receives a completed grant lead and routes it to one or more destinations:
 *   1. Webhook URL (Zapier, Make, CRM, custom endpoint)
 *   2. Email via Resend
 *   3. Google Sheets via Apps Script webhook
 *
 * All three can run simultaneously if all env vars are set.
 * Gracefully skips any destination that isn't configured.
 */

export interface GrantLead {
  // Contact
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  // Property
  address: string;
  lat?: number;
  lng?: number;
  state?: string;
  county?: string;
  zipCode?: string;
  // Qualifying answers
  propertyType: string;
  isOwnerOccupied: boolean;
  annualPremium?: number;
  hasNCIUAPolicy?: boolean;
  hasHomesteadExemption?: boolean;
  homeBuiltBefore2008?: boolean;
  insuredValueUnder700k?: boolean;
  isLowModerateIncome?: boolean;
  // Results
  eligible: boolean;
  maxTotalGrant: number;
  programs: Array<{ programName: string; maxGrant: number; programUrl?: string }>;
  est5yrSavings: number;
  disqualifyReason?: string;
  submittedAt: string;
}

async function sendWebhook(lead: GrantLead, url: string) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  if (!res.ok) throw new Error(`Webhook failed: ${res.status}`);
}

async function sendEmail(lead: GrantLead) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const grantList = lead.programs.length > 0
    ? lead.programs.map((p) => `• ${p.programName} — up to $${p.maxGrant.toLocaleString()}${p.programUrl ? ` (${p.programUrl})` : ''}`).join('\n')
    : 'No active grant programs found for this property.';

  const subject = lead.eligible
    ? `🏆 New Grant Lead — ${lead.firstName} ${lead.lastName} — up to $${lead.maxTotalGrant.toLocaleString()} in grants`
    : `📋 New Grant Inquiry — ${lead.firstName} ${lead.lastName} (no active grants)`;

  await resend.emails.send({
    from: process.env.GRANT_LEAD_FROM_EMAIL ?? 'grants@grantpro.app',
    to: process.env.GRANT_LEAD_TO_EMAIL ?? '',
    subject,
    text: [
      `NEW FORTIFIED GRANT LEAD`,
      `========================`,
      ``,
      `Contact:`,
      `  Name: ${lead.firstName} ${lead.lastName}`,
      `  Email: ${lead.email}`,
      `  Phone: ${lead.phone ?? 'Not provided'}`,
      ``,
      `Property:`,
      `  Address: ${lead.address}`,
      `  State: ${lead.state ?? 'Unknown'}`,
      `  County: ${lead.county ?? 'Unknown'}`,
      `  ZIP: ${lead.zipCode ?? 'Unknown'}`,
      `  Type: ${lead.propertyType}`,
      `  Owner-Occupied: ${lead.isOwnerOccupied ? 'Yes' : 'No'}`,
      `  Annual Premium: ${lead.annualPremium ? '$' + lead.annualPremium.toLocaleString() : 'Not provided'}`,
      ``,
      `Grant Results:`,
      `  Eligible: ${lead.eligible ? 'YES' : 'NO'}`,
      `  Max Total Grant: $${lead.maxTotalGrant.toLocaleString()}`,
      `  Est. 5-Year Insurance Savings: $${lead.est5yrSavings.toLocaleString()}`,
      ``,
      `Programs:`,
      grantList,
      ``,
      lead.disqualifyReason ? `Ineligibility Reason:\n  ${lead.disqualifyReason}` : '',
      ``,
      `Submitted: ${lead.submittedAt}`,
    ].join('\n'),
  });
}

export async function POST(req: NextRequest) {
  try {
    const lead: GrantLead = await req.json();

    const results: { destination: string; ok: boolean; error?: string }[] = [];

    // Route 1: Generic webhook (Zapier, Make, CRM, etc.)
    const webhookUrl = process.env.GRANT_LEAD_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await sendWebhook(lead, webhookUrl);
        results.push({ destination: 'webhook', ok: true });
      } catch (e) {
        results.push({ destination: 'webhook', ok: false, error: (e as Error).message });
      }
    }

    // Route 2: Google Sheets via Apps Script
    const sheetsUrl = process.env.GRANT_SHEETS_WEBHOOK_URL;
    if (sheetsUrl) {
      try {
        await sendWebhook(lead, sheetsUrl);
        results.push({ destination: 'google_sheets', ok: true });
      } catch (e) {
        results.push({ destination: 'google_sheets', ok: false, error: (e as Error).message });
      }
    }

    // Route 3: Email via Resend
    if (process.env.RESEND_API_KEY && process.env.GRANT_LEAD_TO_EMAIL) {
      try {
        await sendEmail(lead);
        results.push({ destination: 'email', ok: true });
      } catch (e) {
        results.push({ destination: 'email', ok: false, error: (e as Error).message });
      }
    }

    const anySuccess = results.some((r) => r.ok) || results.length === 0;
    return NextResponse.json({ success: anySuccess, routes: results }, { status: anySuccess ? 200 : 500 });
  } catch (err: unknown) {
    console.error('[/api/notify]', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
