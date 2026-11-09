
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { UserStatus } from "@prisma/client";

export type UserProfileDetails = {
  name: string;
  badgeNumber: string;
  email: string;
  status: UserStatus | 'Administrator';
  lastLogin?: string;
};

type UserProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  officer: UserProfileDetails | null;
};

export default function UserProfileModal({ isOpen, onClose, officer }: UserProfileModalProps) {
  if (!officer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">User Profile</DialogTitle>
          <DialogDescription>
            Your account details. This information is read-only.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</p>
            <p className="text-lg font-semibold">{officer.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Badge ID / Username</p>
            <p className="text-md">{officer.badgeNumber}</p>
          </div>
          {officer.email && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
              <p className="text-md">{officer.email}</p>
            </div>
          )}
          {officer.status && (
             <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status / Role</p>
                <Badge variant={
                  officer.status === 'Active' ? 'default' :
                  officer.status === 'Inactive' ? 'secondary' :
                  officer.status === 'Suspended' ? 'destructive' :
                  'outline' // For Admin or other non-standard statuses
                }
                className={
                    officer.status === 'Active' ? 'bg-green-500 hover:bg-green-600' :
                    officer.status === 'Inactive' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' :
                    officer.status === 'Administrator' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                    '' // Destructive for Suspended is handled by variant
                }
                >{officer.status}</Badge>
            </div>
          )}
          {officer.lastLogin && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Login</p>
              <p className="text-md">{officer.lastLogin}</p>
            </div>
          )}
          {officer.status === "Administrator" && (
            <div className="pt-2">
                <p className="text-xs text-muted-foreground">You are logged in as a System Administrator.</p>
            </div>
          )}
        </div>
        {/* No footer or action buttons as per read-only requirement and close on outside click */}
      </DialogContent>
    </Dialog>
  );
}
