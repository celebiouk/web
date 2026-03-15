import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

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
      <Text style={text}>
        Hey {creatorName}, great news — someone just purchased your product!
      </Text>
      <Section style={saleCard}>
        <Text style={productTitle}>{productName}</Text>
        <Text style={buyerInfo}>Purchased by {buyerName}</Text>
        <Hr style={hrInner} />
        <Section style={amountGrid}>
          <Text style={amountRow}>
            <span style={amountLabel}>Sale Price</span>
            <span style={amountValue}>{amount}</span>
          </Text>
          <Text style={amountRow}>
            <span style={amountLabel}>Platform Fee</span>
            <span style={amountValueMuted}>-{commission}</span>
          </Text>
          <Text style={amountRowTotal}>
            <span style={amountLabelBold}>Your Earnings</span>
            <span style={amountValueBold}>{netAmount}</span>
          </Text>
        </Section>
      </Section>
      <Button href={dashboardUrl} style={button}>View Order Details</Button>
      <Hr style={hr} />
      <Text style={muted}>
        Funds will be transferred to your connected Stripe account according to your payout schedule.
      </Text>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const saleCard = { backgroundColor: '#f0fdf4', borderRadius: '16px', padding: '20px', margin: '0 0 22px', border: '1px solid #bbf7d0' };
const productTitle = { color: '#0D1B2A', fontSize: '18px', fontWeight: 700, margin: '0 0 4px' };
const buyerInfo = { color: '#6b7280', fontSize: '14px', margin: '0' };
const hrInner = { borderColor: '#bbf7d0', margin: '16px 0' };
const amountGrid = { margin: '0' };
const amountRow = { display: 'flex', justifyContent: 'space-between', color: '#374151', fontSize: '14px', margin: '0 0 8px' };
const amountRowTotal = { display: 'flex', justifyContent: 'space-between', color: '#0D1B2A', fontSize: '16px', margin: '8px 0 0', paddingTop: '8px', borderTop: '1px dashed #bbf7d0' };
const amountLabel = { color: '#6b7280' };
const amountLabelBold = { fontWeight: 700 };
const amountValue = { color: '#374151' };
const amountValueMuted = { color: '#9ca3af' };
const amountValueBold = { fontWeight: 700, color: '#16a34a' };
const button = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
