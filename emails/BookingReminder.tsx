import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

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
      <Text style={text}>
        Hi {buyerName}, just a friendly reminder that your session is in 24 hours.
      </Text>
      <Section style={reminderCard}>
        <Section style={timeHighlight}>
          <Text style={timeLabel}>Starting in</Text>
          <Text style={timeValue}>24 hours</Text>
        </Section>
        <Hr style={hrInner} />
        <Text style={serviceTitleStyle}>{serviceName}</Text>
        <Text style={creatorText}>with {creatorName}</Text>
        <Section style={dateTimeRow}>
          <Text style={dateTimeText}>&#x1F4C5; {date}</Text>
          <Text style={dateTimeText}>&#x23F0; {time}</Text>
        </Section>
      </Section>
      <Section style={checklistBox}>
        <Text style={checklistTitle}>Before your session:</Text>
        <Text style={checklistItem}>&#x2713; Test your camera and microphone</Text>
        <Text style={checklistItem}>&#x2713; Find a quiet space</Text>
        <Text style={checklistItem}>&#x2713; Have your questions ready</Text>
      </Section>
      {meetingUrl && (
        <Button href={meetingUrl} style={buttonPrimary}>Join Meeting Room</Button>
      )}
      <Hr style={hr} />
      <Text style={muted}>
        Can&apos;t make it?{' '}
        <a href={rescheduleUrl} style={link}>Reschedule your session</a>
      </Text>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const link = { color: '#1CE7D0', textDecoration: 'underline' };
const reminderCard = { backgroundColor: '#fef3c7', borderRadius: '16px', padding: '20px', margin: '0 0 22px', border: '1px solid #fde68a' };
const timeHighlight = { textAlign: 'center' as const, margin: '0 0 12px' };
const timeLabel = { color: '#92400e', fontSize: '12px', margin: '0 0 4px', textTransform: 'uppercase' as const, fontWeight: 600, letterSpacing: '0.05em' };
const timeValue = { color: '#92400e', fontSize: '28px', fontWeight: 700, margin: '0' };
const hrInner = { borderColor: '#fde68a', margin: '16px 0' };
const serviceTitleStyle = { color: '#0D1B2A', fontSize: '18px', fontWeight: 700, margin: '0 0 4px' };
const creatorText = { color: '#6b7280', fontSize: '14px', margin: '0 0 12px' };
const dateTimeRow = { display: 'flex', gap: '16px' };
const dateTimeText = { color: '#374151', fontSize: '14px', margin: '0' };
const checklistBox = { backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', margin: '0 0 22px', border: '1px solid #e5e7eb' };
const checklistTitle = { color: '#0D1B2A', fontSize: '14px', fontWeight: 600, margin: '0 0 12px' };
const checklistItem = { color: '#16a34a', fontSize: '14px', lineHeight: '24px', margin: '0' };
const buttonPrimary = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 24px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
