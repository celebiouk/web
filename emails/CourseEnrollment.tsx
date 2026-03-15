import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell } from './EmailShell';

export function CourseEnrollment({
  studentName = 'there',
  courseName,
  creatorName,
  lessonCount,
  courseUrl,
  dashboardUrl,
}: {
  studentName?: string;
  courseName: string;
  creatorName: string;
  lessonCount: number;
  courseUrl: string;
  dashboardUrl: string;
}) {
  return (
    <EmailShell
      preview={`You're enrolled in ${courseName}!`}
      eyebrow="Course Enrolled"
      title="Welcome to your new course!"
    >
      <Text style={text}>
        Hi {studentName}, congratulations on taking the first step! You&apos;re now enrolled in:
      </Text>
      <Section style={courseCard}>
        <Section style={courseIcon}>
          <Text style={iconText}>&#x1F393;</Text>
        </Section>
        <Text style={courseTitleStyle}>{courseName}</Text>
        <Text style={creatorText}>by {creatorName}</Text>
        <Hr style={hrInner} />
        <Section style={statsRow}>
          <Section style={stat}>
            <Text style={statValue}>{lessonCount}</Text>
            <Text style={statLabel}>Lessons</Text>
          </Section>
          <Section style={stat}>
            <Text style={statValue}>0%</Text>
            <Text style={statLabel}>Complete</Text>
          </Section>
          <Section style={stat}>
            <Text style={statValue}>&#x221E;</Text>
            <Text style={statLabel}>Lifetime Access</Text>
          </Section>
        </Section>
      </Section>
      <Text style={text}>
        Your course is ready and waiting. Dive in whenever you&apos;re ready — you have lifetime access.
      </Text>
      <Button href={courseUrl} style={buttonPrimary}>Start Learning</Button>
      <Hr style={hr} />
      <Section style={tipsBox}>
        <Text style={tipsTitle}>Tips for success:</Text>
        <Text style={tip}>&#x2022; Set a regular learning schedule</Text>
        <Text style={tip}>&#x2022; Take notes as you go</Text>
        <Text style={tip}>&#x2022; Complete exercises before moving on</Text>
        <Text style={tip}>&#x2022; Ask questions in the community</Text>
      </Section>
      <Text style={muted}>
        You can access all your courses from your{' '}
        <a href={dashboardUrl} style={link}>learning dashboard</a>.
      </Text>
    </EmailShell>
  );
}

const text = { color: '#374151', fontSize: '15px', lineHeight: '24px', margin: '0 0 18px' };
const muted = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const link = { color: '#1CE7D0', textDecoration: 'underline' };
const courseCard = { background: 'linear-gradient(135deg, #1CE7D0 0%, #0D1B2A 100%)', borderRadius: '16px', padding: '24px', margin: '0 0 22px', textAlign: 'center' as const };
const courseIcon = { width: '56px', height: '56px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const iconText = { fontSize: '28px', margin: '0' };
const courseTitleStyle = { color: '#ffffff', fontSize: '22px', fontWeight: 700, margin: '0 0 4px' };
const creatorText = { color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: '0' };
const hrInner = { borderColor: 'rgba(255,255,255,0.2)', margin: '16px 0' };
const statsRow = { display: 'flex', justifyContent: 'space-around' };
const stat = { textAlign: 'center' as const };
const statValue = { color: '#ffffff', fontSize: '24px', fontWeight: 700, margin: '0' };
const statLabel = { color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '4px 0 0' };
const buttonPrimary = { backgroundColor: '#ffffff', color: '#0D1B2A', borderRadius: '14px', padding: '16px 32px', fontWeight: 700, textDecoration: 'none', display: 'inline-block', fontSize: '16px' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
const tipsBox = { backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', margin: '0 0 18px', border: '1px solid #e5e7eb' };
const tipsTitle = { color: '#0D1B2A', fontSize: '14px', fontWeight: 600, margin: '0 0 12px' };
const tip = { color: '#6b7280', fontSize: '13px', lineHeight: '22px', margin: '0' };
