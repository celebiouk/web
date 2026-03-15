import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

export function PasswordReset({
  userName = 'there',
  resetUrl,
  expiresIn = '1 hour',
}: {
  userName?: string;
  resetUrl: string;
  expiresIn?: string;
}) {
  return (
    <EmailShell
      preview="Reset your cele.bio password"
      eyebrow="Password Reset"
      title="Reset your password"
    >
      <Text style={text}>
        Hi {userName}, we received a request to reset your password. Click the button below to create a new password.
      </Text>
      <Section style={buttonWrapper}>
        <Button href={resetUrl} style={button}>Reset Password</Button>
      </Section>
      <Section style={warningBox}>
        <Text style={warningIcon}>&#x23F3;</Text>
        <Text style={warningText}>
          This link expires in {expiresIn}. If you didn&apos;t request this, you can safely ignore this email.
        </Text>
      </Section>
      <Hr style={hr} />
      <Text style={muted}>
        For security, this link can only be used once. If you need to reset your password again, please request a new link.
      </Text>
      <Section style={securityTip}>
        <Text style={tipTitle}>Security Tips</Text>
        <Text style={tipText}>&#x2022; Use a strong, unique password</Text>
        <Text style={tipText}>&#x2022; Never share your password with anyone</Text>
        <Text style={tipText}>&#x2022; Enable two-factor authentication if available</Text>
      </Section>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px', margin: '0 0 18px' };
const buttonWrapper = { textAlign: 'center' as const, margin: '24px 0' };
const button = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '16px 32px', fontWeight: 700, textDecoration: 'none', display: 'inline-block', fontSize: '16px' };
const warningBox = { backgroundColor: '#fffbeb', borderRadius: '12px', padding: '16px', margin: '0 0 22px', border: '1px solid #fde68a', display: 'flex', alignItems: 'flex-start', gap: '12px' };
const warningIcon = { fontSize: '20px', margin: '0', lineHeight: '1' };
const warningText = { color: '#92400e', fontSize: '14px', lineHeight: '20px', margin: '0' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
const securityTip = { backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', margin: '0' };
const tipTitle = { color: '#0D1B2A', fontSize: '14px', fontWeight: 600, margin: '0 0 12px' };
const tipText = { color: '#6b7280', fontSize: '13px', lineHeight: '20px', margin: '0 0 4px' };
