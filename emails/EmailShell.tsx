import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components';

// Brand colors - cele.bio design system
export const colors = {
  // Primary
  dark: '#0D1B2A',
  white: '#FFFFFF',
  // Accent
  cyan: '#1CE7D0',
  cyanLight: '#E0FBF8',
  indigo: '#6366F1',
  indigoLight: '#EEF2FF',
  // Neutral
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  // Status
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  error: '#EF4444',
  errorBg: '#FEF2F2',
};

export function EmailShell({
  preview,
  title,
  eyebrow,
  children,
  showSocial = false,
}: {
  preview: string;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  showSocial?: boolean;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cele.bio';

  return (
    <Html>
      <Head>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          `}
        </style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header with dark background */}
          <Section style={header}>
            <Row>
              <Column align="center">
                <Link href={appUrl} style={logoLink}>
                  <Img
                    src={`${appUrl}/fav.png`}
                    alt="cele.bio"
                    width="44"
                    height="44"
                    style={logoImage}
                  />
                  <Text style={logoText}>cele<span style={logoDot}>.</span>bio</Text>
                </Link>
              </Column>
            </Row>
          </Section>

          {/* Main content card */}
          <Section style={card}>
            {/* Gradient accent bar */}
            <div style={accentBar} />
            
            <Section style={cardContent}>
              {eyebrow && <Text style={eyebrowStyle}>{eyebrow}</Text>}
              <Heading style={heading}>{title}</Heading>
              {children}
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            {showSocial && (
              <Row style={socialRow}>
                <Column align="center">
                  <Text style={socialText}>
                    <Link href="https://twitter.com/celebio" style={socialLink}>Twitter</Link>
                    {' · '}
                    <Link href="https://instagram.com/cele.bio" style={socialLink}>Instagram</Link>
                    {' · '}
                    <Link href="https://tiktok.com/@cele.bio" style={socialLink}>TikTok</Link>
                  </Text>
                </Column>
              </Row>
            )}
            
            <Text style={footerText}>
              Made with ♥ by cele.bio — The creator monetization platform
            </Text>
            
            <Text style={footerLinks}>
              <Link href={appUrl} style={footerLink}>Visit cele.bio</Link>
              {' · '}
              <Link href={`${appUrl}/terms`} style={footerLink}>Terms</Link>
              {' · '}
              <Link href={`${appUrl}/privacy`} style={footerLink}>Privacy</Link>
            </Text>
            
            <Text style={footerMuted}>
              © {new Date().getFullYear()} cele.bio. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Base styles
const body: React.CSSProperties = {
  backgroundColor: '#EEF2F7',
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  margin: '0 auto',
  maxWidth: '640px',
  padding: '28px 12px 36px',
};

const header: React.CSSProperties = {
  background: `radial-gradient(circle at 82% 18%, rgba(28, 231, 208, 0.28) 0%, rgba(28, 231, 208, 0) 42%), linear-gradient(135deg, ${colors.dark} 0%, #1E3A8A 55%, #0F766E 100%)`,
  borderRadius: '26px 26px 0 0',
  padding: '24px 34px',
  textAlign: 'center' as const,
  boxShadow: '0 12px 34px rgba(13, 27, 42, 0.2)',
};

const logoLink: React.CSSProperties = {
  textDecoration: 'none',
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '10px',
};

const logoImage: React.CSSProperties = {
  display: 'block',
  borderRadius: '12px',
  boxShadow: '0 10px 24px rgba(13, 27, 42, 0.35)',
};

const logoText: React.CSSProperties = {
  color: colors.white,
  fontSize: '28px',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  margin: 0,
};

const logoDot: React.CSSProperties = {
  color: colors.cyan,
};

const card: React.CSSProperties = {
  backgroundColor: colors.white,
  border: `1px solid ${colors.gray200}`,
  borderRadius: '0 0 26px 26px',
  boxShadow: '0 18px 44px rgba(13, 27, 42, 0.1), 0 8px 20px rgba(13, 27, 42, 0.07)',
  overflow: 'hidden',
};

const accentBar: React.CSSProperties = {
  background: `linear-gradient(90deg, ${colors.cyan} 0%, ${colors.indigo} 100%)`,
  height: '4px',
  width: '100%',
};

const cardContent: React.CSSProperties = {
  padding: '34px 34px 36px',
};

const eyebrowStyle: React.CSSProperties = {
  color: colors.cyan,
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  margin: '0 0 12px 0',
  textTransform: 'uppercase' as const,
};

const heading: React.CSSProperties = {
  color: colors.dark,
  fontSize: '30px',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  lineHeight: '38px',
  margin: '0 0 24px 0',
};

const footer: React.CSSProperties = {
  padding: '24px 20px 10px',
  textAlign: 'center' as const,
};

const socialRow: React.CSSProperties = {
  marginBottom: '16px',
};

const socialText: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '13px',
  margin: 0,
};

const socialLink: React.CSSProperties = {
  color: colors.gray600,
  textDecoration: 'none',
};

const footerText: React.CSSProperties = {
  color: colors.gray600,
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '22px',
  margin: '0 0 10px 0',
};

const footerLinks: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 10px 0',
};

const footerLink: React.CSSProperties = {
  color: colors.gray500,
  textDecoration: 'none',
};

const footerMuted: React.CSSProperties = {
  color: colors.gray400,
  fontSize: '12px',
  lineHeight: '18px',
  margin: 0,
};

// Export shared styles for child templates
export const emailStyles = {
  colors,
  text: {
    color: colors.gray700,
    fontSize: '15px',
    lineHeight: '26px',
    margin: '0 0 20px 0',
  } as React.CSSProperties,
  textSmall: {
    color: colors.gray600,
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0 0 16px 0',
  } as React.CSSProperties,
  muted: {
    color: colors.gray500,
    fontSize: '13px',
    lineHeight: '20px',
    margin: 0,
  } as React.CSSProperties,
  buttonPrimary: {
    backgroundColor: colors.dark,
    borderRadius: '12px',
    color: colors.white,
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: 600,
    padding: '14px 28px',
    textAlign: 'center' as const,
    textDecoration: 'none',
  } as React.CSSProperties,
  buttonAccent: {
    background: `linear-gradient(135deg, ${colors.cyan} 0%, ${colors.indigo} 100%)`,
    borderRadius: '12px',
    color: colors.white,
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: 600,
    padding: '14px 28px',
    textAlign: 'center' as const,
    textDecoration: 'none',
  } as React.CSSProperties,
  buttonSecondary: {
    backgroundColor: colors.gray100,
    border: `1px solid ${colors.gray200}`,
    borderRadius: '12px',
    color: colors.dark,
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: 600,
    padding: '13px 27px',
    textAlign: 'center' as const,
    textDecoration: 'none',
  } as React.CSSProperties,
  hr: {
    borderColor: colors.gray200,
    borderStyle: 'solid',
    borderWidth: '1px 0 0 0',
    margin: '28px 0',
  } as React.CSSProperties,
  card: {
    backgroundColor: colors.gray50,
    border: `1px solid ${colors.gray200}`,
    borderRadius: '16px',
    padding: '24px',
    margin: '0 0 24px 0',
  } as React.CSSProperties,
  cardHighlight: {
    backgroundColor: colors.cyanLight,
    border: `1px solid rgba(28, 231, 208, 0.2)`,
    borderRadius: '16px',
    padding: '24px',
    margin: '0 0 24px 0',
  } as React.CSSProperties,
  successBox: {
    backgroundColor: colors.successBg,
    borderRadius: '12px',
    padding: '16px 20px',
    margin: '0 0 24px 0',
  } as React.CSSProperties,
  warningBox: {
    backgroundColor: colors.warningBg,
    borderRadius: '12px',
    padding: '16px 20px',
    margin: '0 0 24px 0',
  } as React.CSSProperties,
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: '12px',
    padding: '16px 20px',
    margin: '0 0 24px 0',
  } as React.CSSProperties,
  listItem: {
    color: colors.gray700,
    fontSize: '14px',
    lineHeight: '24px',
    margin: '0 0 8px 0',
    paddingLeft: '8px',
  } as React.CSSProperties,
  badge: {
    backgroundColor: colors.cyan,
    borderRadius: '6px',
    color: colors.dark,
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  badgePro: {
    background: `linear-gradient(135deg, ${colors.indigo} 0%, #8B5CF6 100%)`,
    borderRadius: '6px',
    color: colors.white,
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  buttonWrapper: {
    textAlign: 'center' as const,
    margin: '28px 0',
  } as React.CSSProperties,
};
