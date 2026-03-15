import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

export function ProWelcome({
  creatorName = 'Creator',
  billingUrl,
}: {
  creatorName?: string;
  billingUrl: string;
}) {
  return (
    <EmailShell
      preview="Welcome to Pro — your new features are live"
      eyebrow="Welcome to Pro"
      title={`You’re officially Pro, ${creatorName}!`}
    >
      <Text style={text}>Your upgrade is live. Courses, custom domains, advanced analytics, and 0% platform commission are now unlocked on your account.</Text>
      <Section style={listBox}>
        <Text style={item}>✅ Launch unlimited courses</Text>
        <Text style={item}>✅ Use your own custom domain</Text>
        <Text style={item}>✅ Remove the 8% platform fee</Text>
        <Text style={item}>✅ Unlock advanced analytics and future bundle tools</Text>
      </Section>
      <Button href={billingUrl} style={button}>Open Billing Settings</Button>
      <Hr style={hr} />
      <Text style={muted}>Tip: if you’re on yearly, you’re saving 30% compared with monthly billing.</Text>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const listBox = { backgroundColor: '#f8fafc', borderRadius: '16px', padding: '16px 18px', margin: '0 0 22px' };
const item = { color: '#0D1B2A', fontSize: '14px', lineHeight: '22px', margin: '0 0 8px' };
const button = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
