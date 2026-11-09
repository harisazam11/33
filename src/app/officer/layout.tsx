
import AppLayout from "@/components/layout/AppLayout";
import type { NavItem } from "@/components/layout/SidebarNav";

const officerNavItems: NavItem[] = [
  { href: "/officer", label: "Officer Home", icon: "HomeIcon", matchExact: true }, // Changed from FileText to HomeIcon and updated href/label
  { href: "/officer/issue-challan", label: "Issue Parking Challan", icon: "FileText" },
  { href: "/officer/violation-history", label: "Violation History", icon: "History" },
  { href: "/officer/restricted-areas", label: "Restricted Areas Map", icon: "MapPin" },
];

export default function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout portalName="E-challan Officer" navItems={officerNavItems}> {/* Changed portalName for clarity */}
      {children}
    </AppLayout>
  );
}
