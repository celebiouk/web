import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

export function ProductUploadSuccess({
  creatorName = 'Creator',
  productName,
  productUrl,
  dashboardUrl,
}: {
  creatorName?: string;
  productName: string;
  productUrl: string;
  dashboardUrl: string;
}) {
  return (
    <EmailShell
      preview={`Your product "${productName}" is now live!`}
      eyebrow="Product Published"
      title={`${productName} is live!`}
    >
      <Section style={celebrationBox}>
        <Text style={celebrationEmoji}>&#x1F389;</Text>
      </Section>
      <Text style={emailStyles.text}>
        Congrats, {creatorName}! Your product is now published and ready for customers.
      </Text>
      <Section style={productCard}>
        <Text style={productTitle}>{productName}</Text>
        <Section style={statusBadge}>
          <Text style={statusText}>&#x2705; Live</Text>
        </Section>
      </Section>
      <Text style={emailStyles.text}>
        Share your product link to start making sales. You can track performance and manage your product from your dashboard.
      </Text>
      <Section style={emailStyles.buttonWrapper}>
        <Button href={productUrl} style={emailStyles.buttonPrimary}>View Product</Button>
        {' '}
        <Button href={dashboardUrl} style={emailStyles.buttonSecondary}>Go to Dashboard</Button>
      </Section>
      <Hr style={emailStyles.hr} />
      <Section style={emailStyles.cardHighlight}>
        <Text style={tipTitle}>&#x1F4A1; Pro tip</Text>
        <Text style={emailStyles.muted}>
          Share your product on social media for maximum visibility. Add it to your bio link!
        </Text>
      </Section>
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

const productCard: React.CSSProperties = {
  backgroundColor: colors.successBg,
  borderRadius: '16px',
  padding: '24px',
  margin: '0 0 24px',
  textAlign: 'center',
};

const productTitle: React.CSSProperties = {
  color: colors.dark,
  fontSize: '20px',
  fontWeight: 700,
  margin: '0 0 12px',
};

const statusBadge: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: colors.white,
  borderRadius: '20px',
  padding: '6px 14px',
};

const statusText: React.CSSProperties = {
  color: colors.success,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0',
};

const tipTitle: React.CSSProperties = {
  color: colors.dark,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 8px',
};
