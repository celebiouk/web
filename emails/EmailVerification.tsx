import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

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
      <Text style={emailStyles.text}>
        Hi {userName}, thanks for signing up for cele.bio! Please verify your email address to get started.
      </Text>
      <Section style={emailStyles.buttonWrapper}>
        <Button href={verifyUrl} style={emailStyles.buttonAccent}>Verify Email Address</Button>
      </Section>
      <Text style={emailStyles.textSmall}>
        Or copy and paste this link into your browser:
      </Text>
      <Section style={linkBox}>
        <Text style={linkText}>{verifyUrl}</Text>
      </Section>
      <Hr style={emailStyles.hr} />
      <Section style={emailStyles.successBox}>
        <Text style={infoTitle}>&#x2705; Why verify?</Text>
        <Text style={infoText}>
          Verifying your email helps us secure your account and ensures you receive important updates about your creator business.
        </Text>
      </Section>
      <Text style={emailStyles.muted}>
        This link expires in {expiresIn}. If you didn't create an account, you can safely ignore this email.
      </Text>
    </EmailShell>
  );
}

const linkBox: React.CSSProperties = {
  backgroundColor: colors.gray100,
  borderRadius: '10px',
  padding: '14px 16px',
  margin: '0 0 24px',
  border: `1px solid ${colors.gray200}`,
  wordBreak: 'break-all',
};

const linkText: React.CSSProperties = {
  color: colors.gray600,
  fontSize: '12px',
  margin: '0',
  fontFamily: 'monospace',
};

const infoTitle: React.CSSProperties = {
  color: colors.success,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 8px',
};

const infoText: React.CSSProperties = {
  color: colors.gray600,
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
};
