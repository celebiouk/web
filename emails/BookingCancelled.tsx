import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

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
      <Text style={text}>
        Hi {userName}, we wanted to let you know that your upcoming session has been cancelled.
      </Text>
      <Section style={cancelCard}>
        <Section style={cancelIcon}>
          <Text style={iconText}>&#x2715;</Text>
        </Section>
        <Text style={serviceTitleStyle}>{serviceName}</Text>
        <Text style={creatorText}>with {creatorName}</Text>
        <Hr style={hrInner} />
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
        <Section style={refundBox}>
          <Text style={refundIcon}>&#x1F4B0;</Text>
          <Section>
            <Text style={refundTitle}>Refund Status</Text>
            <Text style={refundText}>{refundStatus}</Text>
          </Section>
        </Section>
      )}
      <Text style={text}>
        We&apos;re sorry for any inconvenience. If you&apos;d like to book another session, you can do so below.
      </Text>
      <Button href={rebookUrl} style={button}>Book Another Session</Button>
      <Hr style={hr} />
      <Text style={muted}>
        If you have any questions about this cancellation, please reply to this email.
      </Text>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const cancelCard = { backgroundColor: '#fef2f2', borderRadius: '16px', padding: '24px', margin: '0 0 22px', border: '1px solid #fecaca', textAlign: 'center' as const };
const cancelIcon = { width: '48px', height: '48px', backgroundColor: '#ef4444', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const iconText = { color: '#ffffff', fontSize: '24px', fontWeight: 700, margin: '0' };
const serviceTitleStyle = { color: '#0D1B2A', fontSize: '18px', fontWeight: 700, margin: '0 0 4px' };
const creatorText = { color: '#6b7280', fontSize: '14px', margin: '0' };
const hrInner = { borderColor: '#fecaca', margin: '16px 0' };
const originalDate = { color: '#6b7280', fontSize: '14px', margin: '0', textDecoration: 'line-through' as const };
const reasonBox = { backgroundColor: '#ffffff', borderRadius: '8px', padding: '12px', margin: '12px 0 0', textAlign: 'left' as const };
const reasonLabel = { color: '#6b7280', fontSize: '12px', margin: '0 0 4px' };
const reasonText = { color: '#374151', fontSize: '14px', margin: '0' };
const refundBox = { backgroundColor: '#ecfdf5', borderRadius: '12px', padding: '16px', margin: '0 0 22px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'flex-start', gap: '12px' };
const refundIcon = { fontSize: '20px', margin: '0' };
const refundTitle = { color: '#065f46', fontSize: '14px', fontWeight: 600, margin: '0 0 4px' };
const refundText = { color: '#047857', fontSize: '13px', margin: '0' };
const button = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
