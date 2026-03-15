import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

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
      <Text style={text}>
        Hi {buyerName}, your booking is confirmed! Here are the details:
      </Text>
      <Section style={bookingCard}>
        <Text style={serviceTitleStyle}>{serviceName}</Text>
        <Text style={creatorText}>with {creatorName}</Text>
        <Hr style={hrInner} />
        <Section style={detailsGrid}>
          <Section style={detailItem}>
            <Text style={detailIcon}>&#x1F4C5;</Text>
            <Section>
              <Text style={detailLabel}>Date</Text>
              <Text style={detailValue}>{date}</Text>
            </Section>
          </Section>
          <Section style={detailItem}>
            <Text style={detailIcon}>&#x23F0;</Text>
            <Section>
              <Text style={detailLabel}>Time</Text>
              <Text style={detailValue}>{time}</Text>
            </Section>
          </Section>
          <Section style={detailItem}>
            <Text style={detailIcon}>&#x23F1;</Text>
            <Section>
              <Text style={detailLabel}>Duration</Text>
              <Text style={detailValue}>{duration}</Text>
            </Section>
          </Section>
        </Section>
      </Section>
      <Section style={buttonGroup}>
        <Button href={calendarUrl} style={buttonPrimary}>Add to Calendar</Button>
        {meetingUrl && (
          <Button href={meetingUrl} style={buttonSecondary}>Join Meeting</Button>
        )}
      </Section>
      <Hr style={hr} />
      <Text style={muted}>
        Need to make changes?{' '}
        <a href={rescheduleUrl} style={link}>Reschedule or cancel</a>
      </Text>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const link = { color: '#1CE7D0', textDecoration: 'underline' };
const bookingCard = { backgroundColor: '#f8fafc', borderRadius: '16px', padding: '20px', margin: '0 0 22px', border: '1px solid #e5e7eb' };
const serviceTitleStyle = { color: '#0D1B2A', fontSize: '20px', fontWeight: 700, margin: '0 0 4px' };
const creatorText = { color: '#6b7280', fontSize: '14px', margin: '0' };
const hrInner = { borderColor: '#e5e7eb', margin: '16px 0' };
const detailsGrid = { margin: '0' };
const detailItem = { display: 'flex', alignItems: 'flex-start', gap: '12px', margin: '0 0 12px' };
const detailIcon = { fontSize: '20px', margin: '0' };
const detailLabel = { color: '#6b7280', fontSize: '12px', margin: '0 0 2px' };
const detailValue = { color: '#0D1B2A', fontSize: '14px', fontWeight: 600, margin: '0' };
const buttonGroup = { margin: '0 0 22px' };
const buttonPrimary = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block', marginRight: '12px' };
const buttonSecondary = { backgroundColor: '#1CE7D0', color: '#0D1B2A', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
