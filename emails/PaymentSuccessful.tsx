import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

export function PaymentSuccessful({
  userName = 'there',
  amount,
  description,
  date,
  receiptUrl,
}: {
  userName?: string;
  amount: string;
  description: string;
  date: string;
  receiptUrl: string;
}) {
  return (
    <EmailShell
      preview={`Payment of ${amount} was successful`}
      eyebrow="Payment Successful"
      title="Your payment went through!"
    >
      <Text style={text}>
        Hi {userName}, we&apos;ve successfully processed your payment.
      </Text>
      <Section style={paymentCard}>
        <Section style={checkmark}>
          <Text style={checkmarkIcon}>&#x2713;</Text>
        </Section>
        <Text style={amountText}>{amount}</Text>
        <Text style={descriptionText}>{description}</Text>
        <Hr style={hrInner} />
        <Text style={dateText}>Processed on {date}</Text>
      </Section>
      <Button href={receiptUrl} style={button}>View Receipt</Button>
      <Hr style={hr} />
      <Text style={muted}>
        This payment was processed securely via Stripe. A receipt has been sent to your email.
      </Text>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const paymentCard = { backgroundColor: '#f0fdf4', borderRadius: '16px', padding: '24px', margin: '0 0 22px', border: '1px solid #bbf7d0', textAlign: 'center' as const };
const checkmark = { width: '48px', height: '48px', backgroundColor: '#16a34a', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const checkmarkIcon = { color: '#ffffff', fontSize: '24px', fontWeight: 700, margin: '0' };
const amountText = { color: '#0D1B2A', fontSize: '32px', fontWeight: 700, margin: '0 0 4px' };
const descriptionText = { color: '#6b7280', fontSize: '14px', margin: '0' };
const hrInner = { borderColor: '#bbf7d0', margin: '16px 0' };
const dateText = { color: '#6b7280', fontSize: '13px', margin: '0' };
const button = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
