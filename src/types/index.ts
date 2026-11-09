
// This file can be used for shared TypeScript types across the application.
import type { RestrictedAreaStatus as PrismaRestrictedAreaStatus } from "@prisma/client";

export type RestrictedAreaStatus = PrismaRestrictedAreaStatus;

export type RestrictedArea = {
  id: string;
  name: string;
  locationDescription: string; 
  restrictionType: string; 
  status: RestrictedAreaStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ViolationRecord = {
  id: string;
  date: string; // Should be ISO string or consistent date format
  plateNumber: string;
  vehicleType: string;
  violationType: string;
  violationLocation: string;
  status: 'Paid' | 'Unpaid' | 'Contested';
  fineAmount: number;
  issuedByOfficerBadgeId: string;
  notes?: string | null;
  capturedTimestamp?: string | null;
  capturedGeoLocation?: string | null;
  isFlaggedForReview: boolean;
  originalFineAmount?: number | null;
  fineAmountEditedByAdmin: boolean;
  reviewNotes?: string | null; // Admin's review notes

  // Officer's suggestions when flagging
  officerSuggestedFineAmount?: number | null;
  officerReviewNotes?: string | null;
  officerSuggestedViolationType?: string | null;
  officerSuggestedVehicleType?: string | null;
  officerSuggestedViolationLocation?: string | null;
  
  // Timestamps from DB
  createdAt: string;
  updatedAt: string;
};
