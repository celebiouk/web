'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button, Input, Spinner } from '@/components/ui';

export default function SubmitTestimonialPage() {
  const params = useParams();
  const token = useMemo(() => params.token as string, [params.token]);

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productTitle, setProductTitle] = useState('your purchase');
  const [expectedEmail, setExpectedEmail] = useState('');

  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerAvatarUrl, setBuyerAvatarUrl] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function verify() {
      try {
        const response = await fetch(`/api/testimonials/request/${token}`);
        const json = await response.json();

        if (!response.ok || !json.valid) {
          setError(json.error || 'Invalid testimonial link');
          return;
        }

        setValid(true);
        setProductTitle(json.productTitle || 'your purchase');
        setExpectedEmail(json.buyerEmail || '');
      } catch {
        setError('Failed to verify testimonial link');
      } finally {
        setLoading(false);
      }
    }

    void verify();
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/testimonials/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          buyerName,
          buyerEmail,
          buyerAvatarUrl,
          content,
          rating,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error || 'Failed to submit testimonial');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Failed to submit testimonial');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Invalid Link</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{error || 'This testimonial link is invalid or expired.'}</p>
            <Link href="/">
              <Button className="mt-5">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Thank you!</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Your testimonial has been submitted for review. It will appear publicly once approved.
            </p>
            <Link href="/">
              <Button className="mt-5">Done</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 dark:bg-gray-950">
      <div className="mx-auto w-full max-w-2xl px-4">
        <Card>
          <CardContent className="space-y-5 p-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Share Your Testimonial</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                You are reviewing <strong>{productTitle}</strong>. Your email must match the purchase email.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Your Name *</label>
                <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required maxLength={120} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Purchase Email *</label>
                <Input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  required
                  placeholder={expectedEmail}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Photo URL (optional)</label>
                <Input value={buyerAvatarUrl} onChange={(e) => setBuyerAvatarUrl(e.target.value)} placeholder="https://..." />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Rating</label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Your Testimonial *</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  minLength={20}
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Share your experience, results, and what you liked most."
                />
              </div>

              {error ? <p className="text-sm text-red-500">{error}</p> : null}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Testimonial'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
