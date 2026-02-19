import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    redirect("/admin/login");
  }
  return <AdminDashboard />;
}
