import Link from 'next/link';
import { BrandWordmark } from '@/components/ui/brand-wordmark';

export const metadata = {
  title: 'Terms of Service | cele.bio',
  description: 'Terms of Service for cele.bio',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            <BrandWordmark dotClassName="text-brand-600" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
          Terms of Service
        </h1>

        <div className="prose prose-gray max-w-none dark:prose-invert">
          <p className="text-gray-600 dark:text-gray-400">
            <strong>Effective Date:</strong> March 15, 2026
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using cele.bio (&quot;the Service&quot;), you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            cele.bio is a creator monetization platform that enables users to:
          </p>
          <ul>
            <li>Create personalized link-in-bio pages</li>
            <li>Sell digital products and courses</li>
            <li>Offer booking services for mentorship and consultations</li>
            <li>Accept payments through integrated payment processors</li>
          </ul>

          <h2>3. User Accounts</h2>
          <p>
            To use certain features of the Service, you must create an account. You are responsible
            for maintaining the confidentiality of your account credentials and for all activities
            that occur under your account.
          </p>

          <h2>4. Creator Responsibilities</h2>
          <p>As a creator on cele.bio, you agree to:</p>
          <ul>
            <li>Only sell products and services you have the right to sell</li>
            <li>Provide accurate descriptions of your products and services</li>
            <li>Fulfill all orders and bookings in a timely manner</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Not sell prohibited content (illegal, harmful, or infringing materials)</li>
          </ul>

          <h2>5. Payments and Fees</h2>
          <p>
            Payments are processed through third-party payment processors (Stripe, PayPal).
            cele.bio charges a platform fee on transactions as outlined in our pricing page.
            You are responsible for any taxes applicable to your earnings.
          </p>

          <h2>6. Refunds</h2>
          <p>
            Refund policies are set by individual creators. Creators are responsible for
            handling refund requests for their products and services. cele.bio may intervene
            in disputes at our discretion.
          </p>

          <h2>7. Intellectual Property</h2>
          <p>
            You retain ownership of content you upload to cele.bio. By uploading content,
            you grant cele.bio a license to display and distribute your content as necessary
            to provide the Service.
          </p>

          <h2>8. Prohibited Activities</h2>
          <p>You may not:</p>
          <ul>
            <li>Use the Service for illegal purposes</li>
            <li>Upload malicious code or attempt to hack the Service</li>
            <li>Impersonate others or misrepresent your identity</li>
            <li>Spam or harass other users</li>
            <li>Violate intellectual property rights of others</li>
          </ul>

          <h2>9. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account for violations of these
            terms. You may delete your account at any time through your account settings.
          </p>

          <h2>10. Disclaimer of Warranties</h2>
          <p>
            The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee
            uninterrupted or error-free service.
          </p>

          <h2>11. Limitation of Liability</h2>
          <p>
            cele.bio shall not be liable for indirect, incidental, or consequential damages
            arising from your use of the Service.
          </p>

          <h2>12. Changes to Terms</h2>
          <p>
            We may update these terms at any time. Continued use of the Service after changes
            constitutes acceptance of the new terms.
          </p>

          <h2>13. Contact</h2>
          <p>
            For questions about these Terms of Service, contact us at{' '}
            <a href="mailto:legal@cele.bio" className="text-brand-600 hover:text-brand-700">
              legal@cele.bio
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
