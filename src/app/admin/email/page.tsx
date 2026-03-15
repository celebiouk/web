'use client';

import { useState } from 'react';
import { Mail, Send, Users, FileText, Eye, Search, Plus, Settings } from 'lucide-react';

const emailTemplates = [
  { id: 'welcome', name: 'Welcome Email', description: 'Sent to new users after signup', category: 'Onboarding' },
  { id: 'product-upload', name: 'Product Upload Success', description: 'Confirms product was published', category: 'Products' },
  { id: 'sale-notification', name: 'Sale Notification', description: 'Notifies creator of new sale', category: 'Sales' },
  { id: 'order-received', name: 'Order Received', description: 'Sent to buyer after purchase', category: 'Orders' },
  { id: 'payment-successful', name: 'Payment Successful', description: 'Payment processed successfully', category: 'Payments' },
  { id: 'payment-failed', name: 'Payment Failed', description: 'Payment could not be processed', category: 'Payments' },
  { id: 'pro-welcome', name: 'Pro Subscription Activated', description: 'Welcome to Pro tier', category: 'Subscriptions' },
  { id: 'pro-cancelled', name: 'Pro Subscription Cancelled', description: 'Subscription cancellation confirmation', category: 'Subscriptions' },
  { id: 'renewal-reminder', name: 'Subscription Renewal Reminder', description: 'Upcoming renewal notification', category: 'Subscriptions' },
  { id: 'password-reset', name: 'Password Reset', description: 'Password reset link', category: 'Auth' },
  { id: 'email-verification', name: 'Email Verification', description: 'Verify email address', category: 'Auth' },
  { id: 'booking-confirmation', name: 'Booking Confirmation', description: 'Booking details and calendar invite', category: 'Bookings' },
  { id: 'booking-reminder', name: 'Booking Reminder', description: '24h before booking reminder', category: 'Bookings' },
  { id: 'booking-cancelled', name: 'Booking Cancelled', description: 'Booking cancellation notice', category: 'Bookings' },
  { id: 'course-enrollment', name: 'Course Enrollment', description: 'Course access confirmation', category: 'Courses' },
  { id: 'course-completion', name: 'Course Completion', description: 'Certificate of completion', category: 'Courses' },
  { id: 'affiliate-welcome', name: 'Affiliate Welcome', description: 'Welcome to affiliate program', category: 'Affiliates' },
  { id: 'affiliate-payout', name: 'Affiliate Commission Paid', description: 'Commission payout notification', category: 'Affiliates' },
];

const categories = ['All', 'Onboarding', 'Products', 'Sales', 'Orders', 'Payments', 'Subscriptions', 'Auth', 'Bookings', 'Courses', 'Affiliates'];

export default function AdminEmailPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'history'>('templates');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [composeData, setComposeData] = useState({
    to: 'all',
    subject: '',
    template: '',
    customContent: '',
  });

  const filteredTemplates = emailTemplates.filter(t => {
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Email Management
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Send emails and manage templates
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 font-medium text-white transition-colors hover:bg-brand-600">
          <Plus className="h-4 w-4" />
          New Template
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Emails Sent Today</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">1,247</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Delivery Rate</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">99.2%</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Open Rate</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">45.8%</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500 text-white">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Templates</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{emailTemplates.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
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

          {/* Templates Grid */}
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
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {template.category}
                  </span>
                </div>
                <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">
                  {template.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {template.description}
                </p>
                <div className="mt-4 flex gap-2">
                  <button className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                  <button className="flex items-center justify-center rounded-lg bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Recipients
              </label>
              <select
                value={composeData.to}
                onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Users</option>
                <option value="pro">Pro Subscribers Only</option>
                <option value="free">Free Users Only</option>
                <option value="creators">Creators Only</option>
                <option value="custom">Custom List...</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Template (Optional)
              </label>
              <select
                value={composeData.template}
                onChange={(e) => setComposeData({ ...composeData, template: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">No template (custom email)</option>
                {emailTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject
              </label>
              <input
                type="text"
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                placeholder="Enter email subject..."
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Content
              </label>
              <textarea
                value={composeData.customContent}
                onChange={(e) => setComposeData({ ...composeData, customContent: e.target.value })}
                placeholder="Enter email content..."
                rows={8}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                Save as Draft
              </button>
              <button className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                Preview
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 font-medium text-white transition-colors hover:bg-brand-600">
                <Send className="h-4 w-4" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Recipients</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Sent</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Opens</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Clicks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {[
                { subject: 'New feature announcement', recipients: 2450, sent: '2h ago', opens: '45%', clicks: '12%' },
                { subject: 'Weekly digest', recipients: 3200, sent: '1 day ago', opens: '38%', clicks: '8%' },
                { subject: 'System maintenance notice', recipients: 5100, sent: '3 days ago', opens: '62%', clicks: '5%' },
              ].map((email, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {email.subject}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {email.recipients.toLocaleString()} users
                  </td>
                  <td className="px-6 py-4 text-gray-500">{email.sent}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{email.opens}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{email.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
