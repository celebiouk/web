import * as React from 'react';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { APP_URL } from '@/lib/constants';
import { ProWelcome } from '../../emails/ProWelcome';
import { ProCancelled } from '../../emails/ProCancelled';
import { PaymentFailed } from '../../emails/PaymentFailed';
import { PaymentReceipt } from '../../emails/PaymentReceipt';
import { UpgradeNudge } from '../../emails/UpgradeNudge';

let resendClient: Resend | null = null;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

async function sendReactEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping billing email:', subject);
    return { success: false };
  }

  try {
    const html = await render(react);
    await resend.emails.send({
      from: 'cele.bio <billing@cele.bio>',
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send billing email', subject, error);
    return { success: false };
  }
}

export async function sendProWelcomeEmail(to: string, creatorName?: string) {
  return sendReactEmail({
    to,
    subject: 'Welcome to Pro! Your new features are live',
    react: React.createElement(ProWelcome, {
      creatorName,
      billingUrl: `${APP_URL}/dashboard/settings/billing`,
    }),
  });
}

export async function sendProCancelledEmail(to: string, creatorName?: string) {
  return sendReactEmail({
    to,
    subject: 'Your Pro subscription has ended',
    react: React.createElement(ProCancelled, {
      creatorName,
      pricingUrl: `${APP_URL}/pricing`,
    }),
  });
}

export async function sendPaymentFailedEmail(to: string, creatorName: string | undefined, portalUrl: string) {
  return sendReactEmail({
    to,
    subject: 'Action required: update your payment method',
    react: React.createElement(PaymentFailed, {
      creatorName,
      portalUrl,
    }),
  });
}

export async function sendPaymentReceiptEmail(params: {
  to: string;
  creatorName?: string;
  amount: string;
  invoiceDate: string;
  invoiceUrl: string;
  planLabel: string;
}) {
  return sendReactEmail({
    to: params.to,
    subject: `Your ${params.planLabel} receipt`,
    react: React.createElement(PaymentReceipt, {
      creatorName: params.creatorName,
      amount: params.amount,
      invoiceDate: params.invoiceDate,
      invoiceUrl: params.invoiceUrl,
      planLabel: params.planLabel,
    }),
  });
}

export async function sendUpgradeNudgeEmail(params: {
  to: string;
  creatorName?: string;
  saleCount: number;
  revenue: string;
  commission: string;
}) {
  return sendReactEmail({
    to: params.to,
    subject: 'You are making sales — go Pro to keep 100%',
    react: React.createElement(UpgradeNudge, {
      creatorName: params.creatorName,
      saleCount: params.saleCount,
      revenue: params.revenue,
      commission: params.commission,
      pricingUrl: `${APP_URL}/pricing`,
    }),
  });
}
