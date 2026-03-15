const ADMIN_EMAILS_ENV = 'ADMIN_EMAILS';

function parseAdminEmails(rawValue: string | undefined): string[] {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function getInternalAdminEmails(): string[] {
  return parseAdminEmails(process.env[ADMIN_EMAILS_ENV]);
}

export function isInternalAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  return getInternalAdminEmails().includes(normalizedEmail);
}
