import * as React from 'react';
import { Button, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

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
      eyebrow="Payment receipt"
      title={`Receipt for your ${planLabel} renewal`}
    >
      <Text style={text}>Thanks for being Pro, {creatorName}. Your latest subscription payment was successful.</Text>
      <Section style={receiptBox}>
        <Text style={label}>Plan</Text>
        <Text style={value}>{planLabel}</Text>
        <Text style={label}>Amount</Text>
        <Text style={value}>{amount}</Text>
        <Text style={label}>Date</Text>
        <Text style={value}>{invoiceDate}</Text>
      </Section>
      <Button href={invoiceUrl} style={button}>Download invoice PDF</Button>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const receiptBox = { backgroundColor: '#f8fafc', borderRadius: '16px', padding: '18px', margin: '0 0 20px' };
const label = { color: '#6b7280', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '0 0 4px' };
const value = { color: '#0D1B2A', fontSize: '16px', lineHeight: '24px', fontWeight: 600, margin: '0 0 12px' };
const button = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
