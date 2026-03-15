import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

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
      <Text style={text}>
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
        <Text style={totalRow}>
          <span style={totalLabel}>Total Paid</span>
          <span style={totalValue}>{amount}</span>
        </Text>
      </Section>
      {downloadUrl ? (
        <Button href={downloadUrl} style={buttonPrimary}>Download Your Product</Button>
      ) : (
        <Button href={receiptUrl} style={buttonPrimary}>Access Your Purchase</Button>
      )}
      <Hr style={hr} />
      <Section style={helpSection}>
        <Text style={helpTitle}>Need help?</Text>
        <Text style={muted}>
          If you have any questions about your purchase, you can reply to this email or contact the creator directly.
        </Text>
      </Section>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const orderCard = { backgroundColor: '#f8fafc', borderRadius: '16px', padding: '20px', margin: '0 0 22px', border: '1px solid #e5e7eb' };
const orderLabel = { color: '#6b7280', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, margin: '0' };
const hrInner = { borderColor: '#e5e7eb', margin: '12px 0' };
const orderRow = { margin: '0' };
const productTitle = { color: '#0D1B2A', fontSize: '16px', fontWeight: 600, margin: '0 0 4px' };
const productCreator = { color: '#6b7280', fontSize: '14px', margin: '0' };
const totalRow = { display: 'flex', justifyContent: 'space-between', color: '#0D1B2A', fontSize: '16px', margin: '0' };
const totalLabel = { fontWeight: 600 };
const totalValue = { fontWeight: 700 };
const buttonPrimary = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 24px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
const helpSection = { margin: '0' };
const helpTitle = { color: '#0D1B2A', fontSize: '14px', fontWeight: 600, margin: '0 0 8px' };
