import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

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
      <Text style={emailStyles.text}>
        Hi {userName}, we've successfully processed your payment.
      </Text>
      <Section style={paymentCard}>
        <Section style={checkmarkCircle}>
          <Text style={checkmarkIcon}>&#x2713;</Text>
        </Section>
        <Text style={amountText}>{amount}</Text>
        <Text style={descriptionText}>{description}</Text>
        <Hr style={hrSuccess} />
        <Text style={dateText}>Processed on {date}</Text>
      </Section>
      <Section style={emailStyles.buttonWrapper}>
        <Button href={receiptUrl} style={emailStyles.buttonPrimary}>View Receipt</Button>
      </Section>
      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.muted}>
        This payment was processed securely via Stripe. A receipt has been sent to your email.
      </Text>
    </EmailShell>
  );
}

const paymentCard: React.CSSProperties = {
  backgroundColor: colors.successBg,
  borderRadius: '16px',
  padding: '28px',
  margin: '0 0 24px',
  textAlign: 'center',
};

const checkmarkCircle: React.CSSProperties = {
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
  margin: '0',
  lineHeight: '56px',
};

const amountText: React.CSSProperties = {
  color: colors.dark,
  fontSize: '36px',
  fontWeight: 700,
  margin: '0 0 6px',
  letterSpacing: '-0.02em',
};

const descriptionText: React.CSSProperties = {
  color: colors.gray600,
  fontSize: '15px',
  margin: '0',
};

const hrSuccess: React.CSSProperties = {
  borderColor: colors.success,
  opacity: 0.3,
  margin: '20px 0',
};

const dateText: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '13px',
  margin: '0',
};
