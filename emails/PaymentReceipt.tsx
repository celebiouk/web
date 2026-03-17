import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

export function PaymentReceipt({
  creatorName = 'Creator',
  amount,
  invoiceDate,
  invoiceUrl,
  planLabel,
}: {
  creatorName?: string;
  amount: string;
  invoiceDate: string;
  invoiceUrl: string;
  planLabel: string;
}) {
  return (
    <EmailShell
      preview="Your cele.bio subscription receipt"
      eyebrow="Payment Receipt"
      title={`Receipt for your ${planLabel} renewal`}
    >
      <Text style={emailStyles.text}>
        Thanks for being Pro, {creatorName}. Your latest subscription payment was successful.
      </Text>
      <Section style={receiptCard}>
        <Section style={receiptRow}>
          <Text style={receiptLabel}>Plan</Text>
          <Text style={receiptValue}>{planLabel}</Text>
        </Section>
        <Hr style={hrInner} />
        <Section style={receiptRow}>
          <Text style={receiptLabel}>Amount</Text>
          <Text style={receiptValueBold}>{amount}</Text>
        </Section>
        <Hr style={hrInner} />
        <Section style={receiptRow}>
          <Text style={receiptLabel}>Date</Text>
          <Text style={receiptValue}>{invoiceDate}</Text>
        </Section>
      </Section>
      <Section style={emailStyles.buttonWrapper}>
        <Button href={invoiceUrl} style={emailStyles.buttonPrimary}>Download Invoice PDF</Button>
      </Section>
      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.muted}>
        This receipt was generated automatically. If you have questions about your billing, visit your account settings.
      </Text>
    </EmailShell>
  );
}

const receiptCard: React.CSSProperties = {
  backgroundColor: colors.gray50,
  borderRadius: '16px',
  padding: '24px',
  margin: '0 0 24px',
  border: `1px solid ${colors.gray200}`,
};

const receiptRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const hrInner: React.CSSProperties = {
  borderColor: colors.gray200,
  margin: '14px 0',
};

const receiptLabel: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  margin: '0',
};

const receiptValue: React.CSSProperties = {
  color: colors.dark,
  fontSize: '15px',
  fontWeight: 500,
  margin: '0',
};

const receiptValueBold: React.CSSProperties = {
  color: colors.dark,
  fontSize: '18px',
  fontWeight: 700,
  margin: '0',
};
