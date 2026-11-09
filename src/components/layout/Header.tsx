
"use client"; 

import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import ThemeToggle from '@/components/shared/ThemeToggle';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import UserProfileModal, { type UserProfileDetails } from './UserProfileModal';
import { useSession } from "next-auth/react";

type HeaderProps = {
  portalName: string;
};

export default function Header({ portalName }: HeaderProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { data: session } = useSession();

  const handleOpenProfileModal = () => {
    if (session?.user) {
      setIsProfileModalOpen(true);
    } else {
      console.error("User not identified for profile modal.");
    }
  };

  const getProfileDetails = (): UserProfileDetails | null => {
    if (!session?.user) return null;

    return {
      name: session.user.name ?? 'N/A',
      badgeNumber: session.user.badgeNumber,
      email: session.user.email ?? 'N/A',
      status: session.user.role === 'ADMIN' ? 'Administrator' : session.user.status,
      lastLogin: "Now" // This can be enhanced later if lastLogin is added to session
    };
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 shadow-sm">
        <SidebarTrigger />
        
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base font-headline">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-primary">
              <path d="M12.378 1.602a.75.75 0 00-.756 0L3.366 6.15A.75.75 0 003 6.82V21a.75.75 0 00.75.75h16.5A.75.75 0 0021 21V6.82a.75.75 0 00-.366-.67l-8.256-4.547zM12 3.732l7.401 4.07-3.213 1.768-7.402-4.07L12 3.732zM5.25 7.841l3.213 1.768L12 11.378l3.537-1.769 3.213-1.768v11.95H5.25V7.841z"/>
            </svg>
            <span className="sr-only">Quetta E-Challan System</span>
          </Link>
          <h1 className="text-lg font-semibold font-headline text-primary">{portalName}</h1>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <ThemeToggle />
          {session?.user && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={handleOpenProfileModal}
              title="View Profile"
            >
              <UserCircle className="h-5 w-5 text-foreground" />
              <span className="sr-only">View Profile</span>
            </Button>
          )}
        </div>
      </header>
      
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        officer={getProfileDetails()}
      />
    </>
  );
}
