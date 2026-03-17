import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

export function UpgradeNudge({
  creatorName = 'Creator',
  saleCount,
  revenue,
  commission,
  pricingUrl,
}: {
  creatorName?: string;
  saleCount: number;
  revenue: string;
  commission: string;
  pricingUrl: string;
}) {
  return (
    <EmailShell
      preview="You're making sales - keep more of each one with Pro"
      eyebrow="Upgrade Opportunity"
      title={`You've made ${saleCount} sales, ${creatorName}!`}
    >
      <Text style={emailStyles.text}>
        Momentum is a great time to upgrade. On the Free plan, cele.bio takes 8% commission on each sale. Pro removes that fee completely.
      </Text>
      <Section style={statsCard}>
        <Section style={statRow}>
          <Section style={statItem}>
            <Text style={statLabel}>Revenue so far</Text>
            <Text style={statValue}>{revenue}</Text>
          </Section>
          <Section style={statItem}>
            <Text style={statLabel}>Commission paid</Text>
            <Text style={statValueRed}>{commission}</Text>
          </Section>
        </Section>
      </Section>
      <Section style={emailStyles.cardHighlight}>
        <Text style={proText}>
          &#x1F4B0; With Pro, you keep 100% of every sale. If you keep selling, Pro quickly pays for itself.
        </Text>
      </Section>
      <Section style={emailStyles.buttonWrapper}>
        <Button href={pricingUrl} style={emailStyles.buttonAccent}>Go Pro and Keep 100%</Button>
      </Section>
      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.muted}>
        Pro is just $19.99/mo or $167.90/year (save 30%). Cancel anytime.
      </Text>
    </EmailShell>
  );
}

const statsCard: React.CSSProperties = {
  backgroundColor: colors.gray50,
  borderRadius: '16px',
  padding: '20px 24px',
  margin: '0 0 24px',
  border: `1px solid ${colors.gray200}`,
};

const statRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-around',
};

const statItem: React.CSSProperties = {
  textAlign: 'center',
};

const statLabel: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  margin: '0 0 8px',
};

const statValue: React.CSSProperties = {
  color: colors.success,
  fontSize: '24px',
  fontWeight: 700,
  margin: '0',
};

const statValueRed: React.CSSProperties = {
  color: colors.error,
  fontSize: '24px',
  fontWeight: 700,
  margin: '0',
};

const proText: React.CSSProperties = {
  color: colors.dark,
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  textAlign: 'center',
};
