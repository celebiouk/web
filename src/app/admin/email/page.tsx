'use client';

import { useEffect, useMemo, useState } from 'react';
import { Mail, Send, Users, FileText, Eye, Search, Plus, Settings, X } from 'lucide-react';

type TemplateCatalog = {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultSubject: string;
  defaultHtml: string;
};

type Broadcast = {
  id: string;
  subject: string;
  preview_text: string | null;
  body_html: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  segment: { type: 'all' | 'tag' | 'product' | 'course_students' | 'buyers' | 'platform_users' | 'platform_pro' | 'platform_free' | 'platform_subscribers'; value?: string };
  recipient_count: number;
  sent_at: string | null;
  scheduled_at: string | null;
  created_at: string;
};

type Subscriber = {
  id: string;
  email: string;
};

const templateCatalog: TemplateCatalog[] = [
  { id: 'welcome', name: 'Welcome Email', description: 'Sent to new users after signup', category: 'Onboarding', defaultSubject: 'Welcome to cele.bio!', defaultHtml: '<p>Hey {{first_name}}, welcome to cele.bio.</p>' },
  { id: 'product-upload', name: 'Product Upload Success', description: 'Confirms product was published', category: 'Products', defaultSubject: 'Your product is now live', defaultHtml: '<p>Your product has been published successfully.</p>' },
  { id: 'sale-notification', name: 'Sale Notification', description: 'Notifies creator of new sale', category: 'Sales', defaultSubject: 'You made a new sale 🎉', defaultHtml: '<p>Congrats — you just made a sale.</p>' },
  { id: 'order-received', name: 'Order Received', description: 'Sent to buyer after purchase', category: 'Orders', defaultSubject: 'Your order is confirmed', defaultHtml: '<p>Thanks for your purchase.</p>' },
  { id: 'payment-successful', name: 'Payment Successful', description: 'Payment processed successfully', category: 'Payments', defaultSubject: 'Payment successful', defaultHtml: '<p>Your payment has been processed successfully.</p>' },
  { id: 'payment-failed', name: 'Payment Failed', description: 'Payment could not be processed', category: 'Payments', defaultSubject: 'Payment failed', defaultHtml: '<p>We could not process your payment.</p>' },
  { id: 'pro-welcome', name: 'Pro Subscription Activated', description: 'Welcome to Pro tier', category: 'Subscriptions', defaultSubject: 'Welcome to Pro', defaultHtml: '<p>Your Pro subscription is now active.</p>' },
  { id: 'pro-cancelled', name: 'Pro Subscription Cancelled', description: 'Subscription cancellation confirmation', category: 'Subscriptions', defaultSubject: 'Subscription cancelled', defaultHtml: '<p>Your subscription has been cancelled.</p>' },
  { id: 'renewal-reminder', name: 'Subscription Renewal Reminder', description: 'Upcoming renewal notification', category: 'Subscriptions', defaultSubject: 'Renewal reminder', defaultHtml: '<p>Your subscription renews soon.</p>' },
  { id: 'password-reset', name: 'Password Reset', description: 'Password reset link', category: 'Auth', defaultSubject: 'Reset your password', defaultHtml: '<p>Use your secure link to reset your password.</p>' },
  { id: 'email-verification', name: 'Email Verification', description: 'Verify email address', category: 'Auth', defaultSubject: 'Verify your email', defaultHtml: '<p>Please verify your email address.</p>' },
  { id: 'booking-confirmation', name: 'Booking Confirmation', description: 'Booking details and calendar invite', category: 'Bookings', defaultSubject: 'Booking confirmed', defaultHtml: '<p>Your booking is confirmed.</p>' },
  { id: 'booking-reminder', name: 'Booking Reminder', description: '24h before booking reminder', category: 'Bookings', defaultSubject: 'Booking reminder', defaultHtml: '<p>This is a reminder for your upcoming booking.</p>' },
  { id: 'booking-cancelled', name: 'Booking Cancelled', description: 'Booking cancellation notice', category: 'Bookings', defaultSubject: 'Booking cancelled', defaultHtml: '<p>Your booking has been cancelled.</p>' },
  { id: 'course-enrollment', name: 'Course Enrollment', description: 'Course access confirmation', category: 'Courses', defaultSubject: 'Course enrollment confirmed', defaultHtml: '<p>You are now enrolled in the course.</p>' },
  { id: 'course-completion', name: 'Course Completion', description: 'Certificate of completion', category: 'Courses', defaultSubject: 'Course completed', defaultHtml: '<p>Congratulations on completing your course.</p>' },
  { id: 'affiliate-welcome', name: 'Affiliate Welcome', description: 'Welcome to affiliate program', category: 'Affiliates', defaultSubject: 'Welcome affiliate partner', defaultHtml: '<p>Welcome to the affiliate program.</p>' },
  { id: 'affiliate-payout', name: 'Affiliate Commission Paid', description: 'Commission payout notification', category: 'Affiliates', defaultSubject: 'Affiliate payout sent', defaultHtml: '<p>Your commission payout is on the way.</p>' },
];

