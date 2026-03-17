import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

export function BookingCancelled({
  userName = 'there',
  serviceName,
  creatorName,
  date,
  time,
  reason,
  refundStatus,
  rebookUrl,
}: {
  userName?: string;
  serviceName: string;
  creatorName: string;
  date: string;
  time: string;
  reason?: string;
  refundStatus?: string;
  rebookUrl: string;
}) {
  return (
    <EmailShell
      preview={`Your booking with ${creatorName} has been cancelled`}
      eyebrow="Booking Cancelled"
      title="Your session has been cancelled"
    >
      <Text style={emailStyles.text}>
        Hi {userName}, we wanted to let you know that your upcoming session has been cancelled.
      </Text>
      <Section style={cancelCard}>
        <Section style={cancelIconWrapper}>
          <Text style={cancelIconText}>&#x2715;</Text>
        </Section>
        <Text style={serviceTitleStyle}>{serviceName}</Text>
        <Text style={creatorText}>with {creatorName}</Text>
        <Hr style={hrError} />
        <Text style={originalDate}>
          Original date: {date} at {time}
        </Text>
        {reason && (
          <Section style={reasonBox}>
            <Text style={reasonLabel}>Reason:</Text>
            <Text style={reasonText}>{reason}</Text>
          </Section>
        )}
      </Section>
      {refundStatus && (
        <Section style={emailStyles.successBox}>
          <Text style={refundTitle}>&#x1F4B0; Refund Status</Text>
          <Text style={refundText}>{refundStatus}</Text>
        </Section>
      )}
      <Text style={emailStyles.text}>
        We're sorry for any inconvenience. If you'd like to book another session, you can do so below.
      </Text>
      <Section style={emailStyles.buttonWrapper}>
        <Button href={rebookUrl} style={emailStyles.buttonPrimary}>Book Another Session</Button>
      </Section>
      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.muted}>
        If you have any questions about this cancellation, please reply to this email.
      </Text>
    </EmailShell>
  );
}

const cancelCard: React.CSSProperties = {
  backgroundColor: colors.errorBg,
  borderRadius: '16px',
  padding: '24px',
  margin: '0 0 24px',
  textAlign: 'center',
};

const cancelIconWrapper: React.CSSProperties = {
  width: '48px',
  height: '48px',
  backgroundColor: colors.error,
  borderRadius: '50%',
  margin: '0 auto 16px',
};

const cancelIconText: React.CSSProperties = {
  color: colors.white,
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: '48px',
  margin: '0',
};

const serviceTitleStyle: React.CSSProperties = {
  color: colors.dark,
  fontSize: '18px',
  fontWeight: 700,
  margin: '0 0 4px',
};

const creatorText: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '14px',
  margin: '0',
};

const hrError: React.CSSProperties = {
  borderColor: colors.error,
  opacity: 0.2,
  margin: '18px 0',
};

const originalDate: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '14px',
  margin: '0',
  textDecoration: 'line-through',
};

const reasonBox: React.CSSProperties = {
  backgroundColor: colors.white,
  borderRadius: '10px',
  padding: '14px',
  marginTop: '14px',
  textAlign: 'left',
};

const reasonLabel: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '12px',
  fontWeight: 600,
  margin: '0 0 4px',
};

const reasonText: React.CSSProperties = {
  color: colors.gray700,
  fontSize: '14px',
  margin: '0',
};

const refundTitle: React.CSSProperties = {
  color: colors.success,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 6px',
};

const refundText: React.CSSProperties = {
  color: colors.gray600,
  fontSize: '13px',
  margin: '0',
};
