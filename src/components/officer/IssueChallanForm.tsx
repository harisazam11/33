"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import AiPlateEntry from "./AiPlateEntry";
import ChallanDetailsForm from "./ChallanDetailsForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, FileText, ShieldQuestion, UserX } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";

const formSchema = z.object({
  plateNumber: z
    .string()
    .min(1, "Plate number is required.")
    .max(15, "Plate number too long."),
  vehicleType: z.string().min(1, "Vehicle type is required."),
  violationType: z
    .string()
    .min(1, "Violation type is required.")
    .default("Illegal Parking"),
  violationLocation: z
    .string()
    .min(1, "Textual location of violation is required.")
    .max(200, "Location text too long."),
  notes: z.string().max(500, "Notes too long.").optional(),
  fineAmount: z.coerce
    .number({
      invalid_type_error: "Fine must be a number",
    })
    .min(1, "Fine amount must be at least PKR 1"),

  capturedTimestamp: z.string().optional(),
  capturedGeoLocation: z.string().optional(),
});

type VehicleDetails = {
  id: string;
  plateNumber: string;
  ownerName: string;
  model: string;
  color: string;
  registrationDate: string;
  taxStatus: "Paid" | "Due" | "N/A";
  customsStatus: "Cleared" | "Pending" | "N/A";
};

