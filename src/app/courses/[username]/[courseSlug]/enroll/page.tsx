'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import {
  ArrowLeft,
  BookOpen,
  Lock,
  Shield,
  CheckCircle,
  AlertCircle,
  CreditCard,
} from 'lucide-react';

function formatPrice(cents: number): string {
  if (cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export default function CourseEnrollPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const supabase = createClient();

  const username = params.username as string;
  const courseSlug = params.courseSlug as string;

  const [course, setCourse] = useState<{
    id: string;
    title: string;
    subtitle: string | null;
    cover_image_url: string | null;
    price_cents: number;
    creator_id: string;
  } | null>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load course
  useEffect(() => {
    async function loadCourse() {
      try {
        // Get creator
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username.toLowerCase())
          .single();

        if (!creatorData) {
          setError('Course not found');
          setIsLoading(false);
          return;
        }

        const creator = creatorData as { id: string };

        // Get course
        const { data: courseData } = await (supabase.from('courses') as any)
          .select('id, title, subtitle, cover_image_url, price_cents, creator_id')
          .eq('creator_id', creator.id)
          .eq('slug', courseSlug)
          .eq('status', 'published')
          .single();

        if (!courseData) {
          setError('Course not found');
          setIsLoading(false);
          return;
        }

        setCourse(courseData);

        // Pre-fill email if logged in
        if (user?.email) {
          setEmail(user.email);
        }
      } catch (err) {
        console.error('Error loading course:', err);
        setError('Failed to load course');
      } finally {
        setIsLoading(false);
      }
    }

    loadCourse();
  }, [username, courseSlug, user, supabase]);

  const handleEnroll = async () => {
    if (!course || !email) return;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          buyerEmail: email,
          userId: user?.id || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.alreadyEnrolled) {
          // Redirect to course player
          router.push(`/learn/${username}/${courseSlug}`);
          return;
        }
        throw new Error(data.error || 'Enrollment failed');
      }

      if (data.free) {
        // Free course — enrolled directly
        setSuccess(true);
        setTimeout(() => {
          router.push(`/learn/${username}/${courseSlug}`);
        }, 2000);
      } else if (data.clientSecret) {
        // Paid course — redirect to Stripe Checkout
        // For now, store the intent and redirect to a checkout page
        // In production this would use Stripe Elements inline
        router.push(
          `/courses/${username}/${courseSlug}/checkout?pi=${data.clientSecret}`
        );
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re Enrolled!</h2>
            <p className="text-gray-500 mb-6">
              Redirecting you to the course...
            </p>
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600">{error || 'Course not found'}</p>
            <Link href={`/courses/${username}/${courseSlug}`} className="text-indigo-600 hover:underline mt-4 inline-block">
              Go back
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-lg px-4">
        {/* Back */}
        <Link
          href={`/courses/${username}/${courseSlug}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to course
        </Link>

        <Card>
          <CardContent className="p-6">
            {/* Course Preview */}
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {course.cover_image_url ? (
                  <Image
                    src={course.cover_image_url}
                    alt={course.title}
                    width={80}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 line-clamp-2">{course.title}</h2>
                {course.subtitle && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{course.subtitle}</p>
                )}
              </div>
              <span className="text-lg font-bold text-gray-900 flex-shrink-0">
                {formatPrice(course.price_cents)}
              </span>
            </div>

            {/* Email */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isProcessing}
              />
              <p className="text-xs text-gray-400 mt-1">
                Course access will be linked to this email
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* CTA */}
            <Button
              onClick={handleEnroll}
              isLoading={isProcessing}
              disabled={!email || isProcessing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-base"
            >
              {course.price_cents === 0 ? (
                <>Enroll for Free</>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay {formatPrice(course.price_cents)}
                </>
              )}
            </Button>

            {/* Trust signals */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Secure checkout
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" /> Instant access
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
