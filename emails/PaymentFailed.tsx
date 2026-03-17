import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

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
      eyebrow="Payment Issue"
      title={`Update your card, ${creatorName}`}
    >
      <Section style={emailStyles.warningBox}>
        <Text style={warningIcon}>&#x26A0;&#xFE0F;</Text>
        <Text style={warningText}>
          We couldn't process your latest cele.bio subscription payment.
        </Text>
      </Section>
      <Text style={emailStyles.text}>
        Stripe will retry automatically, but updating your payment method now is the fastest way to keep Pro active without interruption.
      </Text>
      <Section style={emailStyles.buttonWrapper}>
        <Button href={portalUrl} style={emailStyles.buttonAccent}>Update Payment Method</Button>
      </Section>
      <Hr style={emailStyles.hr} />
      <Section style={emailStyles.card}>
        <Text style={noteTitle}>&#x1F4A1; Good to know</Text>
        <Text style={emailStyles.muted}>
          Your subscription stays active during Stripe's retry window, but please update your card soon to avoid losing Pro features.
        </Text>
      </Section>
    </EmailShell>
  );
}

const warningIcon: React.CSSProperties = {
  fontSize: '28px',
  margin: '0 0 12px',
  textAlign: 'center',
};

const warningText: React.CSSProperties = {
  color: colors.warning,
  fontSize: '15px',
  fontWeight: 600,
  margin: '0',
  textAlign: 'center',
};

const noteTitle: React.CSSProperties = {
  color: colors.dark,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 8px',
};
