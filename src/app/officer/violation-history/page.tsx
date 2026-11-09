
"use client";
import { useState, useEffect, useMemo } from 'react';
import PageTitle from "@/components/shared/PageTitle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, ListFilter, History as HistoryIcon, UserX, Flag, MoreHorizontal, MapPin, Edit3, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ViolationRecord } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const vehicleTypesForSelect = ["Motorcycle", "Car", "Rickshaw", "Truck", "Bus", "Other"];
const parkingViolationTypesForSelect = [
  "Illegal Parking",
  "Parking in No Parking Zones",
  "Double Parking",
  "Parking on Sidewalks",
  "Parking on Zebra Crossings",
  "Parking Near Fire Hydrants",
  "Parking Near Intersections",
  "Parking in Front of Entrances",
  "Unauthorized Parking at Bus Stops",
  "Parking on Bridges or Traffic Islands",
  "General Obstruction Due to Parking"
];

type FlagChallanPayload = {
  isFlaggedForReview: true;
  officerReviewNotes: string;
  officerSuggestedFineAmount?: number | null;
  officerSuggestedViolationType?: string | null;
  officerSuggestedVehicleType?: string | null;
  officerSuggestedViolationLocation?: string | null;
};

export default function ViolationHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    Paid: true,
    Unpaid: true,
    Contested: true,
  });
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFlaggingModalOpen, setIsFlaggingModalOpen] = useState(false);
  const [challanToFlag, setChallanToFlag] = useState<ViolationRecord | null>(null);
  
  // State for flagging dialog inputs
  const [suggestedFineInput, setSuggestedFineInput] = useState<string | number>('');
  const [officerNotesInput, setOfficerNotesInput] = useState('');
  const [suggestedViolationTypeInput, setSuggestedViolationTypeInput] = useState<string>('');
  const [suggestedVehicleTypeInput, setSuggestedVehicleTypeInput] = useState<string>('');
  const [suggestedLocationInput, setSuggestedLocationInput] = useState<string>('');

  // Fetch data from the API
  const { data: allChallans = [], isLoading, isError } = useQuery<ViolationRecord[]>({
    queryKey: ['officerChallans', session?.user?.id],
    queryFn: async () => {
      const response = await fetch('/api/officer/challans');
      if (!response.ok) {
        throw new Error('Failed to fetch violation history');
      }
      return response.json();
    },
    enabled: !!session?.user?.id, // Only run the query if the user is logged in
  });

  const flagChallanMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string, payload: FlagChallanPayload }) => {
        const response = await fetch(`/api/officer/challans/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to flag challan.');
        }
        return response.json();
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['officerChallans'] });
        toast({
            title: "Challan Flagged",
            description: `Challan ${challanToFlag?.id} has been flagged for admin review.`,
        });
        setIsFlaggingModalOpen(false);
        setChallanToFlag(null);
    },
    onError: (error: Error) => {
        toast({
            variant: "destructive",
            title: "Flagging Failed",
            description: error.message,
        });
    },
  });

  const filteredViolations = useMemo(() => {
    if (!allChallans) return [];
    
    let tempViolations = [...allChallans];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempViolations = tempViolations.filter(v =>
        v.plateNumber.toLowerCase().includes(lowerSearchTerm) ||
        (v.notes && v.notes.toLowerCase().includes(lowerSearchTerm)) ||
        v.violationLocation.toLowerCase().includes(lowerSearchTerm) ||
        (v.capturedGeoLocation && v.capturedGeoLocation.toLowerCase().includes(lowerSearchTerm))
      );
    }

    const activeStatusFilters = Object.entries(statusFilters)
      .filter(([, isActive]) => isActive)
      .map(([statusKey]) => statusKey);

    if (activeStatusFilters.length > 0 && activeStatusFilters.length < Object.keys(statusFilters).length) {
       tempViolations = tempViolations.filter(v => activeStatusFilters.includes(v.status));
    }

    return tempViolations;
  }, [searchTerm, statusFilters, allChallans]);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilters(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const openFlagForReviewModal = (challan: ViolationRecord) => {
    setChallanToFlag(challan);
    setSuggestedFineInput(challan.officerSuggestedFineAmount ?? challan.fineAmount);
    setOfficerNotesInput(challan.officerReviewNotes || '');
    setSuggestedViolationTypeInput(challan.officerSuggestedViolationType || challan.violationType);
    setSuggestedVehicleTypeInput(challan.officerSuggestedVehicleType || challan.vehicleType);
    setSuggestedLocationInput(challan.officerSuggestedViolationLocation || challan.violationLocation);
    setIsFlaggingModalOpen(true);
  };

  const handleSubmitFlagDetails = () => {
    if (!challanToFlag) return;

    if (!officerNotesInput || officerNotesInput.trim() === '') {
        toast({variant: "destructive", title: "Notes Required", description: "Please provide notes explaining the reason for flagging this challan."});
        return;
    }
    
    let finalOfficerSuggestedFine: number | null = null;
    if (suggestedFineInput !== '') {
        const parsedFine = typeof suggestedFineInput === 'string' ? parseFloat(suggestedFineInput) : Number(suggestedFineInput);
        if (isNaN(parsedFine) || parsedFine < 0) {
            toast({variant: "destructive", title: "Invalid Suggested Fine", description: "Suggested fine must be a valid positive number."});
            return;
        }
        finalOfficerSuggestedFine = parsedFine;
    }

    const payload: FlagChallanPayload = {
      isFlaggedForReview: true,
      officerReviewNotes: officerNotesInput,
      officerSuggestedFineAmount: finalOfficerSuggestedFine !== challanToFlag.fineAmount ? finalOfficerSuggestedFine : null,
      officerSuggestedViolationType: suggestedViolationTypeInput !== challanToFlag.violationType ? suggestedViolationTypeInput : null,
      officerSuggestedVehicleType: suggestedVehicleTypeInput !== challanToFlag.vehicleType ? suggestedVehicleTypeInput : null,
      officerSuggestedViolationLocation: suggestedLocationInput !== challanToFlag.violationLocation ? suggestedLocationInput : null,
    };
    
    flagChallanMutation.mutate({ id: challanToFlag.id, payload });
  };


  if (isLoading) {
    return (
      <>
        <PageTitle title="Your Parking Violation History" description="Loading your records..." />
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="mx-auto h-12 w-12 mb-4 animate-spin" />
          <h3 className="text-xl font-semibold">Loading History...</h3>
        </div>
      </>
    );
  }

  if (!session?.user?.id) {
    return (
      <>
        <PageTitle title="Parking Violation History" description="Not logged in." />
        <Card className="shadow-lg">
          <CardContent className="text-center py-12 text-muted-foreground">
            <UserX className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-xl font-semibold">Access Denied</h3>
            <p>You must be logged in to view violation history.</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <TooltipProvider>
      <PageTitle title="Your Parking Violation History" description="Search, filter, and manage parking violation records you have issued." />
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by plate, location, notes, coords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg bg-background pl-8 md:w-[250px] lg:w-[350px]"
              />
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-1">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter Status</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-4" align="end">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Filter by Status</p>
                    {(Object.keys(statusFilters) as Array<keyof typeof statusFilters>).map(status => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-${status}`}
                          checked={statusFilters[status]}
                          onCheckedChange={() => handleStatusFilterChange(status)}
                        />
                        <Label htmlFor={`filter-${status}`} className="text-sm font-normal">{status}</Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredViolations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challan ID</TableHead>
                  <TableHead>Date Issued</TableHead>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Violation</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Fine (PKR)</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredViolations.map((violation) => (
                  <TableRow key={violation.id}>
                    <TableCell className="font-medium text-xs">{violation.id}</TableCell>
                    <TableCell>{new Date(violation.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono">{violation.plateNumber}</TableCell>
                    <TableCell>{violation.violationType} at {violation.violationLocation}</TableCell>
                    <TableCell className="text-xs">
                      {violation.capturedGeoLocation ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 cursor-default">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {violation.capturedGeoLocation.length > 20 ? `${violation.capturedGeoLocation.substring(0,17)}...` : violation.capturedGeoLocation}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{violation.capturedGeoLocation}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        violation.status === 'Paid' ? 'default' :
                        violation.status === 'Unpaid' ? 'destructive' :
                        'secondary'
                      }
                      className={
                        violation.status === 'Paid' ? 'bg-green-500 hover:bg-green-600' :
                        violation.status === 'Unpaid' ? '' :
                        'bg-yellow-500 hover:bg-yellow-600 text-black dark:text-black'
                      }
                      >
                        {violation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{violation.fineAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      {violation.isFlaggedForReview && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Flag className="h-5 w-5 text-orange-500" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs space-y-1">
                                <p className="font-semibold">Flagged for Admin Review</p>
                                {violation.officerReviewNotes && <p className="text-xs italic">Your notes: {violation.officerReviewNotes}</p>}
                                {violation.officerSuggestedFineAmount !== null && <p className="text-xs">Suggested Fine: {violation.officerSuggestedFineAmount?.toFixed(2)} PKR</p>}
                                {violation.officerSuggestedViolationType && <p className="text-xs">Suggested Violation: {violation.officerSuggestedViolationType}</p>}
                                {violation.officerSuggestedVehicleType && <p className="text-xs">Suggested Vehicle: {violation.officerSuggestedVehicleType}</p>}
                                {violation.officerSuggestedViolationLocation && <p className="text-xs">Suggested Location: {violation.officerSuggestedViolationLocation}</p>}
                            </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={flagChallanMutation.isPending}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => openFlagForReviewModal(violation)}
                            disabled={violation.isFlaggedForReview || violation.status === 'Paid'}
                          >
                            <Flag className="mr-2 h-4 w-4" /> Flag for Review
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <HistoryIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-xl font-semibold">No Parking Violations Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You have not issued any challans that match your current search or filter criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {challanToFlag && (
        <Dialog open={isFlaggingModalOpen} onOpenChange={setIsFlaggingModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-primary" /> Flag Challan {challanToFlag.id} for Review
              </DialogTitle>
              <DialogDescription>
                Current Fine: {challanToFlag.fineAmount.toFixed(2)} PKR. 
                Suggest changes or provide notes for admin review.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="suggestedViolationType" className="text-right col-span-1">Suggested Violation Type</Label>
                 <Select value={suggestedViolationTypeInput} onValueChange={setSuggestedViolationTypeInput}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select suggested violation type" />
                    </SelectTrigger>
                    <SelectContent>
                        {parkingViolationTypesForSelect.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="suggestedVehicleType" className="text-right col-span-1">Suggested Vehicle Type</Label>
                 <Select value={suggestedVehicleTypeInput} onValueChange={setSuggestedVehicleTypeInput}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select suggested vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                        {vehicleTypesForSelect.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="suggestedLocation" className="text-right col-span-1">Suggested Location</Label>
                <Input
                  id="suggestedLocation"
                  type="text"
                  value={suggestedLocationInput}
                  onChange={(e) => setSuggestedLocationInput(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter suggested location description"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="suggestedFine" className="text-right col-span-1">Suggested Fine (PKR)</Label>
                <Input
                  id="suggestedFine"
                  type="number"
                  value={suggestedFineInput}
                  onChange={(e) => setSuggestedFineInput(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="col-span-3"
                  placeholder={`Leave blank if no change, or enter new amount`}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="officerNotes" className="text-right col-span-1">Reason / Notes <span className="text-destructive">*</span></Label>
                <Textarea
                  id="officerNotes"
                  value={officerNotesInput}
                  onChange={(e) => setOfficerNotesInput(e.target.value)}
                  className="col-span-3"
                  placeholder="Explain why this challan needs review (e.g., fine adjustment, error in details)."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFlaggingModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitFlagDetails} disabled={flagChallanMutation.isPending}>
                {flagChallanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Flag & Suggestions
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
}

    