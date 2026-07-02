import type { Metadata } from "next";
import AdminDashboardClient from "@/components/admin-dashboard-client";

export const metadata: Metadata = {
  title: "CoffeeDex Admin",
  description: "CoffeeDex internal operating room.",
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}
