import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { EmailShell, emailStyles, colors } from './EmailShell';

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
      showSocial
    >
      <Section style={celebrationBox}>
        <Text style={celebrationEmoji}>&#x1F389;</Text>
      </Section>
      <Text style={textCenter}>
        {studentName}, you've successfully completed
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
      <Section style={emailStyles.buttonWrapper}>
        <Button href={certificateUrl} style={emailStyles.buttonPrimary}>Download Certificate</Button>
        {' '}
        <Button href={shareUrl} style={emailStyles.buttonSecondary}>Share Achievement</Button>
      </Section>
      <Hr style={emailStyles.hr} />
      <Section style={emailStyles.card}>
        <Text style={nextTitle}>What's next?</Text>
        <Text style={emailStyles.muted}>
          Keep the momentum going! Check out more courses from {creatorName} or explore other creators on cele.bio.
        </Text>
      </Section>
      <Text style={emailStyles.muted}>
        Your certificate is always available in your learning dashboard.
      </Text>
    </EmailShell>
  );
}

const celebrationBox: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '8px',
};

const celebrationEmoji: React.CSSProperties = {
  fontSize: '56px',
  margin: '0',
};

const textCenter: React.CSSProperties = {
  color: colors.gray700,
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 20px',
  textAlign: 'center',
};

const certificateCard: React.CSSProperties = {
  background: `linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)`,
  borderRadius: '16px',
  padding: '4px',
  margin: '0 0 24px',
};

const certificateBorder: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  borderRadius: '14px',
  padding: '28px',
  textAlign: 'center',
  border: `2px dashed ${colors.warning}`,
};

const certLabel: React.CSSProperties = {
  color: '#92400e',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  margin: '0 0 8px',
};

const hrGold: React.CSSProperties = {
  borderColor: colors.warning,
  margin: '14px auto',
  width: '60px',
};

const certName: React.CSSProperties = {
  color: colors.dark,
  fontSize: '26px',
  fontWeight: 700,
  margin: '0 0 4px',
};

const certText: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '13px',
  margin: '0 0 8px',
};

const courseTitleStyle: React.CSSProperties = {
  color: colors.dark,
  fontSize: '20px',
  fontWeight: 700,
  margin: '0 0 4px',
};

const certCreator: React.CSSProperties = {
  color: colors.gray500,
  fontSize: '14px',
  margin: '0',
};

const certDate: React.CSSProperties = {
  color: '#92400e',
  fontSize: '13px',
  fontWeight: 500,
  margin: '0',
};

const nextTitle: React.CSSProperties = {
  color: colors.dark,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 8px',
};
