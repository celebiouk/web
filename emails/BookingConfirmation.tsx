import * as React from 'react';
import { Button, Hr, Section, Text, Link } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

export function BookingConfirmation({
  buyerName = 'there',
  creatorName,
  serviceName,
  date,
  time,
  duration,
  meetingUrl,
  calendarUrl,
  rescheduleUrl,
}: {
  buyerName?: string;
  creatorName: string;
  serviceName: string;
  date: string;
  time: string;
  duration: string;
  meetingUrl?: string;
  calendarUrl: string;
  rescheduleUrl: string;
}) {
  return (
    <EmailShell
      preview={`Booking confirmed: ${serviceName} with ${creatorName}`}
      eyebrow="Booking Confirmed"
      title="Your session is booked!"
    >
      <Text style={emailStyles.text}>
        Hi {buyerName}, your booking is confirmed! Here are the details:
      </Text>
      <Section style={bookingCard}>
        <Text style={serviceTitleStyle}>{serviceName}</Text>
        <Text style={creatorText}>with {creatorName}</Text>
        <Hr style={hrInner} />
        <Section style={detailsGrid}>
          <Section style={detailItem}>
            <Text style={detailIcon}>&#x1F4C5;</Text>
            <Text style={detailLabel}>Date</Text>
            <Text style={detailValue}>{date}</Text>
          </Section>
          <Section style={detailItem}>
            <Text style={detailIcon}>&#x23F0;</Text>
            <Text style={detailLabel}>Time</Text>
            <Text style={detailValue}>{time}</Text>
          </Section>
          <Section style={detailItem}>
            <Text style={detailIcon}>&#x23F1;</Text>
            <Text style={detailLabel}>Duration</Text>
            <Text style={detailValue}>{duration}</Text>
          </Section>
        </Section>
      </Section>
      <Section style={emailStyles.buttonWrapper}>
        <Button href={calendarUrl} style={emailStyles.buttonPrimary}>Add to Calendar</Button>
        {meetingUrl && (
          <>
            {' '}
            <Button href={meetingUrl} style={emailStyles.buttonSecondary}>Join Meeting</Button>
          </>
        )}
      </Section>
      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.muted}>
        Need to make changes?{' '}
        <Link href={rescheduleUrl} style={linkStyle}>Reschedule or cancel</Link>
      </Text>
    </EmailShell>
  );
}

const bookingCard: React.CSSProperties = {
  backgroundColor: colors.successBg,
  borderRadius: '16px',
  padding: '24px',
  margin: '0 0 24px',
  textAlign: 'center',
};

const serviceTitleStyle: React.CSSProperties = {
  color: colors.dark,
  fontSize: '20px',
  fontWeight: 700,
  margin: '0 0 4px',
};

const creatorText: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '14px',
  margin: '0',
};

const hrInner: React.CSSProperties = {
  borderColor: colors.success,
  opacity: 0.2,
  margin: '18px 0',
};

const detailsGrid: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-around',
};

const detailItem: React.CSSProperties = {
  textAlign: 'center',
};

const detailIcon: React.CSSProperties = {
  fontSize: '24px',
  margin: '0 0 6px',
};

const detailLabel: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  margin: '0 0 4px',
};

const detailValue: React.CSSProperties = {
  color: colors.dark,
  fontSize: '15px',
  fontWeight: 600,
  margin: '0',
};

const linkStyle: React.CSSProperties = {
  color: colors.cyan,
  textDecoration: 'underline',
};