const categories = ['All', 'Onboarding', 'Products', 'Sales', 'Orders', 'Payments', 'Subscriptions', 'Auth', 'Bookings', 'Courses', 'Affiliates'];

function buildWebsiteTemplateHtml(template: TemplateCatalog): string {
  return `
<h1 style="margin:0 0 14px;font-size:30px;line-height:1.15;">${template.name}</h1>
<p style="margin:0 0 18px;color:#334155;font-size:16px;line-height:1.7;">${template.description}</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:separate;border-spacing:0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
  <tr>
    <td style="padding:16px 18px;">
      <h3 style="margin:0 0 8px;font-size:18px;">What this update includes</h3>
      <ul style="margin:0;padding-left:18px;color:#334155;line-height:1.7;">
        <li>Short and clear summary for the recipient</li>
        <li>One primary call-to-action button</li>
        <li>Space for details, links, and next steps</li>
      </ul>
    </td>
  </tr>
</table>

<p style="margin:0 0 18px;color:#0f172a;">Hi {{first_name}}, this message is from {{creator_name}} on cele.bio.</p>

<p style="margin:0 0 24px;">
  <a href="https://cele.bio/dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px;">Open Dashboard</a>
</p>

<p style="margin:0;color:#64748b;font-size:14px;">Need help? Reply to this email and our team will assist you.</p>
`.trim();
}

