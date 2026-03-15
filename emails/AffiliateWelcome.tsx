import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

export function AffiliateWelcome({
  affiliateName = 'Partner',
  affiliateCode,
  commissionRate,
  affiliateUrl,
  dashboardUrl,
}: {
  affiliateName?: string;
  affiliateCode: string;
  commissionRate: string;
  affiliateUrl: string;
  dashboardUrl: string;
}) {
  return (
    <EmailShell
      preview="Welcome to the cele.bio Affiliate Program!"
      eyebrow="Affiliate Program"
      title={`Welcome to the program, ${affiliateName}!`}
    >
      <Text style={text}>
        You&apos;re officially a cele.bio affiliate partner! Start sharing and earning today.
      </Text>
      <Section style={affiliateCard}>
        <Text style={cardTitle}>Your Affiliate Details</Text>
        <Hr style={hrInner} />
        <Section style={detailRow}>
          <Text style={detailLabel}>Affiliate Code</Text>
          <Text style={codeText}>{affiliateCode}</Text>
        </Section>
        <Section style={detailRow}>
          <Text style={detailLabel}>Commission Rate</Text>
          <Text style={rateText}>{commissionRate}</Text>
        </Section>
        <Section style={detailRow}>
          <Text style={detailLabel}>Your Link</Text>
          <Text style={linkText}>{affiliateUrl}</Text>
        </Section>
      </Section>
      <Section style={howItWorks}>
        <Text style={howTitle}>How it works</Text>
        <Section style={step}>
          <Text style={stepNumber}>1</Text>
          <Text style={stepText}>Share your unique affiliate link</Text>
        </Section>
        <Section style={step}>
          <Text style={stepNumber}>2</Text>
          <Text style={stepText}>Someone signs up and subscribes to Pro</Text>
        </Section>
        <Section style={step}>
          <Text style={stepNumber}>3</Text>
          <Text style={stepText}>You earn {commissionRate} on their subscription</Text>
        </Section>
      </Section>
      <Button href={dashboardUrl} style={button}>Go to Affiliate Dashboard</Button>
      <Hr style={hr} />
      <Text style={muted}>
        Track your referrals, earnings, and payouts in your affiliate dashboard. Commissions are paid out monthly via Stripe.
      </Text>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const affiliateCard = { backgroundColor: '#f0fdf4', borderRadius: '16px', padding: '20px', margin: '0 0 22px', border: '1px solid #bbf7d0' };
const cardTitle = { color: '#065f46', fontSize: '14px', fontWeight: 600, margin: '0' };
const hrInner = { borderColor: '#bbf7d0', margin: '12px 0' };
const detailRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 12px' };
const detailLabel = { color: '#6b7280', fontSize: '14px', margin: '0' };
const codeText = { color: '#0D1B2A', fontSize: '16px', fontWeight: 700, fontFamily: 'monospace', backgroundColor: '#ffffff', padding: '4px 8px', borderRadius: '6px', margin: '0' };
const rateText = { color: '#16a34a', fontSize: '18px', fontWeight: 700, margin: '0' };
const linkText = { color: '#1CE7D0', fontSize: '13px', fontFamily: 'monospace', margin: '0', wordBreak: 'break-all' as const };
const howItWorks = { backgroundColor: '#f8fafc', borderRadius: '16px', padding: '20px', margin: '0 0 22px', border: '1px solid #e5e7eb' };
const howTitle = { color: '#0D1B2A', fontSize: '16px', fontWeight: 700, margin: '0 0 16px' };
const step = { display: 'flex', alignItems: 'flex-start', gap: '12px', margin: '0 0 12px' };
const stepNumber = { width: '24px', height: '24px', backgroundColor: '#1CE7D0', color: '#0D1B2A', borderRadius: '50%', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0', flexShrink: 0 };
const stepText = { color: '#374151', fontSize: '14px', lineHeight: '24px', margin: '0' };
const button = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
