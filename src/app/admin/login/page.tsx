import { redirect } from 'next/navigation';

/**
 * /admin/login redirects to /admin
 * The admin login gate is built into the /admin layout
 */
export default function AdminLoginPage() {
  redirect('/admin');
}
