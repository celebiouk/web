import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

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
      eyebrow="Subscription Ended"
      title={`Your Pro plan has ended, ${creatorName}`}
    >
      <Section style={emailStyles.card}>
        <Text style={statusIcon}>&#x1F44B;</Text>
        <Text style={statusText}>You're now on the Free plan</Text>
      </Section>
      <Text style={emailStyles.text}>
        Your storefront stays live, but Pro-only features like courses, custom domains, and 0% commission are no longer active.
      </Text>
      <Text style={emailStyles.text}>
        If this was intentional, you're all set. If not, you can upgrade again anytime in under a minute.
      </Text>
      <Section style={emailStyles.buttonWrapper}>
        <Button href={pricingUrl} style={emailStyles.buttonPrimary}>View Plans</Button>
      </Section>
      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.muted}>
        We keep billing simple: no dark patterns, no hoops to jump through.
      </Text>
    </EmailShell>
  );
}

const statusIcon: React.CSSProperties = {
  fontSize: '32px',
  margin: '0 0 12px',
  textAlign: 'center',
};

const statusText: React.CSSProperties = {
  color: colors.gray600,
  fontSize: '15px',
  fontWeight: 500,
  margin: '0',
  textAlign: 'center',
};
