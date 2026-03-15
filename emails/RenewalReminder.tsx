import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

export function RenewalReminder({
  userName = 'there',
  planName = 'Pro',
  renewalDate,
  amount,
  billingUrl,
}: {
  userName?: string;
  planName?: string;
  renewalDate: string;
  amount: string;
  billingUrl: string;
}) {
  return (
    <EmailShell
      preview={`Your ${planName} subscription renews on ${renewalDate}`}
      eyebrow="Renewal Reminder"
      title="Your subscription is renewing soon"
    >
      <Text style={text}>
        Hi {userName}, just a friendly heads up that your cele.bio {planName} subscription will automatically renew soon.
      </Text>
      <Section style={renewalCard}>
        <Text style={renewalLabel}>Upcoming Renewal</Text>
        <Hr style={hrInner} />
        <Section style={detailRow}>
          <Text style={detailLabel}>Plan</Text>
          <Text style={detailValue}>{planName}</Text>
        </Section>
        <Section style={detailRow}>
          <Text style={detailLabel}>Amount</Text>
          <Text style={detailValue}>{amount}</Text>
        </Section>
        <Section style={detailRow}>
          <Text style={detailLabel}>Renewal Date</Text>
          <Text style={detailValueHighlight}>{renewalDate}</Text>
        </Section>
      </Section>
      <Text style={text}>
        No action needed — your subscription will renew automatically. If you want to make any changes, you can manage your subscription from your billing settings.
      </Text>
      <Button href={billingUrl} style={button}>Manage Subscription</Button>
      <Hr style={hr} />
      <Text style={muted}>
        Questions about your subscription? Reply to this email and we&apos;ll help you out.
      </Text>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const renewalCard = { backgroundColor: '#f8fafc', borderRadius: '16px', padding: '20px', margin: '0 0 22px', border: '1px solid #e5e7eb' };
const renewalLabel = { color: '#6b7280', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, margin: '0' };
const hrInner = { borderColor: '#e5e7eb', margin: '12px 0' };
const detailRow = { display: 'flex', justifyContent: 'space-between', margin: '0 0 8px' };
const detailLabel = { color: '#6b7280', fontSize: '14px', margin: '0' };
const detailValue = { color: '#0D1B2A', fontSize: '14px', fontWeight: 600, margin: '0' };
const detailValueHighlight = { color: '#1CE7D0', fontSize: '14px', fontWeight: 600, margin: '0' };
const button = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
