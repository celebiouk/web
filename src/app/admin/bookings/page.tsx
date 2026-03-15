import { createClient } from '@/lib/supabase/server';
import { Calendar, Clock, CheckCircle, XCircle, Video } from 'lucide-react';

type BookingWithProfile = {
  id: string;
  status: string;
  scheduled_at: string;
  customer_email: string;
  profiles: { full_name: string | null; username: string | null } | null;
  products: { title: string } | null;
};

export default async function AdminBookingsPage() {
  const supabase = await createClient();

  const { data: bookings, count } = await supabase
    .from('bookings')
    .select(`
      *,
      profiles!bookings_creator_id_fkey(full_name, username),
      products(title)
    `, { count: 'exact' })
    .order('scheduled_at', { ascending: false })
    .limit(50) as unknown as { data: BookingWithProfile[] | null; count: number | null };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
      case 'completed':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Booking Management
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          {count?.toLocaleString()} total bookings
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{count || 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500 text-white">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {bookings?.filter(b => b.status === 'pending').length || 0}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Confirmed</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {bookings?.filter(b => b.status === 'confirmed').length || 0}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Cancelled</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {bookings?.filter(b => b.status === 'cancelled').length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Booking</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Creator</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {bookings?.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/10">
                      <Video className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {booking.products?.title || '1:1 Session'}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  @{booking.profiles?.username || 'unknown'}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {booking.customer_email}
                </td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">
                  {new Date(booking.scheduled_at).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
