import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

export function SaleNotification({
  creatorName = 'Creator',
  productName,
  buyerName,
  amount,
  commission,
  netAmount,
  dashboardUrl,
}: {
  creatorName?: string;
  productName: string;
  buyerName: string;
  amount: string;
  commission: string;
  netAmount: string;
  dashboardUrl: string;
}) {
  return (
    <EmailShell
      preview={`You just made a sale! ${productName} - ${amount}`}
      eyebrow="New Sale"
      title="Cha-ching! You made a sale"
    >
      <Section style={celebrationBox}>
        <Text style={celebrationEmoji}>&#x1F4B8;</Text>
      </Section>
      <Text style={emailStyles.text}>
        Hey {creatorName}, great news - someone just purchased your product!
      </Text>
      <Section style={saleCard}>
        <Text style={productTitle}>{productName}</Text>
        <Text style={buyerInfo}>Purchased by {buyerName}</Text>
        <Hr style={hrSuccess} />
        <Section style={amountGrid}>
          <Section style={amountRow}>
            <Text style={amountLabel}>Sale Price</Text>
            <Text style={amountValue}>{amount}</Text>
          </Section>
          <Section style={amountRow}>
            <Text style={amountLabel}>Platform Fee</Text>
            <Text style={amountValueMuted}>-{commission}</Text>
          </Section>
          <Hr style={hrDashed} />
          <Section style={amountRowTotal}>
            <Text style={amountLabelBold}>Your Earnings</Text>
            <Text style={amountValueBold}>{netAmount}</Text>
          </Section>
        </Section>
      </Section>
      <Section style={emailStyles.buttonWrapper}>
        <Button href={dashboardUrl} style={emailStyles.buttonAccent}>View Order Details</Button>
      </Section>
      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.muted}>
        Funds will be transferred to your connected Stripe account according to your payout schedule.
      </Text>
    </EmailShell>
  );
}

const celebrationBox: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '8px',
};

const celebrationEmoji: React.CSSProperties = {
  fontSize: '48px',
  margin: '0',
};

const saleCard: React.CSSProperties = {
  backgroundColor: colors.successBg,
  borderRadius: '16px',
  padding: '24px',
  margin: '0 0 24px',
};

const productTitle: React.CSSProperties = {
  color: colors.dark,
  fontSize: '18px',
  fontWeight: 700,
  margin: '0 0 4px',
};

const buyerInfo: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '14px',
  margin: '0',
};

const hrSuccess: React.CSSProperties = {
  borderColor: colors.success,
  opacity: 0.2,
  margin: '18px 0',
};

const amountGrid: React.CSSProperties = {
  margin: '0',
};

const amountRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '10px',
};

const amountRowTotal: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const hrDashed: React.CSSProperties = {
  borderColor: colors.success,
  borderStyle: 'dashed',
  opacity: 0.3,
  margin: '12px 0',
};

const amountLabel: React.CSSProperties = {
  color: colors.gray600,
  fontSize: '14px',
  margin: '0',
};

const amountLabelBold: React.CSSProperties = {
  color: colors.dark,
  fontSize: '15px',
  fontWeight: 700,
  margin: '0',
};

const amountValue: React.CSSProperties = {
  color: colors.gray700,
  fontSize: '14px',
  fontWeight: 500,
  margin: '0',
};

const amountValueMuted: React.CSSProperties = {
  color: colors.gray400,
  fontSize: '14px',
  margin: '0',
};

const amountValueBold: React.CSSProperties = {
  color: colors.success,
  fontSize: '22px',
  fontWeight: 700,
  margin: '0',
};
