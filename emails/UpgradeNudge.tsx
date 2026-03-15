import * as React from 'react';
import { Button, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

export function UpgradeNudge({
  creatorName = 'Creator',
  saleCount,
  revenue,
  commission,
  pricingUrl,
}: {
  creatorName?: string;
  saleCount: number;
  revenue: string;
  commission: string;
  pricingUrl: string;
}) {
  return (
    <EmailShell
      preview="You’re making sales — keep more of each one with Pro"
      eyebrow="Upgrade opportunity"
      title={`You’ve made ${saleCount} sales, ${creatorName}`}
    >
      <Text style={text}>Momentum is a great time to upgrade. On the Free plan, cele.bio takes 8% commission on each sale. Pro removes that fee completely.</Text>
      <Section style={statsBox}>
        <Text style={stat}>Revenue so far: <strong>{revenue}</strong></Text>
        <Text style={stat}>Commission paid: <strong>{commission}</strong></Text>
      </Section>
      <Text style={text}>If you keep selling, Pro quickly pays for itself.</Text>
      <Button href={pricingUrl} style={button}>Go Pro and keep 100%</Button>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 16px' };
const statsBox = { backgroundColor: '#ecfeff', borderRadius: '16px', padding: '18px', margin: '0 0 18px' };
const stat = { color: '#0D1B2A', fontSize: '15px', lineHeight: '24px', margin: '0 0 8px' };
const button = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
