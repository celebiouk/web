import * as React from 'react';
import { Button, Hr, Section, Text, Link } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

export function BookingReminder({
  buyerName = 'there',
  creatorName,
  serviceName,
  date,
  time,
  meetingUrl,
  rescheduleUrl,
}: {
  buyerName?: string;
  creatorName: string;
  serviceName: string;
  date: string;
  time: string;
  meetingUrl?: string;
  rescheduleUrl: string;
}) {
  return (
    <EmailShell
      preview={`Reminder: Your session with ${creatorName} is tomorrow`}
      eyebrow="Reminder"
      title="Your session is coming up!"
    >
      <Text style={emailStyles.text}>
        Hi {buyerName}, just a friendly reminder that your session is in 24 hours.
      </Text>
      <Section style={reminderCard}>
        <Section style={timeHighlight}>
          <Text style={timeLabel}>Starting in</Text>
          <Text style={timeValue}>24 hours</Text>
        </Section>
        <Hr style={hrWarning} />
        <Text style={serviceTitleStyle}>{serviceName}</Text>
        <Text style={creatorText}>with {creatorName}</Text>
        <Section style={dateTimeRow}>
          <Text style={dateTimeText}>&#x1F4C5; {date}</Text>
          <Text style={dateTimeText}>&#x23F0; {time}</Text>
        </Section>
      </Section>
      <Section style={emailStyles.card}>
        <Text style={checklistTitle}>Before your session:</Text>
        <Text style={checklistItem}>&#x2705; Test your camera and microphone</Text>
        <Text style={checklistItem}>&#x2705; Find a quiet space</Text>
        <Text style={checklistItemLast}>&#x2705; Have your questions ready</Text>
      </Section>
      {meetingUrl && (
        <Section style={emailStyles.buttonWrapper}>
          <Button href={meetingUrl} style={emailStyles.buttonAccent}>Join Meeting Room</Button>
        </Section>
      )}
      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.muted}>
        Can't make it?{' '}
        <Link href={rescheduleUrl} style={linkStyle}>Reschedule your session</Link>
      </Text>
    </EmailShell>
  );
}

const reminderCard: React.CSSProperties = {
  backgroundColor: colors.warningBg,
  borderRadius: '16px',
  padding: '24px',
  margin: '0 0 24px',
  textAlign: 'center',
};

const timeHighlight: React.CSSProperties = {
  marginBottom: '12px',
};

const timeLabel: React.CSSProperties = {
  color: colors.warning,
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  margin: '0 0 4px',
};

const timeValue: React.CSSProperties = {
  color: colors.dark,
  fontSize: '32px',
  fontWeight: 700,
  margin: '0',
};

const hrWarning: React.CSSProperties = {
  borderColor: colors.warning,
  opacity: 0.3,
  margin: '18px 0',
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
  margin: '0 0 16px',
};

const dateTimeRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '24px',
};

const dateTimeText: React.CSSProperties = {
  color: colors.gray700,
  fontSize: '14px',
  fontWeight: 500,
  margin: '0',
};

const checklistTitle: React.CSSProperties = {
  color: colors.dark,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 12px',
};

const checklistItem: React.CSSProperties = {
  color: colors.gray700,
  fontSize: '14px',
  lineHeight: '26px',
  margin: '0',
};

const checklistItemLast: React.CSSProperties = {
  ...checklistItem,
};

const linkStyle: React.CSSProperties = {
  color: colors.cyan,
  textDecoration: 'underline',
};
