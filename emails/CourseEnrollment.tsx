import * as React from 'react';
import { Button, Hr, Section, Text, Link } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

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
      <Text style={emailStyles.text}>
        Hi {studentName}, congratulations on taking the first step! You're now enrolled in:
      </Text>
      <Section style={courseCard}>
        <Section style={courseIconWrapper}>
          <Text style={courseIcon}>&#x1F393;</Text>
        </Section>
        <Text style={courseTitleStyle}>{courseName}</Text>
        <Text style={creatorText}>by {creatorName}</Text>
        <Hr style={hrCyan} />
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
            <Text style={statLabel}>Access</Text>
          </Section>
        </Section>
      </Section>
      <Text style={emailStyles.text}>
        Your course is ready and waiting. Dive in whenever you're ready - you have lifetime access.
      </Text>
      <Section style={emailStyles.buttonWrapper}>
        <Button href={courseUrl} style={emailStyles.buttonAccent}>Start Learning</Button>
      </Section>
      <Hr style={emailStyles.hr} />
      <Section style={emailStyles.card}>
        <Text style={tipsTitle}>&#x1F4A1; Tips for success:</Text>
        <Text style={tip}>&#x2022; Set a regular learning schedule</Text>
        <Text style={tip}>&#x2022; Take notes as you go</Text>
        <Text style={tip}>&#x2022; Complete exercises before moving on</Text>
        <Text style={tipLast}>&#x2022; Ask questions in the community</Text>
      </Section>
      <Text style={emailStyles.muted}>
        You can access all your courses from your{' '}
        <Link href={dashboardUrl} style={linkStyle}>learning dashboard</Link>.
      </Text>
    </EmailShell>
  );
}

const courseCard: React.CSSProperties = {
  background: `linear-gradient(135deg, ${colors.cyan} 0%, ${colors.indigo} 100%)`,
  borderRadius: '16px',
  padding: '28px',
  margin: '0 0 24px',
  textAlign: 'center',
};

const courseIconWrapper: React.CSSProperties = {
  width: '56px',
  height: '56px',
  backgroundColor: 'rgba(255,255,255,0.2)',
  borderRadius: '50%',
  margin: '0 auto 16px',
};

const courseIcon: React.CSSProperties = {
  fontSize: '28px',
  lineHeight: '56px',
  margin: '0',
};

const courseTitleStyle: React.CSSProperties = {
  color: colors.white,
  fontSize: '22px',
  fontWeight: 700,
  margin: '0 0 4px',
};

const creatorText: React.CSSProperties = {
  color: 'rgba(255,255,255,0.85)',
  fontSize: '14px',
  margin: '0',
};

const hrCyan: React.CSSProperties = {
  borderColor: 'rgba(255,255,255,0.2)',
  margin: '20px 0',
};

const statsRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-around',
};

const stat: React.CSSProperties = {
  textAlign: 'center',
};

const statValue: React.CSSProperties = {
  color: colors.white,
  fontSize: '26px',
  fontWeight: 700,
  margin: '0',
};

const statLabel: React.CSSProperties = {
  color: 'rgba(255,255,255,0.75)',
  fontSize: '12px',
  fontWeight: 500,
  margin: '4px 0 0',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tipsTitle: React.CSSProperties = {
  color: colors.dark,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 12px',
};

const tip: React.CSSProperties = {
  color: colors.gray600,
  fontSize: '13px',
  lineHeight: '24px',
  margin: '0',
};

const tipLast: React.CSSProperties = {
  ...tip,
};

const linkStyle: React.CSSProperties = {
  color: colors.cyan,
  textDecoration: 'underline',
};
