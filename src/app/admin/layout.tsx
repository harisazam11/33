
import AppLayout from "@/components/layout/AppLayout";
import type { NavItem } from "@/components/layout/SidebarNav";
import { Settings } from "lucide-react"; // Added for new icon

const adminNavItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "LayoutDashboard", matchExact: true },
  { href: "/admin/manage-officers", label: "Manage Officers", icon: "Users" },
  { href: "/admin/violations", label: "Violations", icon: "ListChecks" }, 
  { href: "/admin/restricted-areas", label: "Restricted Areas", icon: "MapPin" },
  { href: "/admin/settings", label: "Settings", icon: "Settings" }, // New Settings link
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout portalName="E-challan" navItems={adminNavItems}>
      {children}
    </AppLayout>
  );
}
