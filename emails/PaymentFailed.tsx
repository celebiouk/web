import * as React from 'react';
import { Button, Hr, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

export function PaymentFailed({
  creatorName = 'Creator',
  portalUrl,
}: {
  creatorName?: string;
  portalUrl: string;
}) {
  return (
    <EmailShell
      preview="Action required: update your payment method"
      eyebrow="Payment issue"
      title={`Update your card, ${creatorName}`}
    >
      <Text style={text}>We couldn’t process your latest cele.bio subscription payment. Stripe will retry automatically, but updating your payment method now is the fastest way to keep Pro active without interruption.</Text>
      <Button href={portalUrl} style={button}>Update payment method</Button>
      <Hr style={hr} />
      <Text style={muted}>Your subscription stays active during Stripe’s retry window, but please update your card soon to avoid losing Pro features.</Text>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const button = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
