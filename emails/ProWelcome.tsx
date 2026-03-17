import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

export function ProWelcome({
  creatorName = 'Creator',
  billingUrl,
}: {
  creatorName?: string;
  billingUrl: string;
}) {
  return (
    <EmailShell
      preview="Welcome to Pro - your new features are live"
      eyebrow="Welcome to Pro"
      title={`You're officially Pro, ${creatorName}!`}
      showSocial
    >
      <Text style={emailStyles.text}>
        Your upgrade is live. Courses, custom domains, advanced analytics, and 0% platform commission are now unlocked on your account.
      </Text>
      <Section style={emailStyles.cardHighlight}>
        <Text style={featureItem}>&#x2705; Launch unlimited courses</Text>
        <Text style={featureItem}>&#x2705; Use your own custom domain</Text>
        <Text style={featureItem}>&#x2705; Remove the 8% platform fee</Text>
        <Text style={{ ...featureItem, margin: 0 }}>&#x2705; Unlock advanced analytics and future bundle tools</Text>
      </Section>
      <Section style={emailStyles.buttonWrapper}>
        <Button href={billingUrl} style={emailStyles.buttonAccent}>Open Billing Settings</Button>
      </Section>
      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.muted}>
        Tip: if you're on yearly, you're saving 30% compared with monthly billing.
      </Text>
    </EmailShell>
  );
}

const featureItem: React.CSSProperties = {
  color: colors.dark,
  fontSize: '14px',
  lineHeight: '26px',
  margin: '0 0 8px',
};
