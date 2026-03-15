import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export function EmailShell({
  preview,
  title,
  eyebrow,
  children,
}: {
  preview: string;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={card}>
            <Text style={brand}>cele.bio</Text>
            {eyebrow ? <Text style={eyebrowStyle}>{eyebrow}</Text> : null}
            <Heading style={heading}>{title}</Heading>
            {children}
          </Section>
          <Text style={footer}>
            Sent by cele.bio • Premium creator monetization, without the busywork.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: '#f5f7fb',
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  padding: '24px 0',
};

const container = {
  margin: '0 auto',
  maxWidth: '600px',
  padding: '0 16px',
};

const card = {
  backgroundColor: '#ffffff',
  borderRadius: '24px',
  padding: '32px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 12px 40px rgba(13, 27, 42, 0.08)',
};

const brand = {
  color: '#0D1B2A',
  fontSize: '14px',
  fontWeight: 700,
  letterSpacing: '0.16em',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
};

const eyebrowStyle = {
  color: '#1CE7D0',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.14em',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
};

const heading = {
  color: '#0D1B2A',
  fontSize: '28px',
  lineHeight: '34px',
  margin: '0 0 16px',
};

const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
  marginTop: '16px',
};