export default function AdminEmailPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'history'>('templates');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  const [composeData, setComposeData] = useState({
    segmentType: 'platform_users' as 'all' | 'tag' | 'product' | 'course_students' | 'buyers' | 'platform_users' | 'platform_pro' | 'platform_free' | 'platform_subscribers',
    segmentValue: '',
    subject: '',
    previewText: '',
    bodyHtml: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTemplates = useMemo(() => {
    return templateCatalog.filter((template) => {
      const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const previewTemplate = previewTemplateId
    ? templateCatalog.find((template) => template.id === previewTemplateId) || null
    : null;

  useEffect(() => {
    void loadEmailData();
  }, []);

  async function loadEmailData() {
    setIsLoadingData(true);
    setActionMessage(null);
    try {
      const [broadcastsRes, subscribersRes] = await Promise.all([
        fetch('/api/email/broadcasts', { cache: 'no-store' }),
        fetch('/api/email/subscribers?scope=platform', { cache: 'no-store' }),
      ]);

      if (broadcastsRes.ok) {
        const broadcastsJson = await broadcastsRes.json();
        setBroadcasts((broadcastsJson.broadcasts || []) as Broadcast[]);
      }

      if (subscribersRes.ok) {
        const subscribersJson = await subscribersRes.json();
        setSubscribers((subscribersJson.subscribers || []) as Subscriber[]);
      } else {
        const subscribersJson = await subscribersRes.json().catch(() => ({}));
        setActionMessage(subscribersJson.error || 'Failed to load platform users for email.');
      }
    } catch {
      setActionMessage('Failed to load email data.');
    } finally {
      setIsLoadingData(false);
    }
  }

  function useTemplate(template: TemplateCatalog) {
    setComposeData((prev) => ({
      ...prev,
      subject: template.defaultSubject,
      bodyHtml: buildWebsiteTemplateHtml(template),
      previewText: template.description,
    }));
    setActiveTab('compose');
    setActionMessage(`Loaded template: ${template.name}`);
  }

  async function saveDraft() {
    if (!composeData.subject.trim() || !composeData.bodyHtml.trim()) {
      setActionMessage('Subject and content are required to save a draft.');
      return;
    }

    setIsSubmitting(true);
    setActionMessage(null);
    try {
      const response = await fetch('/api/email/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: composeData.subject,
          preview_text: composeData.previewText || undefined,
          body_html: composeData.bodyHtml,
          segment: {
            type: composeData.segmentType,
            value: composeData.segmentValue || undefined,
          },
          status: 'draft',
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        setActionMessage(json.error || 'Failed to save draft.');
        return;
      }

      setActionMessage('Draft saved successfully.');
      setActiveTab('history');
      await loadEmailData();
    } catch {
      setActionMessage('Failed to save draft.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function sendBroadcast(testOnly: boolean) {
    if (!composeData.subject.trim() || !composeData.bodyHtml.trim()) {
      setActionMessage('Subject and content are required before sending.');
      return;
    }

    setIsSubmitting(true);
    setActionMessage(null);

    try {
      const testEmail = testOnly ? window.prompt('Enter test email address') || undefined : undefined;
      if (testOnly && !testEmail) {
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/email/broadcast/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: composeData.subject,
          preview_text: composeData.previewText || undefined,
          body_html: composeData.bodyHtml,
          segment: {
            type: composeData.segmentType,
            value: composeData.segmentValue || undefined,
          },
          sendNow: true,
          testEmail,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        setActionMessage(json.error || 'Failed to send email.');
        return;
      }

      setActionMessage(testOnly ? 'Test email sent.' : `Broadcast sent to ${json.sent ?? 0} recipients.`);
      setActiveTab('history');
      await loadEmailData();
    } catch {
      setActionMessage('Failed to send email.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const sentTodayCount = broadcasts
    .filter((broadcast) => broadcast.sent_at && broadcast.sent_at.startsWith(todayIso))
    .reduce((total, broadcast) => total + (broadcast.recipient_count || 0), 0);

  const draftsCount = broadcasts.filter((broadcast) => broadcast.status === 'draft').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Management</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Create, send, and track real campaigns through platform APIs.</p>
        </div>
        <button
          onClick={() => {
            setActiveTab('compose');
            setComposeData((prev) => ({ ...prev, subject: '', previewText: '', bodyHtml: '' }));
          }}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 font-medium text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          New Template
        </button>
      </div>

      {actionMessage && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          {actionMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-white"><Users className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-gray-500">Platform Users</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{subscribers.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white"><Mail className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-gray-500">Broadcasts</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{broadcasts.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white"><Send className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-gray-500">Recipients Sent Today</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{sentTodayCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500 text-white"><FileText className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-gray-500">Drafts</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{draftsCount}</p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex gap-4">
          {[
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'compose', label: 'Compose', icon: Send },
            { id: 'history', label: 'History', icon: Mail },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-brand-500 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/10">
                    <Mail className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">{template.category}</span>
                </div>
                <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setPreviewTemplateId(template.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => useTemplate(template)}
                    className="flex items-center justify-center rounded-lg bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                    title="Use as compose base"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'compose' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Segment type</label>
                <select
                  value={composeData.segmentType}
                  onChange={(e) => setComposeData({ ...composeData, segmentType: e.target.value as typeof composeData.segmentType })}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="platform_users">All registered users (free + paid)</option>
                  <option value="platform_pro">Paid users only (Pro)</option>
                  <option value="platform_free">Free users only</option>
                  <option value="platform_subscribers">Subscribers only</option>
                  <option value="all">All creator subscribers</option>
                  <option value="tag">By tag</option>
                  <option value="buyers">Buyers of product</option>
                  <option value="course_students">Course students</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Segment value (optional)</label>
                <input
                  type="text"
                  value={composeData.segmentValue}
                  onChange={(e) => setComposeData({ ...composeData, segmentValue: e.target.value })}
                  placeholder="Tag or product/course ID"
                  disabled={composeData.segmentType === 'all' || composeData.segmentType === 'platform_users' || composeData.segmentType === 'platform_pro' || composeData.segmentType === 'platform_free' || composeData.segmentType === 'platform_subscribers'}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
              <input
                type="text"
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                placeholder="Enter email subject..."
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preview text</label>
              <input
                type="text"
                value={composeData.previewText}
                onChange={(e) => setComposeData({ ...composeData, previewText: e.target.value })}
                placeholder="Inbox preview line..."
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">HTML Content</label>
              <textarea
                value={composeData.bodyHtml}
                onChange={(e) => setComposeData({ ...composeData, bodyHtml: e.target.value })}
                placeholder="Enter HTML email content..."
                rows={10}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPreviewTemplateId('')}
                className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Preview
              </button>
              <button
                onClick={() => void saveDraft()}
                disabled={isSubmitting}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Save Draft
              </button>
              <button
                onClick={() => void sendBroadcast(true)}
                disabled={isSubmitting}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Send Test
              </button>
              <button
                onClick={() => void sendBroadcast(false)}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Recipients</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {broadcasts.map((broadcast) => (
                <tr key={broadcast.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{broadcast.subject}</td>
                  <td className="px-6 py-4 text-gray-500">{broadcast.status}</td>
                  <td className="px-6 py-4 text-gray-500">{broadcast.recipient_count || 0}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(broadcast.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-500">{broadcast.sent_at ? new Date(broadcast.sent_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {!broadcasts.length && !isLoadingData && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No broadcasts yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(previewTemplate || previewTemplateId === '') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setPreviewTemplateId(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{previewTemplate ? previewTemplate.name : 'Compose Preview'}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{previewTemplate ? previewTemplate.category : 'Current draft'}</p>
              </div>
              <button onClick={() => setPreviewTemplateId(null)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Subject</p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{previewTemplate ? previewTemplate.defaultSubject : composeData.subject || 'No subject'}</p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Preview</p>
                <div className="prose max-w-none text-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: previewTemplate ? buildWebsiteTemplateHtml(previewTemplate) : (composeData.bodyHtml || '<p>No content.</p>') }} />
              </div>

              <div className="flex justify-end">
                <button onClick={() => setPreviewTemplateId(null)} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600">Close Preview</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
