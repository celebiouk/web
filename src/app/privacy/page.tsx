import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | cele.bio',
  description: 'Privacy Policy for cele.bio',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            cele<span className="text-brand-600">.bio</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
          Privacy Policy
        </h1>

        <div className="prose prose-gray max-w-none dark:prose-invert">
          <p className="text-gray-600 dark:text-gray-400">
            <strong>Effective Date:</strong> March 15, 2026
          </p>

          <h2>1. Introduction</h2>
          <p>
            cele.bio (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to
            protecting your personal data. This Privacy Policy explains how we collect, use,
            and protect your information when you use our platform.
          </p>

          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Information You Provide</h3>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, username, profile picture</li>
            <li><strong>Payment Information:</strong> Billing details processed through Stripe/PayPal (we do not store full card numbers)</li>
            <li><strong>Content:</strong> Products, courses, and other content you upload</li>
            <li><strong>Communications:</strong> Messages and support requests</li>
          </ul>

          <h3>2.2 Information Collected Automatically</h3>
          <ul>
            <li><strong>Usage Data:</strong> Pages visited, features used, time spent</li>
            <li><strong>Device Information:</strong> Browser type, operating system, device type</li>
            <li><strong>IP Address:</strong> For security and analytics purposes</li>
            <li><strong>Cookies:</strong> For authentication and preferences</li>
          </ul>

          <h3>2.3 Information from Third Parties</h3>
          <ul>
            <li><strong>OAuth Providers:</strong> When you sign in with Google or TikTok, we receive your public profile information</li>
            <li><strong>Payment Processors:</strong> Transaction confirmations from Stripe/PayPal</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and operate the cele.bio platform</li>
            <li>Process payments and transactions</li>
            <li>Send transactional emails (receipts, booking confirmations)</li>
            <li>Improve our services through analytics</li>
            <li>Prevent fraud and ensure security</li>
            <li>Provide customer support</li>
            <li>Send marketing communications (with your consent)</li>
          </ul>

          <h2>4. Information Sharing</h2>
          <p>We share your information with:</p>
          <ul>
            <li><strong>Payment Processors:</strong> Stripe and PayPal for transaction processing</li>
            <li><strong>Hosting Providers:</strong> Vercel, Supabase for infrastructure</li>
            <li><strong>Creators/Buyers:</strong> Limited information necessary to complete transactions</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
          </ul>
          <p>We do not sell your personal data to third parties.</p>

          <h2>5. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data, including:
          </p>
          <ul>
            <li>HTTPS encryption for all data transmission</li>
            <li>Secure password hashing</li>
            <li>Regular security audits</li>
            <li>Limited employee access to personal data</li>
          </ul>

          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and data</li>
            <li><strong>Portability:</strong> Export your data in a common format</li>
            <li><strong>Opt-out:</strong> Unsubscribe from marketing emails</li>
          </ul>
          <p>To exercise these rights, contact us at privacy@cele.bio.</p>

          <h2>7. Cookies</h2>
          <p>
            We use cookies for authentication, remembering preferences, and analytics.
            You can control cookies through your browser settings, though some features
            may not work properly without them.
          </p>

          <h2>8. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. After account deletion,
            we may retain certain data for legal compliance and fraud prevention for up to
            7 years as required by financial regulations.
          </p>

          <h2>9. Children&apos;s Privacy</h2>
          <p>
            cele.bio is not intended for users under 18 years old. We do not knowingly
            collect data from children.
          </p>

          <h2>10. International Transfers</h2>
          <p>
            Your data may be processed in countries outside your own. We ensure appropriate
            safeguards are in place for international data transfers.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify you of significant
            changes via email or through the platform.
          </p>

          <h2>12. Contact Us</h2>
          <p>
            For privacy-related questions or concerns, contact us at:{' '}
            <a href="mailto:privacy@cele.bio" className="text-brand-600 hover:text-brand-700">
              privacy@cele.bio
            </a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} cele.bio. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/terms" className="text-gray-500 hover:text-gray-700">
                Terms
              </Link>
              <Link href="/privacy" className="text-gray-500 hover:text-gray-700">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
