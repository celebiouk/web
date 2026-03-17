import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

export function OrderReceived({
  buyerName = 'there',
  productName,
  creatorName,
  amount,
  downloadUrl,
  receiptUrl,
}: {
  buyerName?: string;
  productName: string;
  creatorName: string;
  amount: string;
  downloadUrl?: string;
  receiptUrl: string;
}) {
  return (
    <EmailShell
      preview={`Order confirmed: ${productName}`}
      eyebrow="Order Confirmed"
      title={`Thanks for your purchase, ${buyerName}!`}
    >
      <Text style={emailStyles.text}>
        Your order is confirmed and your product is ready to access.
      </Text>
      <Section style={orderCard}>
        <Text style={orderLabel}>Order Summary</Text>
        <Hr style={hrInner} />
        <Section style={orderRow}>
          <Text style={productTitle}>{productName}</Text>
          <Text style={productCreator}>by {creatorName}</Text>
        </Section>
        <Hr style={hrInner} />
        <Section style={totalSection}>
          <Text style={totalLabel}>Total Paid</Text>
          <Text style={totalValue}>{amount}</Text>
        </Section>
      </Section>
      <Section style={emailStyles.buttonWrapper}>
        {downloadUrl ? (
          <Button href={downloadUrl} style={emailStyles.buttonAccent}>Download Your Product</Button>
        ) : (
          <Button href={receiptUrl} style={emailStyles.buttonAccent}>Access Your Purchase</Button>
        )}
      </Section>
      <Hr style={emailStyles.hr} />
      <Section style={emailStyles.card}>
        <Text style={helpTitle}>Need help?</Text>
        <Text style={emailStyles.muted}>
          If you have any questions about your purchase, you can reply to this email or contact the creator directly.
        </Text>
      </Section>
    </EmailShell>
  );
}

const orderCard: React.CSSProperties = {
  backgroundColor: colors.gray50,
  borderRadius: '16px',
  padding: '20px 24px',
  margin: '0 0 24px',
  border: `1px solid ${colors.gray200}`,
};

const orderLabel: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  margin: '0',
};

const hrInner: React.CSSProperties = {
  borderColor: colors.gray200,
  margin: '14px 0',
};

const orderRow: React.CSSProperties = {
  margin: '0',
};

const productTitle: React.CSSProperties = {
  color: colors.dark,
  fontSize: '17px',
  fontWeight: 600,
  margin: '0 0 4px',
};

const productCreator: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '14px',
  margin: '0',
};

const totalSection: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const totalLabel: React.CSSProperties = {
  color: colors.gray600,
  fontSize: '14px',
  fontWeight: 500,
  margin: '0',
};

const totalValue: React.CSSProperties = {
  color: colors.dark,
  fontSize: '20px',
  fontWeight: 700,
  margin: '0',
};

const helpTitle: React.CSSProperties = {
  color: colors.dark,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 8px',
};
