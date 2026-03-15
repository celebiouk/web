import * as React from 'react';
import { Button, Hr, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

export function ProCancelled({
  creatorName = 'Creator',
  pricingUrl,
}: {
  creatorName?: string;
  pricingUrl: string;
}) {
  return (
    <EmailShell
      preview="Your cele.bio Pro subscription has ended"
      eyebrow="Subscription ended"
      title={`Your Pro plan has ended, ${creatorName}`}
    >
      <Text style={text}>Your account has been moved back to the Free plan. Your storefront stays live, but Pro-only features like courses, custom domains, and 0% commission are no longer active.</Text>
      <Text style={text}>If this was intentional, you’re all set. If not, you can upgrade again anytime in under a minute.</Text>
      <Button href={pricingUrl} style={button}>View plans</Button>
      <Hr style={hr} />
      <Text style={muted}>We keep billing simple: no dark patterns, no hoops to jump through.</Text>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 16px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const button = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
