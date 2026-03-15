import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

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
      <Text style={text}>
        Congrats, {creatorName}! Your product is now published and ready for customers.
      </Text>
      <Section style={productCard}>
        <Text style={productTitle}>{productName}</Text>
        <Text style={productStatus}>Status: Live</Text>
      </Section>
      <Text style={text}>
        Share your product link to start making sales. You can track performance and manage your product from your dashboard.
      </Text>
      <Section style={buttonGroup}>
        <Button href={productUrl} style={buttonPrimary}>View Product</Button>
        <Button href={dashboardUrl} style={buttonSecondary}>Go to Dashboard</Button>
      </Section>
      <Hr style={hr} />
      <Text style={muted}>
        Tip: Share your product on social media for maximum visibility. Add it to your bio link!
      </Text>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const productCard = { backgroundColor: '#f0fdf4', borderRadius: '16px', padding: '20px', margin: '0 0 22px', border: '1px solid #bbf7d0' };
const productTitle = { color: '#0D1B2A', fontSize: '18px', fontWeight: 700, margin: '0 0 8px' };
const productStatus = { color: '#16a34a', fontSize: '14px', fontWeight: 600, margin: '0' };
const buttonGroup = { margin: '0 0 22px' };
const buttonPrimary = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block', marginRight: '12px' };
const buttonSecondary = { backgroundColor: '#f3f4f6', color: '#0D1B2A', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
