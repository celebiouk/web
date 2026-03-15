/**
 * Auth layout - shared layout for login and signup pages
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center px-4 py-12">
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none fixed -left-40 top-0 h-[500px] w-[500px] rounded-full bg-brand-400/20 blur-3xl" />
      <div className="pointer-events-none fixed -right-40 bottom-0 h-[400px] w-[400px] rounded-full bg-accent-400/20 blur-3xl" />
      
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
