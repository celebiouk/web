import * as React from 'react';
import { Button, Hr, Section, Text, Row, Column } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

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
      eyebrow="Security"
      title="Reset your password"
    >
      <Text style={emailStyles.text}>
        Hi {userName}, we received a request to reset your password. Click the button below to create a new one.
      </Text>

      <Section style={emailStyles.buttonWrapper}>
        <Button href={resetUrl} style={emailStyles.buttonPrimary}>
          Reset Password
        </Button>
      </Section>

      <Section style={timerBox}>
        <Row>
          <Column style={timerIconCol}>
            <Text style={timerIcon}>⏱</Text>
          </Column>
          <Column>
            <Text style={timerText}>
              This link expires in <strong>{expiresIn}</strong>. If you didn't request this, you can safely ignore this email.
            </Text>
          </Column>
        </Row>
      </Section>

      <Hr style={emailStyles.hr} />

      <Section style={securitySection}>
        <Text style={securityTitle}>🔒 Security Tips</Text>
        <Text style={securityItem}>• Use a strong, unique password (12+ characters)</Text>
        <Text style={securityItem}>• Mix letters, numbers, and symbols</Text>
        <Text style={securityItem}>• Never share your password with anyone</Text>
      </Section>

      <Text style={emailStyles.muted}>
        This link can only be used once. Need help? Reply to this email.
      </Text>
    </EmailShell>
  );
}

const timerBox: React.CSSProperties = {
  backgroundColor: colors.warningBg,
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '0 0 24px 0',
};

const timerIconCol: React.CSSProperties = {
  width: '32px',
  verticalAlign: 'top',
};

const timerIcon: React.CSSProperties = {
  fontSize: '20px',
  margin: 0,
  lineHeight: '24px',
};

const timerText: React.CSSProperties = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '22px',
  margin: 0,
};

const securitySection: React.CSSProperties = {
  backgroundColor: colors.gray50,
  borderRadius: '12px',
  padding: '20px',
  margin: '0 0 24px 0',
};

const securityTitle: React.CSSProperties = {
  color: colors.dark,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 12px 0',
};

const securityItem: React.CSSProperties = {
  color: colors.gray600,
  fontSize: '13px',
  lineHeight: '22px',
  margin: '0 0 4px 0',
};
