import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

export function CourseCompletion({
  studentName = 'Graduate',
  courseName,
  creatorName,
  completionDate,
  certificateUrl,
  shareUrl,
}: {
  studentName?: string;
  courseName: string;
  creatorName: string;
  completionDate: string;
  certificateUrl: string;
  shareUrl: string;
}) {
  return (
    <EmailShell
      preview={`Congratulations! You completed ${courseName}`}
      eyebrow="Course Complete"
      title="You did it! Congratulations!"
    >
      <Section style={celebrationBox}>
        <Text style={celebrationEmoji}>&#x1F389;</Text>
      </Section>
      <Text style={textCenter}>
        {studentName}, you&apos;ve successfully completed
      </Text>
      <Section style={certificateCard}>
        <Section style={certificateBorder}>
          <Text style={certLabel}>Certificate of Completion</Text>
          <Hr style={hrGold} />
          <Text style={certName}>{studentName}</Text>
          <Text style={certText}>has successfully completed</Text>
          <Text style={courseTitleStyle}>{courseName}</Text>
          <Text style={certCreator}>by {creatorName}</Text>
          <Hr style={hrGold} />
          <Text style={certDate}>Completed on {completionDate}</Text>
        </Section>
      </Section>
      <Section style={buttonGroup}>
        <Button href={certificateUrl} style={buttonPrimary}>Download Certificate</Button>
        <Button href={shareUrl} style={buttonSecondary}>Share Achievement</Button>
      </Section>
      <Hr style={hr} />
      <Section style={nextSteps}>
        <Text style={nextTitle}>What&apos;s next?</Text>
        <Text style={nextText}>
          Keep the momentum going! Check out more courses from {creatorName} or explore other creators on cele.bio.
        </Text>
      </Section>
      <Text style={muted}>
        Your certificate is always available in your learning dashboard.
      </Text>
    </EmailShell>
  );
}

const textCenter = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px', textAlign: 'center' as const };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const celebrationBox = { textAlign: 'center' as const, margin: '0 0 12px' };
const celebrationEmoji = { fontSize: '48px', margin: '0' };
const certificateCard = { background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '16px', padding: '4px', margin: '0 0 22px' };
const certificateBorder = { backgroundColor: '#fffbeb', borderRadius: '14px', padding: '24px', textAlign: 'center' as const, border: '2px dashed #f59e0b' };
const certLabel = { color: '#92400e', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '0 0 8px' };
const hrGold = { borderColor: '#f59e0b', margin: '12px auto', width: '60px' };
const certName = { color: '#0D1B2A', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' };
const certText = { color: '#6b7280', fontSize: '14px', margin: '0 0 8px' };
const courseTitleStyle = { color: '#0D1B2A', fontSize: '20px', fontWeight: 700, margin: '0 0 4px' };
const certCreator = { color: '#6b7280', fontSize: '14px', margin: '0' };
const certDate = { color: '#92400e', fontSize: '13px', margin: '0' };
const buttonGroup = { textAlign: 'center' as const, margin: '0 0 22px' };
const buttonPrimary = { backgroundColor: '#0D1B2A', color: '#ffffff', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block', marginRight: '12px' };
const buttonSecondary = { backgroundColor: '#f3f4f6', color: '#0D1B2A', borderRadius: '14px', padding: '14px 20px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
const nextSteps = { backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', margin: '0 0 18px', border: '1px solid #e5e7eb' };
const nextTitle = { color: '#0D1B2A', fontSize: '14px', fontWeight: 600, margin: '0 0 8px' };
const nextText = { color: '#6b7280', fontSize: '13px', lineHeight: '20px', margin: '0' };
