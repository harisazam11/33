
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LucideIcon,
  LayoutDashboard,
  Users,
  BarChart3, 
  MapPin,
  FileText,
  ShieldCheck,
  History,
  ListChecks, 
  Home as HomeIcon,
  Settings // Added Settings icon
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: string; 
  matchExact?: boolean;
};

type SidebarNavProps = {
  navItems: NavItem[];
};

const iconComponents: { [key: string]: LucideIcon } = {
  LayoutDashboard,
  Users,
  BarChart3,
  MapPin,
  FileText,
  ShieldCheck,
  History,
  ListChecks, 
  HomeIcon,
  Settings, // Added Settings to the map
};

export default function SidebarNav({ navItems }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-auto py-2">
      <SidebarMenu>
        {navItems.map((item) => {
          const isActive = item.matchExact ? pathname === item.href : pathname.startsWith(item.href);
          const IconComponent = iconComponents[item.icon];
          return (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  className={cn(
                    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                  )}
                  isActive={isActive}
                  tooltip={{ children: item.label, className: "font-body" }}
                >
                  {IconComponent && <IconComponent className="h-5 w-5" />}
                  <span className="font-body">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}
