import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

export function WelcomeEmail({
  userName = 'there',
  profileUrl,
}: {
  userName?: string;
  profileUrl: string;
}) {
  return (
    <EmailShell
      preview="Welcome to cele.bio — your creator journey starts now"
      eyebrow="Welcome"
      title={`Hey ${userName}, welcome to cele.bio!`}
    >
      <Text style={text}>
        We&apos;re thrilled to have you join thousands of creators building their online business with cele.bio.
      </Text>
      <Text style={text}>
        Your beautiful storefront is ready. Pick a template, add your products, and start earning — all in under 5 minutes.
      </Text>
      <Section style={listBox}>
        <Text style={item}>&#x2728; Choose from 10 stunning templates</Text>
        <Text style={item}>&#x1F4E6; Sell digital products instantly</Text>
        <Text style={item}>&#x1F4C5; Book 1:1 coaching sessions</Text>
        <Text style={item}>&#x1F4B3; Get paid via Stripe Connect</Text>
      </Section>
      <Button href={profileUrl} style={button}>Set Up Your Page</Button>
      <Hr style={hr} />
      <Text style={muted}>
        Questions? Reply to this email — we read every message and we&apos;re here to help you succeed.
      </Text>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const listBox = { backgroundColor: '#f8fafc', borderRadius: '16px', padding: '16px 18px', margin: '0 0 22px' };
const item = { color: '#0D1B2A', fontSize: '14px', lineHeight: '22px', margin: '0 0 8px' };
const button = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
