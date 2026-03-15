import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

export function AffiliatePayout({
  affiliateName = 'Partner',
  amount,
  period,
  referralCount,
  dashboardUrl,
}: {
  affiliateName?: string;
  amount: string;
  period: string;
  referralCount: number;
  dashboardUrl: string;
}) {
  return (
    <EmailShell
      preview={`Your affiliate payout of ${amount} is on its way!`}
      eyebrow="Payout Sent"
      title="Your commission is on its way!"
    >
      <Text style={text}>
        Hey {affiliateName}, great news — your affiliate earnings have been processed!
      </Text>
      <Section style={payoutCard}>
        <Section style={checkmark}>
          <Text style={checkmarkIcon}>&#x2713;</Text>
        </Section>
        <Text style={amountText}>{amount}</Text>
        <Text style={periodText}>Earnings for {period}</Text>
        <Hr style={hrInner} />
        <Section style={statsRow}>
          <Section style={stat}>
            <Text style={statValue}>{referralCount}</Text>
            <Text style={statLabel}>Referrals</Text>
          </Section>
          <Section style={stat}>
            <Text style={statValue}>{amount}</Text>
            <Text style={statLabel}>Total Earned</Text>
          </Section>
        </Section>
      </Section>
      <Section style={payoutDetails}>
        <Text style={detailsTitle}>Payout Details</Text>
        <Text style={detailsText}>
          Your earnings have been sent to your connected Stripe account. Funds typically arrive within 2-3 business days, depending on your bank.
        </Text>
      </Section>
      <Button href={dashboardUrl} style={button}>View Payout History</Button>
      <Hr style={hr} />
      <Text style={muted}>
        Keep sharing and earning! Your next payout will be processed at the end of the month.
      </Text>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const payoutCard = { backgroundColor: '#f0fdf4', borderRadius: '16px', padding: '24px', margin: '0 0 22px', border: '1px solid #bbf7d0', textAlign: 'center' as const };
const checkmark = { width: '48px', height: '48px', backgroundColor: '#16a34a', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const checkmarkIcon = { color: '#ffffff', fontSize: '24px', fontWeight: 700, margin: '0' };
const amountText = { color: '#16a34a', fontSize: '36px', fontWeight: 700, margin: '0 0 4px' };
const periodText = { color: '#6b7280', fontSize: '14px', margin: '0' };
const hrInner = { borderColor: '#bbf7d0', margin: '16px 0' };
const statsRow = { display: 'flex', justifyContent: 'space-around' };
const stat = { textAlign: 'center' as const };
const statValue = { color: '#0D1B2A', fontSize: '20px', fontWeight: 700, margin: '0' };
const statLabel = { color: '#6b7280', fontSize: '12px', margin: '4px 0 0' };
const payoutDetails = { backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', margin: '0 0 22px', border: '1px solid #e5e7eb' };
const detailsTitle = { color: '#0D1B2A', fontSize: '14px', fontWeight: 600, margin: '0 0 8px' };
const detailsText = { color: '#6b7280', fontSize: '13px', lineHeight: '20px', margin: '0' };
const button = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
