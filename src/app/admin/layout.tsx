import { createClient } from '@/lib/supabase/server';
import { isInternalAdminEmail } from '@/lib/admin';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminLoginGate } from '@/components/admin/AdminLoginGate';
import { ManualPayoutAlertModal } from '@/components/admin/ManualPayoutAlertModal';

export const metadata = {
  title: 'Admin Dashboard | cele.bio',
  description: 'cele.bio admin dashboard',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <AdminLoginGate reason="Admin login required." />;
  }

  if (!isInternalAdminEmail(user.email)) {
    return (
      <AdminLoginGate
        reason="This account is not authorized for admin access."
        signedInEmail={user.email ?? null}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader user={user} />
        <ManualPayoutAlertModal />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
