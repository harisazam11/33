
"use client";

import type React from "react";
import Header from "./Header";
import SidebarNav, { type NavItem } from "./SidebarNav";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "next-auth/react";

type AppLayoutProps = {
  children: React.ReactNode;
  portalName: string;
  navItems: NavItem[];
};

export default function AppLayout({ children, portalName, navItems }: AppLayoutProps) {
  const { toast } = useToast();

  const handleLogout = async () => {
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    await signOut({ callbackUrl: '/' }); // Redirect to home after sign out
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-muted/40">
        <Sidebar collapsible="offcanvas" variant="sidebar" side="left" className="border-r flex flex-col">
          <SidebarHeader className="p-4 border-b">
             <Link href="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground font-headline">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-primary">
                <path d="M12.378 1.602a.75.75 0 00-.756 0L3.366 6.15A.75.75 0 003 6.82V21a.75.75 0 00.75.75h16.5A.75.75 0 0021 21V6.82a.75.75 0 00-.366-.67l-8.256-4.547zM12 3.732l7.401 4.07-3.213 1.768-7.402-4.07L12 3.732zM5.25 7.841l3.213 1.768L12 11.378l3.537-1.769 3.213-1.768v11.95H5.25V7.841z"/>
              </svg>
              <span className="group-data-[collapsible=icon]:hidden transition-opacity duration-200">Quetta E-Challan</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="flex-1">
            <SidebarNav navItems={navItems} />
          </SidebarContent>
          <SidebarFooter className="p-2 border-t group-data-[collapsible=icon]:p-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-5 w-5 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />
              <span className="ml-2 group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          <Header portalName={portalName} />
          <main className="flex-1 flex flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
