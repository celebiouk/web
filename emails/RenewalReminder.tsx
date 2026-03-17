import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

export function RenewalReminder({
  userName = 'there',
  planName = 'Pro',
  renewalDate,
  amount,
  billingUrl,
}: {
  userName?: string;
  planName?: string;
  renewalDate: string;
  amount: string;
  billingUrl: string;
}) {
  return (
    <EmailShell
      preview={`Your ${planName} subscription renews on ${renewalDate}`}
      eyebrow="Renewal Reminder"
      title="Your subscription is renewing soon"
    >
      <Text style={emailStyles.text}>
        Hi {userName}, just a friendly heads up that your cele.bio {planName} subscription will automatically renew soon.
      </Text>
      <Section style={renewalCard}>
        <Text style={renewalTitle}>Upcoming Renewal</Text>
        <Hr style={hrInner} />
        <Section style={detailRow}>
          <Text style={detailLabel}>Plan</Text>
          <Text style={detailValue}>{planName}</Text>
        </Section>
        <Section style={detailRow}>
          <Text style={detailLabel}>Amount</Text>
          <Text style={detailValue}>{amount}</Text>
        </Section>
        <Section style={detailRow}>
          <Text style={detailLabel}>Renewal Date</Text>
          <Text style={detailValueHighlight}>{renewalDate}</Text>
        </Section>
      </Section>
      <Text style={emailStyles.textSmall}>
        No action needed - your subscription will renew automatically. If you want to make any changes, you can manage your subscription from your billing settings.
      </Text>
      <Section style={emailStyles.buttonWrapper}>
        <Button href={billingUrl} style={emailStyles.buttonPrimary}>Manage Subscription</Button>
      </Section>
      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.muted}>
        Questions about your subscription? Reply to this email and we'll help you out.
      </Text>
    </EmailShell>
  );
}

const renewalCard: React.CSSProperties = {
  backgroundColor: colors.gray50,
  borderRadius: '16px',
  padding: '20px 24px',
  margin: '0 0 24px',
  border: `1px solid ${colors.gray200}`,
};

const renewalTitle: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  margin: '0',
};

const hrInner: React.CSSProperties = {
  borderColor: colors.gray200,
  margin: '14px 0',
};

const detailRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '10px',
};

const detailLabel: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '14px',
  margin: '0',
};

const detailValue: React.CSSProperties = {
  color: colors.dark,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0',
};

const detailValueHighlight: React.CSSProperties = {
  color: colors.cyan,
  fontSize: '14px',
  fontWeight: 700,
  margin: '0',
};
