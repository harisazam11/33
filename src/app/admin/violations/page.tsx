
"use client";
import { useState, useEffect, useMemo } from 'react';
import PageTitle from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ListChecks, Edit3, CircleDollarSign, AlertCircle, Flag, Edit, MessageSquare, Info, Search, ListFilter, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { ViolationRecord } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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


export default function ViolationsPage() {
  const [editingChallan, setEditingChallan] = useState<ViolationRecord | null>(null);
  
  // State for edit/review dialog inputs
  const [newFineAmount, setNewFineAmount] = useState<number | string>("");
  const [newReviewNotes, setNewReviewNotes] = useState<string>(""); 
  const [currentViolationType, setCurrentViolationType] = useState<string>("");
  const [currentVehicleType, setCurrentVehicleType] = useState<string>("");
  const [currentViolationLocation, setCurrentViolationLocation] = useState<string>("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    Paid: true,
    Unpaid: true,
    Contested: true,
  });
  const [officerIdFilter, setOfficerIdFilter] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  const activeStatusFilters = useMemo(() =>
    Object.keys(statusFilters).filter(status => statusFilters[status]),
    [statusFilters]
  );
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const { data: filteredChallans = [], isLoading, isError, error } = useQuery<ViolationRecord[]>({
    queryKey: ['challans', debouncedSearchTerm, activeStatusFilters, officerIdFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('searchTerm', debouncedSearchTerm);
      if (activeStatusFilters.length > 0) params.append('status', activeStatusFilters.join(','));
      if (officerIdFilter) params.append('officerId', officerIdFilter);

      const response = await fetch(`/api/challans?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch violation records');
      }
      return response.json();
    },
    // Keep previous data while refetching for a smoother experience
    // placeholderData: (previousData) => previousData,
  });

  const updateChallanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ViolationRecord> }) => {
      const response = await fetch(`/api/challans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update challan');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      toast({
        title: "Update Successful",
        description: `Challan ${data.id} has been updated.`,
      });
      setIsEditModalOpen(false);
      setEditingChallan(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    },
  });

  const handleUpdateStatus = (challanId: string, newStatus: ViolationRecord['status']) => {
    const challanToUpdate = filteredChallans.find(challan => challan.id === challanId);
    if (!challanToUpdate) return;

    if (newStatus === 'Paid' && challanToUpdate.isFlaggedForReview) {
      toast({
        variant: "destructive",
        title: "Review Required",
        description: "This challan is flagged. Please review and resolve the flag using 'Edit Fine & Review' before marking as Paid.",
      });
      return; 
    }

    const payload: Partial<ViolationRecord> = { status: newStatus };
    if (newStatus === 'Paid') {
      payload.isFlaggedForReview = false;
    }

    updateChallanMutation.mutate({ id: challanId, data: payload });
  };

  const openEditModal = (challan: ViolationRecord) => {
    setEditingChallan(challan);
    setNewFineAmount(challan.officerSuggestedFineAmount !== undefined && challan.officerSuggestedFineAmount !== null ? challan.officerSuggestedFineAmount : challan.fineAmount);
    setCurrentViolationType(challan.officerSuggestedViolationType || challan.violationType);
    setCurrentVehicleType(challan.officerSuggestedVehicleType || challan.vehicleType);
    setCurrentViolationLocation(challan.officerSuggestedViolationLocation || challan.violationLocation);
    setNewReviewNotes(challan.reviewNotes || "");
    setIsEditModalOpen(true);
  };

  const handleSaveEdits = () => {
    if (!editingChallan) return;
    
    const finalFineAmount = typeof newFineAmount === 'string' ? parseFloat(newFineAmount) : newFineAmount;
    
    if (typeof finalFineAmount !== 'number' || finalFineAmount < 0) {
      toast({ variant: "destructive", title: "Invalid Input", description: "Please enter a valid fine amount." });
      return;
    }
    if (!currentViolationType || !currentVehicleType || !currentViolationLocation) {
      toast({ variant: "destructive", title: "Invalid Input", description: "Violation type, vehicle type, and location cannot be empty." });
      return;
    }

    const payload: Partial<ViolationRecord> = {
      originalFineAmount: editingChallan.fineAmountEditedByAdmin ? editingChallan.originalFineAmount : editingChallan.fineAmount,
      fineAmount: finalFineAmount,
      violationType: currentViolationType,
      vehicleType: currentVehicleType,
      violationLocation: currentViolationLocation,
      reviewNotes: newReviewNotes,
      fineAmountEditedByAdmin: true,
      isFlaggedForReview: false,
    };
    
    updateChallanMutation.mutate({ id: editingChallan.id, data: payload });
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilters(prev => ({ ...prev, [status]: !prev[status] }));
  };

  return (
    <TooltipProvider>
      <PageTitle 
        title="All Violation Records" 
        description="View and manage the status of all parking challans. Edit fines and details for flagged challans based on officer input." 
      />
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div>
              <CardTitle className="font-headline flex items-center gap-2">
                <ListChecks className="text-primary h-6 w-6" />
                Parking Challan List
              </CardTitle>
              <CardDescription>
                A comprehensive list of all recorded parking violations. Use filters to narrow down results. Flagged challans require review.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
              <div className="relative flex-1 sm:flex-grow-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search ID, plate, officer, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[300px]"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-1 w-full sm:w-auto">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4" align="end">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Filter by Status</p>
                      <div className="space-y-1">
                        {(Object.keys(statusFilters) as Array<keyof typeof statusFilters>).map(status => (
                          <div key={status} className="flex items-center space-x-2">
                            <Checkbox
                              id={`admin-filter-${status}`}
                              checked={statusFilters[status]}
                              onCheckedChange={() => handleStatusFilterChange(status)}
                            />
                            <Label htmlFor={`admin-filter-${status}`} className="text-sm font-normal capitalize">{status}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="officerIdFilterAdmin" className="text-sm font-medium">Filter by Officer ID</Label>
                      <Input
                        id="officerIdFilterAdmin"
                        placeholder="Enter Officer Badge ID"
                        value={officerIdFilter}
                        onChange={(e) => setOfficerIdFilter(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="mx-auto h-12 w-12 animate-spin mb-4" />
              <h3 className="text-xl font-semibold">Loading Violation Records...</h3>
              <p>Please wait while records are being fetched from the server.</p>
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-destructive">
                <AlertCircle className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold">Error Fetching Data</h3>
                <p>{error?.message || "An unknown error occurred."}</p>
            </div>
          ) : filteredChallans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Plate No.</TableHead>
                  <TableHead>Officer ID</TableHead>
                  <TableHead>Violation</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Fine (PKR)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flagged</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChallans.map((challan) => (
                  <TableRow key={challan.id} className={challan.isFlaggedForReview ? "bg-orange-50 dark:bg-orange-900/30" : ""}>
                    <TableCell className="font-medium text-xs">{challan.id}</TableCell>
                    <TableCell>{new Date(challan.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono">{challan.plateNumber}</TableCell>
                    <TableCell>{challan.issuedByOfficerBadgeId}</TableCell>
                    <TableCell>{challan.violationType} at {challan.violationLocation}</TableCell>
                    <TableCell className="text-xs">
                      {challan.capturedGeoLocation ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 cursor-default">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {challan.capturedGeoLocation.length > 20 ? `${challan.capturedGeoLocation.substring(0,17)}...` : challan.capturedGeoLocation}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{challan.capturedGeoLocation}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1">
                            {challan.fineAmount.toFixed(2)}
                            {challan.fineAmountEditedByAdmin && <Edit className="h-3 w-3 text-blue-500" />}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {challan.fineAmountEditedByAdmin && challan.originalFineAmount !== undefined && challan.originalFineAmount !== null && (
                            <p>Original Fine: {challan.originalFineAmount.toFixed(2)}</p>
                          )}
                          {challan.isFlaggedForReview && challan.officerSuggestedFineAmount !== undefined && challan.officerSuggestedFineAmount !== null && (
                            <p className="text-orange-600">Officer Suggested: {challan.officerSuggestedFineAmount.toFixed(2)}</p>
                          )}
                           {!challan.fineAmountEditedByAdmin && challan.originalFineAmount === undefined && (!challan.isFlaggedForReview || challan.officerSuggestedFineAmount === undefined) && (
                            <p>Current Fine</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        challan.status === 'Paid' ? 'default' :
                        challan.status === 'Unpaid' ? 'destructive' :
                        'secondary'
                      }
                      className={
                        challan.status === 'Paid' ? 'bg-green-500 hover:bg-green-600' :
                        challan.status === 'Unpaid' ? '' : 
                        'bg-yellow-500 hover:bg-yellow-600 text-black dark:text-black'
                      }
                      >
                        {challan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {challan.isFlaggedForReview && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Flag className="h-5 w-5 text-orange-500" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs space-y-1">
                            <p className="font-semibold">Flagged for Review</p>
                            {challan.officerReviewNotes && <p className="text-xs italic">Officer notes: {challan.officerReviewNotes}</p>}
                            {challan.officerSuggestedFineAmount !== undefined && challan.officerSuggestedFineAmount !== null && <p className="text-xs">Officer Suggested Fine: {challan.officerSuggestedFineAmount.toFixed(2)} PKR</p>}
                            {challan.officerSuggestedViolationType && <p className="text-xs">Officer Suggested Violation: {challan.officerSuggestedViolationType}</p>}
                            {challan.officerSuggestedVehicleType && <p className="text-xs">Officer Suggested Vehicle: {challan.officerSuggestedVehicleType}</p>}
                            {challan.officerSuggestedViolationLocation && <p className="text-xs">Officer Suggested Location: {challan.officerSuggestedViolationLocation}</p>}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell className="text-xs max-w-[150px] truncate">
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="cursor-default">
                                {challan.notes}
                                {challan.reviewNotes && (<><br/><span className="italic text-blue-600 dark:text-blue-400">Admin: {challan.reviewNotes}</span></>)}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs whitespace-pre-wrap">
                            {challan.notes && <p><strong>Original Notes:</strong> {challan.notes}</p>}
                            {challan.officerReviewNotes && <p className="mt-1"><strong>Officer Review Notes:</strong> {challan.officerReviewNotes}</p>}
                            {challan.reviewNotes && <p className="mt-1"><strong>Admin Review Notes:</strong> {challan.reviewNotes}</p>}
                            {!challan.notes && !challan.officerReviewNotes && !challan.reviewNotes && <p>No notes for this challan.</p>}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={updateChallanMutation.isPending}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(challan.id, 'Paid')} disabled={challan.status === 'Paid' || challan.isFlaggedForReview}>
                            <CircleDollarSign className="mr-2 h-4 w-4 text-green-500" /> Mark as Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(challan.id, 'Unpaid')} disabled={challan.status === 'Unpaid'}>
                            <AlertCircle className="mr-2 h-4 w-4 text-red-500" /> Mark as Unpaid
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(challan.id, 'Contested')} disabled={challan.status === 'Contested'}>
                            <Edit3 className="mr-2 h-4 w-4 text-yellow-500" /> Mark as Contested
                          </DropdownMenuItem>
                          {(challan.isFlaggedForReview && challan.status !== 'Paid') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Review Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditModal(challan)}>
                                <Edit className="mr-2 h-4 w-4 text-blue-500" /> Edit & Review Flag
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ListChecks className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold">No Records Match Filters</h3>
                <p>Try adjusting your search or filter criteria.</p>
              </div>
            )
          }
        </CardContent>
      </Card>

      {editingChallan && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5 text-primary" />Edit Challan {editingChallan.id}</DialogTitle>
              <DialogDescription>
                Plate: {editingChallan.plateNumber}. Review officer suggestions and make necessary changes.
              </DialogDescription>
            </DialogHeader>
            
            <div className="overflow-y-auto max-h-[60vh] pr-4 space-y-4 py-2">
              {editingChallan.isFlaggedForReview && (
                <Card className="border-orange-200 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/30">
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-base font-semibold text-orange-700 dark:text-orange-300 flex items-center gap-2">
                      <Info className="h-5 w-5" /> Officer Flag Details & Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1 pb-4 text-orange-800 dark:text-orange-200">
                    {editingChallan.officerReviewNotes && (
                      <p><span className="font-medium">Officer Notes:</span> <span className="italic">{editingChallan.officerReviewNotes}</span></p>
                    )}
                    {editingChallan.officerSuggestedFineAmount !== undefined && editingChallan.officerSuggestedFineAmount !== null && (
                      <p><span className="font-medium">Suggested Fine:</span> {editingChallan.officerSuggestedFineAmount.toFixed(2)} PKR</p>
                    )}
                    {editingChallan.officerSuggestedViolationType && (
                      <p><span className="font-medium">Suggested Violation Type:</span> {editingChallan.officerSuggestedViolationType}</p>
                    )}
                    {editingChallan.officerSuggestedVehicleType && (
                      <p><span className="font-medium">Suggested Vehicle Type:</span> {editingChallan.officerSuggestedVehicleType}</p>
                    )}
                    {editingChallan.officerSuggestedViolationLocation && (
                      <p><span className="font-medium">Suggested Location:</span> {editingChallan.officerSuggestedViolationLocation}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="violationType" className="text-right col-span-1">Violation Type</Label>
                  <Select value={currentViolationType} onValueChange={setCurrentViolationType}>
                      <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select violation type" />
                      </SelectTrigger>
                      <SelectContent>
                          {parkingViolationTypesForSelect.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vehicleType" className="text-right col-span-1">Vehicle Type</Label>
                  <Select value={currentVehicleType} onValueChange={setCurrentVehicleType}>
                      <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                          {vehicleTypesForSelect.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="violationLocation" className="text-right col-span-1">Location</Label>
                  <Input
                    id="violationLocation"
                    value={currentViolationLocation}
                    onChange={(e) => setCurrentViolationLocation(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fineAmount" className="text-right col-span-1">Fine (PKR)</Label>
                  <Input
                    id="fineAmount"
                    type="number"
                    value={newFineAmount}
                    onChange={(e) => setNewFineAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="col-span-3"
                    placeholder={editingChallan.fineAmount.toFixed(2)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reviewNotes" className="text-right col-span-1">Admin Review Notes</Label>
                  <Textarea
                    id="reviewNotes"
                    value={newReviewNotes}
                    onChange={(e) => setNewReviewNotes(e.target.value)}
                    className="col-span-3"
                    placeholder="Reason for changes, actions taken, etc."
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdits} disabled={updateChallanMutation.isPending}>
                {updateChallanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes & Unflag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
}
