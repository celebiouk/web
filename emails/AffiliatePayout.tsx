import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

export function AffiliatePayout({
  affiliateName = 'Partner',
  amount,
  period,
  referralCount,
  dashboardUrl,
}: {
  affiliateName?: string;
  amount: string;
  period: string;
  referralCount: number;
  dashboardUrl: string;
}) {
  return (
    <EmailShell
      preview={`Your affiliate payout of ${amount} is on its way!`}
      eyebrow="Payout Sent"
      title="Your commission is on its way!"
    >
      <Text style={emailStyles.text}>
        Hey {affiliateName}, great news - your affiliate earnings have been processed!
      </Text>
      <Section style={payoutCard}>
        <Section style={checkmarkWrapper}>
          <Text style={checkmarkIcon}>&#x2713;</Text>
        </Section>
        <Text style={amountText}>{amount}</Text>
        <Text style={periodText}>Earnings for {period}</Text>
        <Hr style={hrSuccess} />
        <Section style={statsRow}>
          <Section style={stat}>
            <Text style={statValue}>{referralCount}</Text>
            <Text style={statLabel}>Referrals</Text>
          </Section>
          <Section style={stat}>
            <Text style={statValue}>{amount}</Text>
            <Text style={statLabel}>Total Earned</Text>
          </Section>
        </Section>
      </Section>
      <Section style={emailStyles.card}>
        <Text style={detailsTitle}>&#x1F4B0; Payout Details</Text>
        <Text style={emailStyles.muted}>
          Your earnings have been sent to your connected Stripe account. Funds typically arrive within 2-3 business days, depending on your bank.
        </Text>
      </Section>
      <Section style={emailStyles.buttonWrapper}>
        <Button href={dashboardUrl} style={emailStyles.buttonPrimary}>View Payout History</Button>
      </Section>
      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.muted}>
        Keep sharing and earning! Your next payout will be processed at the end of the month.
      </Text>
    </EmailShell>
  );
}

const payoutCard: React.CSSProperties = {
  backgroundColor: colors.successBg,
  borderRadius: '16px',
  padding: '28px',
  margin: '0 0 24px',
  textAlign: 'center',
};

const checkmarkWrapper: React.CSSProperties = {
  width: '56px',
  height: '56px',
  backgroundColor: colors.success,
  borderRadius: '50%',
  margin: '0 auto 20px',
};

const checkmarkIcon: React.CSSProperties = {
  color: colors.white,
  fontSize: '28px',
  fontWeight: 700,
  lineHeight: '56px',
  margin: '0',
};

const amountText: React.CSSProperties = {
  color: colors.success,
  fontSize: '40px',
  fontWeight: 700,
  margin: '0 0 4px',
  letterSpacing: '-0.02em',
};

const periodText: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '14px',
  margin: '0',
};

const hrSuccess: React.CSSProperties = {
  borderColor: colors.success,
  opacity: 0.2,
  margin: '20px 0',
};

const statsRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-around',
};

const stat: React.CSSProperties = {
  textAlign: 'center',
};

const statValue: React.CSSProperties = {
  color: colors.dark,
  fontSize: '22px',
  fontWeight: 700,
  margin: '0',
};

const statLabel: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '12px',
  fontWeight: 500,
  margin: '4px 0 0',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const detailsTitle: React.CSSProperties = {
  color: colors.dark,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 8px',
};
