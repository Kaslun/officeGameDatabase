import { isAdminConfigured } from "@/lib/admin-auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAdminConfigured()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <p className="text-zinc-400">
          Admin is not configured. Set <code className="rounded bg-zinc-800 px-1">ADMIN_PASSWORD</code> in .env.local
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
