'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Spinner } from '@/components/ui';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

type RangePreset = '7d' | '30d' | '90d' | 'year' | 'all';

type AnalyticsResponse = {
  isPro: boolean;
  overview: {
    totalRevenue: number;
    revenueChange: number;
    totalOrders: number;
    ordersChange: number;
    pageViews: number;
    pageViewsChange: number;
    conversionRate: number;
    conversionRateChange: number;
    emailSubscribers: number;
    newSubscribersThisMonth: number;
    averageOrderValue: number;
    averageOrderValueChange: number;
  };
  revenueSeries: Array<{ date: string; revenue: number; orders: number }>;
  trafficSources: Array<{ source: string; views: number }>;
  topCountries: Array<{ country: string; views: number }>;
  deviceBreakdown: Array<{ device: string; value: number }>;
  peakTrafficHeatmap: Array<{ day: number; hour: number; views: number }>;
  topProducts: Array<{ id: string; name: string; type: string; views: number; orders: number; revenue: number; conversionRate: number }>;
  bookingsAnalytics: {
    totalCalls: number;
    revenue: number;
    avgSessionValue: number;
    repeatBookingRate: number;
  };
  courseAnalytics: Array<{ id: string; title: string; enrolled: number; completionRate: number; avgProgress: number; revenue: number }>;
};

const COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#22c55e', '#64748b'];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatDelta(value: number) {
  const positive = value >= 0;
  return {
    label: `${positive ? '+' : ''}${value}%`,
    positive,
  };
}

function StatCard({ label, value, delta }: { label: string; value: string; delta: number }) {
  const d = formatDelta(delta);
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
          <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${d.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {d.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {d.label}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsClient() {
  const [range, setRange] = useState<RangePreset>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadAnalytics();
  }, [range, customFrom, customTo]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ range });
      if (customFrom) params.set('from', customFrom);
      if (customTo) params.set('to', customTo);
      const response = await fetch(`/api/analytics/overview?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }
      const json = (await response.json()) as AnalyticsResponse;
      setData(json);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load analytics';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const heatCells = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of data?.peakTrafficHeatmap || []) {
      map.set(`${item.day}-${item.hour}`, item.views);
    }
    return map;
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-error-600 dark:text-error-400">{error || 'Unable to load analytics'}</p>
          <Button className="mt-4" onClick={() => void loadAnalytics()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Understand traffic, conversion, and revenue performance.</p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', 'year', 'all'] as RangePreset[]).map((preset) => (
            <Button
              key={preset}
              size="sm"
              variant={range === preset ? 'primary' : 'outline'}
              onClick={() => setRange(preset)}
            >
              {preset === 'year' ? 'This year' : preset === 'all' ? 'All time' : `Last ${preset.replace('d', '')}d`}
            </Button>
          ))}
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
          <a href={`/api/analytics/overview?range=${range}&from=${encodeURIComponent(customFrom)}&to=${encodeURIComponent(customTo)}&format=csv`}>
            <Button size="sm" variant="outline">Export CSV</Button>
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Revenue" value={formatCurrency(data.overview.totalRevenue)} delta={data.overview.revenueChange} />
        <StatCard label="Total Orders" value={String(data.overview.totalOrders)} delta={data.overview.ordersChange} />
        <StatCard label="Page Views" value={String(data.overview.pageViews)} delta={data.overview.pageViewsChange} />
        <StatCard label="Conversion Rate" value={`${data.overview.conversionRate}%`} delta={data.overview.conversionRateChange} />
        <StatCard label="Email Subscribers" value={`${data.overview.emailSubscribers} (+${data.overview.newSubscribersThisMonth})`} delta={0} />
        <StatCard label="Average Order Value" value={formatCurrency(data.overview.averageOrderValue)} delta={data.overview.averageOrderValueChange} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Revenue Trend</CardTitle>
          <Badge variant="default">{range.toUpperCase()}</Badge>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
              <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {!data.isPro ? (
        <Card className="border-brand-200 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-500/10">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced analytics is a Pro feature</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Unlock traffic sources, top products, audience insights, bookings analytics, and course analytics.</p>
            <Link href="/dashboard/settings/billing" className="mt-4 inline-block">
              <Button>Upgrade to Pro</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.trafficSources} dataKey="views" nameKey="source" outerRadius={100}>
                      {data.trafficSources.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topCountries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Views</th>
                      <th className="px-4 py-3">Orders</th>
                      <th className="px-4 py-3">Revenue</th>
                      <th className="px-4 py-3">Conversion</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {data.topProducts.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.type}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.views}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.orders}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{formatCurrency(row.revenue)}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.conversionRate}%</td>
                        <td className="px-4 py-3">
                          <Link href="/dashboard/products/bundles/new">
                            <Button size="sm" variant="outline">Boost</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.deviceBreakdown} dataKey="value" nameKey="device" outerRadius={100}>
                      {data.deviceBreakdown.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bookings Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total calls</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{data.bookingsAnalytics.totalCalls}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Revenue</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data.bookingsAnalytics.revenue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Avg session value</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data.bookingsAnalytics.avgSessionValue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Repeat booking rate</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{data.bookingsAnalytics.repeatBookingRate}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Peak Traffic Hours (7x24)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-24 gap-1 overflow-x-auto">
                {Array.from({ length: 7 }).map((_, day) => (
                  <div key={day} className="col-span-24 grid grid-cols-24 gap-1">
                    {Array.from({ length: 24 }).map((_, hour) => {
                      const views = heatCells.get(`${day}-${hour}`) || 0;
                      const intensity = Math.min(views / 8, 1);
                      return (
                        <div
                          key={`${day}-${hour}`}
                          className="h-3 rounded"
                          title={`Day ${day}, ${hour}:00 — ${views} views`}
                          style={{ backgroundColor: `rgba(14,165,233,${0.08 + intensity * 0.82})` }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Analytics</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                      <th className="px-4 py-3">Course</th>
                      <th className="px-4 py-3">Enrolled</th>
                      <th className="px-4 py-3">Completion</th>
                      <th className="px-4 py-3">Avg Progress</th>
                      <th className="px-4 py-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {data.courseAnalytics.map((course) => (
                      <tr key={course.id}>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{course.title}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{course.enrolled}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{course.completionRate}%</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{course.avgProgress}%</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{formatCurrency(course.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
