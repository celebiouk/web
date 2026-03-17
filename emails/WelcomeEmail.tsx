import * as React from 'react';
import { Button, Hr, Section, Text, Row, Column } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

export function WelcomeEmail({
  userName = 'there',
  profileUrl,
}: {
  userName?: string;
  profileUrl: string;
}) {
  return (
    <EmailShell
      preview="Welcome to cele.bio — your creator journey starts now"
      eyebrow="Welcome"
      title={`Hey ${userName}, welcome to cele.bio!`}
    >
      <Text style={emailStyles.text}>
        We're thrilled to have you join thousands of creators building their online business with cele.bio.
      </Text>
      <Text style={emailStyles.text}>
        Your beautiful storefront is ready. Pick a template, add your products, and start earning — all in under 5 minutes.
      </Text>

      <Section style={featureGrid}>
        <Row>
          <Column style={featureItem}>
            <Text style={featureIcon}>✨</Text>
            <Text style={featureText}>10 stunning templates</Text>
          </Column>
          <Column style={featureItem}>
            <Text style={featureIcon}>📦</Text>
            <Text style={featureText}>Sell digital products</Text>
          </Column>
        </Row>
        <Row>
          <Column style={featureItem}>
            <Text style={featureIcon}>📅</Text>
            <Text style={featureText}>Book 1:1 coaching</Text>
          </Column>
          <Column style={featureItem}>
            <Text style={featureIcon}>💳</Text>
            <Text style={featureText}>Get paid via Stripe</Text>
          </Column>
        </Row>
      </Section>

      <Section style={emailStyles.buttonWrapper}>
        <Button href={profileUrl} style={emailStyles.buttonPrimary}>
          Set Up Your Page
        </Button>
      </Section>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.muted}>
        Questions? Reply to this email — we read every message and we're here to help you succeed.
      </Text>
    </EmailShell>
  );
}

const featureGrid: React.CSSProperties = {
  backgroundColor: colors.gray50,
  borderRadius: '16px',
  padding: '20px',
  margin: '0 0 8px 0',
};

const featureItem: React.CSSProperties = {
  padding: '8px 12px',
  verticalAlign: 'top',
};

const featureIcon: React.CSSProperties = {
  fontSize: '20px',
  margin: '0 0 4px 0',
  lineHeight: '1',
};

const featureText: React.CSSProperties = {
  color: colors.gray700,
  fontSize: '13px',
  fontWeight: 500,
  margin: 0,
  lineHeight: '20px',
};