export default function IssueChallanForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [aiPlateEntryKey, setAiPlateEntryKey] = useState(0);
  const [isVehicleNotFoundModalOpen, setIsVehicleNotFoundModalOpen] =
    useState(false);
  const [canProceedWithUnverified, setCanProceedWithUnverified] =
    useState(false);
  const [loggedInOfficerBadgeId, setLoggedInOfficerBadgeId] = useState<
    string | null
  >(null);

  useEffect(() => {
    // In a real app, this would come from session, but for now we continue with a direct check
    const officerId = "B1234"; // Mocking officer ID for now.
    setLoggedInOfficerBadgeId(officerId);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plateNumber: "",
      vehicleType: "",
      violationType: "Illegal Parking",
      violationLocation: "",
      notes: "",
      fineAmount: 0,
      capturedTimestamp: "",
      capturedGeoLocation: "",
    },
  });

  const plateNumberValue = form.watch("plateNumber");
  const [debouncedPlateNumber] = useDebounce(plateNumberValue, 500);

  const {
    data: vehicleData,
    isLoading: isVerifyingPlate,
    isError,
    error: verificationError,
  } = useQuery<VehicleDetails, Error>({
    queryKey: ["verifyPlate", debouncedPlateNumber],
    queryFn: async () => {
      const response = await fetch(
        `/api/officer/verify-plate?plateNumber=${debouncedPlateNumber}`
      );
      if (response.status === 404) {
        throw new Error("Vehicle not found");
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to verify plate");
      }
      return response.json();
    },
    enabled:
      !!debouncedPlateNumber &&
      debouncedPlateNumber.length >= 3 &&
      !canProceedWithUnverified,
    retry: false, // Don't retry on 404s or other errors
  });

  const isCurrentPlateValidAndFound = useMemo(
    () => !!vehicleData,
    [vehicleData]
  );

  const challanMutation = useMutation({
    mutationFn: (newChallan: z.infer<typeof formSchema>) => {
      return fetch("/api/officer/challans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newChallan),
      });
    },
    onSuccess: async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit challan");
      }

      const values = form.getValues();
      const fineMessage = values.fineAmount
        ? ` with a fine of PKR ${values.fineAmount}`
        : "";

      toast({
        title: "Parking Challan Submitted!",
        description: `Parking E-Challan for ${values.plateNumber}${fineMessage} has been successfully issued.`,
        action: <CheckCircle className="text-green-500" />,
      });

      queryClient.invalidateQueries({ queryKey: ["officerChallans"] });
      // Removed handleCancelViolation() from here
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: error.message,
      });
    },
  });

  useEffect(() => {
    if (isCurrentPlateValidAndFound && vehicleData) {
      const { ownerName, model, color } = vehicleData;
      const notesString = `Verified Vehicle: Owner: ${ownerName}, Model: ${model}, Color: ${color}.`;
      form.setValue("notes", notesString);
      setIsVehicleNotFoundModalOpen(false);
    } else if (
      debouncedPlateNumber &&
      !isVerifyingPlate &&
      verificationError &&
      verificationError.message === "Vehicle not found"
    ) {
      form.setValue("notes", "");
      if (!isVehicleNotFoundModalOpen && !canProceedWithUnverified) {
        setIsVehicleNotFoundModalOpen(true);
      }
    }
  }, [
    isCurrentPlateValidAndFound,
    vehicleData,
    form,
    isVerifyingPlate,
    debouncedPlateNumber,
    verificationError,
    canProceedWithUnverified,
  ]);

  const resetForm = () => {
    form.reset();
    setCanProceedWithUnverified(false);
    setAiPlateEntryKey((prevKey) => prevKey + 1);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // If fineAmount is 0 or empty, remove it from submission
    const submissionValues = {
      ...values,
      fineAmount: values.fineAmount || undefined,
    };

    if (!loggedInOfficerBadgeId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot issue challan. Officer not logged in.",
      });
      return;
    }
    challanMutation.mutate(values);
  }

  const handlePlateDataConfirmed = (plateData: {
    plateNumber: string;
    geoLocation: string;
    timestamp: string;
  }) => {
    setCanProceedWithUnverified(false); // Reset this on new capture
    form.reset(); // Reset the form first
    form.setValue("plateNumber", plateData.plateNumber.toUpperCase());
    form.setValue("capturedGeoLocation", plateData.geoLocation);
    form.setValue(
      "capturedTimestamp",
      new Date(plateData.timestamp).toLocaleString()
    );
    form.setValue("violationType", "Illegal Parking");
    toast({
      title: "Data Pre-filled from Capture",
      description: "Plate, time, and location added. Verifying plate...",
    });
  };

  const handleProceedAnyway = () => {
    setCanProceedWithUnverified(true);
    setIsVehicleNotFoundModalOpen(false);
    form.setValue(
      "notes",
      "Unverified vehicle. Details entered manually by officer."
    );
  };

  const handleTryAgain = () => {
    setIsVehicleNotFoundModalOpen(false);
    form.setValue("plateNumber", "");
    setCanProceedWithUnverified(false);
  };

  const handleCancelViolation = () => {
    form.reset();
    setCanProceedWithUnverified(false);
    setAiPlateEntryKey((prevKey) => prevKey + 1);
    toast({
      title: "Violation Cancelled",
      description: "Form and camera reset. Ready for new entry.",
    });
  };

  if (!loggedInOfficerBadgeId) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <UserX className="text-destructive h-6 w-6" /> Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            You must be logged in as an officer to issue a challan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <AiPlateEntry
            key={aiPlateEntryKey}
            onPlateDataConfirmed={handlePlateDataConfirmed}
          />
        </div>
        <div className="lg:col-span-2">
          <Card className="w-full shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <FileText className="text-primary" /> Parking E-Challan Details
              </CardTitle>
              <CardDescription>
                Fill in or confirm the details below. License plate will be
                auto-verified.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChallanDetailsForm
                form={form}
                onSubmit={onSubmit}
                isSubmitting={challanMutation.isPending}
                isVerifyingPlate={isVerifyingPlate}
                isCurrentPlateValidAndFound={isCurrentPlateValidAndFound}
                handleCancelViolation={handleCancelViolation}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={isVehicleNotFoundModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldQuestion className="text-destructive h-6 w-6" /> Vehicle
              Not Found
            </AlertDialogTitle>
            <AlertDialogDescription>
              The vehicle with plate number "{plateNumberValue}" was not found
              in the database. Would you like to try again, or proceed with
              issuing the challan to this unverified plate number?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleTryAgain}>
              Try a Different Plate
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleProceedAnyway}>
              Cancel Violation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
