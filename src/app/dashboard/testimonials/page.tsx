'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, Button, Badge, Spinner } from '@/components/ui';

type CompletedOrder = {
  id: string;
  product_id: string;
  buyer_email: string;
  status: string;
  created_at: string;
  products?: { title?: string };
};

type TestimonialRequest = {
  id: string;
  order_id: string;
  status: 'pending' | 'submitted' | 'expired' | 'revoked';
  expires_at: string;
  submitted_at: string | null;
  created_at: string;
};

type Testimonial = {
  id: string;
  product_id: string;
  order_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_avatar_url: string | null;
  content: string;
  rating: number | null;
  is_published: boolean;
  created_at: string;
  products?: { title?: string };
};

export default function DashboardTestimonialsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [requests, setRequests] = useState<TestimonialRequest[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [requestingOrderId, setRequestingOrderId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/testimonials');
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to load testimonials');
      }

      setOrders(json.completedOrders || []);
      setRequests(json.requests || []);
      setTestimonials(json.testimonials || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const requestByOrderId = useMemo(() => {
    const map = new Map<string, TestimonialRequest>();
    requests.forEach((req) => map.set(req.order_id, req));
    return map;
  }, [requests]);

  const testimonialByOrderId = useMemo(() => {
    const map = new Map<string, Testimonial>();
    testimonials.forEach((item) => map.set(item.order_id, item));
    return map;
  }, [testimonials]);

  async function requestTestimonial(orderId: string) {
    setRequestingOrderId(orderId);
    setError(null);

    try {
      const res = await fetch('/api/dashboard/testimonials/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to request testimonial');
      }

      if (!json.emailSent && json.submitUrl) {
        await navigator.clipboard.writeText(json.submitUrl);
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request testimonial');
    } finally {
      setRequestingOrderId(null);
    }
  }

  async function togglePublish(id: string, isPublished: boolean) {
    setTogglingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/dashboard/testimonials/${id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to update testimonial');
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update testimonial');
    } finally {
      setTogglingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verified Testimonials</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Request testimonials from real buyers and choose which ones to publish.
          </p>
        </div>
        <Link href="/dashboard/products">
          <Button variant="outline">Back to Products</Button>
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Eligible Buyers</h2>
          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No completed orders yet.</p>
            ) : (
              orders.map((order) => {
                const request = requestByOrderId.get(order.id);
                const testimonial = testimonialByOrderId.get(order.id);
                const disabled = Boolean(request && request.status === 'pending') || Boolean(testimonial);

                return (
                  <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {order.products?.title || 'Product'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{order.buyer_email}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {testimonial ? <Badge variant="success">Submitted</Badge> : null}
                      {request?.status === 'pending' ? <Badge variant="default">Request sent</Badge> : null}

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={disabled || requestingOrderId === order.id}
                        onClick={() => requestTestimonial(order.id)}
                      >
                        {requestingOrderId === order.id ? 'Sending...' : 'Request testimonial'}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Submitted Testimonials</h2>

          {testimonials.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No testimonials submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {testimonial.buyer_name} · {testimonial.products?.title || 'Product'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{testimonial.buyer_email}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={testimonial.is_published ? 'success' : 'default'}>
                        {testimonial.is_published ? 'Published' : 'Unpublished'}
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={togglingId === testimonial.id}
                        onClick={() => togglePublish(testimonial.id, testimonial.is_published)}
                      >
                        {togglingId === testimonial.id
                          ? 'Saving...'
                          : testimonial.is_published
                            ? 'Unpublish'
                            : 'Publish'}
                      </Button>
                    </div>
                  </div>

                  {testimonial.rating ? (
                    <p className="mt-2 text-xs text-amber-500">{'★'.repeat(testimonial.rating)}</p>
                  ) : null}

                  <p className="mt-2 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                    {testimonial.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
