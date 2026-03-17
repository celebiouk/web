import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

export function AffiliateWelcome({
  affiliateName = 'Partner',
  affiliateCode,
  commissionRate,
  affiliateUrl,
  dashboardUrl,
}: {
  affiliateName?: string;
  affiliateCode: string;
  commissionRate: string;
  affiliateUrl: string;
  dashboardUrl: string;
}) {
  return (
    <EmailShell
      preview="Welcome to the cele.bio Affiliate Program!"
      eyebrow="Affiliate Program"
      title={`Welcome to the program, ${affiliateName}!`}
      showSocial
    >
      <Text style={emailStyles.text}>
        You're officially a cele.bio affiliate partner! Start sharing and earning today.
      </Text>
      <Section style={affiliateCard}>
        <Text style={cardTitle}>Your Affiliate Details</Text>
        <Hr style={hrSuccess} />
        <Section style={detailRow}>
          <Text style={detailLabel}>Affiliate Code</Text>
          <Text style={codeText}>{affiliateCode}</Text>
        </Section>
        <Section style={detailRow}>
          <Text style={detailLabel}>Commission Rate</Text>
          <Text style={rateText}>{commissionRate}</Text>
        </Section>
        <Section style={detailRowLast}>
          <Text style={detailLabel}>Your Link</Text>
          <Text style={linkText}>{affiliateUrl}</Text>
        </Section>
      </Section>
      <Section style={emailStyles.card}>
        <Text style={howTitle}>How it works</Text>
        <Section style={step}>
          <Text style={stepNumber}>1</Text>
          <Text style={stepText}>Share your unique affiliate link</Text>
        </Section>
        <Section style={step}>
          <Text style={stepNumber}>2</Text>
          <Text style={stepText}>Someone signs up and subscribes to Pro</Text>
        </Section>
        <Section style={stepLast}>
          <Text style={stepNumber}>3</Text>
          <Text style={stepText}>You earn {commissionRate} on their subscription</Text>
        </Section>
      </Section>
      <Section style={emailStyles.buttonWrapper}>
        <Button href={dashboardUrl} style={emailStyles.buttonAccent}>Go to Affiliate Dashboard</Button>
      </Section>
      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.muted}>
        Track your referrals, earnings, and payouts in your affiliate dashboard. Commissions are paid out monthly via Stripe.
      </Text>
    </EmailShell>
  );
}

const affiliateCard: React.CSSProperties = {
  backgroundColor: colors.successBg,
  borderRadius: '16px',
  padding: '20px 24px',
  margin: '0 0 24px',
};

const cardTitle: React.CSSProperties = {
  color: colors.success,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0',
};

const hrSuccess: React.CSSProperties = {
  borderColor: colors.success,
  opacity: 0.2,
  margin: '14px 0',
};

const detailRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
};

const detailRowLast: React.CSSProperties = {
  ...detailRow,
  marginBottom: 0,
};

const detailLabel: React.CSSProperties = {
  color: colors.gray600,
  fontSize: '14px',
  margin: '0',
};

const codeText: React.CSSProperties = {
  color: colors.dark,
  fontSize: '15px',
  fontWeight: 700,
  fontFamily: 'monospace',
  backgroundColor: colors.white,
  padding: '6px 10px',
  borderRadius: '8px',
  margin: '0',
};

const rateText: React.CSSProperties = {
  color: colors.success,
  fontSize: '20px',
  fontWeight: 700,
  margin: '0',
};

const linkText: React.CSSProperties = {
  color: colors.cyan,
  fontSize: '13px',
  fontFamily: 'monospace',
  margin: '0',
  wordBreak: 'break-all',
};

const howTitle: React.CSSProperties = {
  color: colors.dark,
  fontSize: '16px',
  fontWeight: 700,
  margin: '0 0 18px',
};

const step: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  marginBottom: '14px',
};

const stepLast: React.CSSProperties = {
  ...step,
  marginBottom: 0,
};

const stepNumber: React.CSSProperties = {
  width: '28px',
  height: '28px',
  backgroundColor: colors.cyan,
  color: colors.dark,
  borderRadius: '50%',
  fontSize: '14px',
  fontWeight: 700,
  textAlign: 'center',
  lineHeight: '28px',
  margin: '0',
  flexShrink: 0,
};

const stepText: React.CSSProperties = {
  color: colors.gray700,
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};
