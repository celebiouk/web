import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

export function EmailVerification({
  userName = 'there',
  verifyUrl,
  expiresIn = '24 hours',
}: {
  userName?: string;
  verifyUrl: string;
  expiresIn?: string;
}) {
  return (
    <EmailShell
      preview="Verify your email address for cele.bio"
      eyebrow="Verify Email"
      title="Confirm your email address"
    >
      <Text style={text}>
        Hi {userName}, thanks for signing up for cele.bio! Please verify your email address to get started.
      </Text>
      <Section style={buttonWrapper}>
        <Button href={verifyUrl} style={button}>Verify Email Address</Button>
      </Section>
      <Text style={textMuted}>
        Or copy and paste this link into your browser:
      </Text>
      <Section style={linkBox}>
        <Text style={linkText}>{verifyUrl}</Text>
      </Section>
      <Hr style={hr} />
      <Section style={infoBox}>
        <Text style={infoTitle}>Why verify?</Text>
        <Text style={infoText}>
          Verifying your email helps us secure your account and ensures you receive important updates about your creator business.
        </Text>
      </Section>
      <Text style={muted}>
        This link expires in {expiresIn}. If you didn&apos;t create an account, you can safely ignore this email.
      </Text>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const textMuted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px', margin: '0 0 8px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const buttonWrapper = { textAlign: 'center' as const, margin: '24px 0' };
const button = { backgroundColor: '#1CE7D0', color: '#0D1B2A', borderRadius: '14px', padding: '16px 32px', fontWeight: 700, textDecoration: 'none', display: 'inline-block', fontSize: '16px' };
const linkBox = { backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', margin: '0 0 22px', border: '1px solid #e5e7eb', wordBreak: 'break-all' as const };
const linkText = { color: '#6b7280', fontSize: '12px', margin: '0', fontFamily: 'monospace' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
const infoBox = { backgroundColor: '#ecfdf5', borderRadius: '12px', padding: '16px', margin: '0 0 18px', border: '1px solid #a7f3d0' };
const infoTitle = { color: '#065f46', fontSize: '14px', fontWeight: 600, margin: '0 0 8px' };
const infoText = { color: '#047857', fontSize: '13px', lineHeight: '20px', margin: '0' };
