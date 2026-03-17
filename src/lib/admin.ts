const ADMIN_EMAILS_ENV = 'ADMIN_EMAILS';
const DEFAULT_ADMIN_EMAILS = ['profmendel@gmail.com', 'cc@cele.bio'];

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
  const envEmails = parseAdminEmails(process.env[ADMIN_EMAILS_ENV]);
  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...envEmails]));
}

export function isInternalAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  return getInternalAdminEmails().includes(normalizedEmail);
}
