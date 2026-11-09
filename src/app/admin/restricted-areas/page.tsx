
"use client";
import { useState, useEffect, useMemo } from 'react';
import PageTitle from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Edit, Trash2, ToggleLeft, ToggleRight, MapPin, Search, Loader2 } from "lucide-react";
import type { RestrictedArea, RestrictedAreaStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import RestrictedAreasModal, { type RestrictedAreaFormData } from "@/components/admin/RestrictedAreasModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function RestrictedAreasPage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentAreaToEdit, setCurrentAreaToEdit] = useState<RestrictedArea | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Fetching data with react-query
  const { data: allAreas = [], isLoading, isError } = useQuery<RestrictedArea[]>({
    queryKey: ['restrictedAreas'],
    queryFn: async () => {
      const response = await fetch('/api/restricted-areas');
      if (!response.ok) {
        throw new Error('Failed to fetch restricted areas');
      }
      return response.json();
    }
  });

  const areaMutation = useMutation({
    mutationFn: async ({ data, id }: { data: RestrictedAreaFormData, id: string | null }) => {
      const url = id ? `/api/restricted-areas/${id}` : '/api/restricted-areas';
      const method = id ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An unknown error occurred');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['restrictedAreas'] });
      setIsEditModalOpen(false);
      toast({
        title: variables.id ? "Area Updated" : "Area Added",
        description: `Details for ${data.name} have been saved.`,
      });
    },
    onError: (error: Error, variables) => {
      toast({
        variant: "destructive",
        title: variables.id ? "Update Failed" : "Creation Failed",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/restricted-areas/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete area' }));
        throw new Error(errorData.message);
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restrictedAreas'] });
      toast({
        variant: "destructive",
        title: "Restricted Area Deleted",
        description: `The zone has been removed.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error.message,
      });
    },
  });

  const filteredAreas = useMemo(() => {
    let tempAreas = [...allAreas];
    if (searchTerm.trim() !== '') {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempAreas = tempAreas.filter(area =>
        area.name.toLowerCase().includes(lowerSearchTerm) ||
        area.locationDescription.toLowerCase().includes(lowerSearchTerm) ||
        area.restrictionType.toLowerCase().includes(lowerSearchTerm) ||
        (area.notes && area.notes.toLowerCase().includes(lowerSearchTerm))
      );
    }
    if (statusFilter !== 'All') {
      tempAreas = tempAreas.filter(area => area.status === statusFilter);
    }
    return tempAreas;
  }, [searchTerm, statusFilter, allAreas]);

  const handleOpenAddModal = () => {
    setCurrentAreaToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleEditZone = (area: RestrictedArea) => {
    setCurrentAreaToEdit(area);
    setIsEditModalOpen(true);
  };
  
  const handleSaveArea = (data: RestrictedAreaFormData, id: string | null) => {
    areaMutation.mutate({ data, id });
  };

  const handleDeleteZone = (zoneId: string) => {
    deleteMutation.mutate(zoneId);
  };

  const handleToggleStatus = (area: RestrictedArea) => {
    const newStatus = area.status === 'Active' ? 'Inactive' : 'Active';
    areaMutation.mutate({ data: { status: newStatus }, id: area.id });
  };

  return (
    <>
      <PageTitle 
        title="Manage Restricted Areas" 
        description="Define, view, and update restricted parking zones and no-go areas."
      >
        <Button onClick={handleOpenAddModal} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Zone
        </Button>
      </PageTitle>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div>
              <CardTitle className="font-headline flex items-center gap-2"><MapPin className="text-primary"/>Restricted Area List</CardTitle>
              <CardDescription>Currently defined restricted areas in the system.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
               <div className="relative flex-1 sm:flex-grow-0">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input
                  type="search"
                  placeholder="Search name, location, type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'All' | 'Active' | 'Inactive')}>
                <SelectTrigger className="w-full sm:w-auto h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="mx-auto h-12 w-12 animate-spin mb-4" />
              <h3 className="text-xl font-semibold">Loading Restricted Areas...</h3>
              <p>Please wait while areas are being loaded from the database.</p>
            </div>
          ) : isError ? (
             <div className="text-center py-12 text-destructive">
                <MapPin className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold">Error Fetching Data</h3>
                <p>Could not load restricted areas from the server.</p>
            </div>
          ) : allAreas.length > 0 ? (
            filteredAreas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location Description</TableHead>
                  <TableHead>Restriction Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAreas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell>{area.locationDescription}</TableCell>
                    <TableCell>{area.restrictionType}</TableCell>
                    <TableCell>
                      <Badge variant={area.status === 'Active' ? 'default' : 'secondary'}
                            className={area.status === 'Active' ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600 text-black dark:text-black'}
                      >
                        {area.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{area.notes || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={deleteMutation.isPending || areaMutation.isPending}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditZone(area)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(area)} className={area.status === 'Active' ? 'text-orange-600 focus:text-orange-600' : 'text-green-600 focus:text-green-600'}>
                            {area.status === 'Active' ? <ToggleLeft className="mr-2 h-4 w-4" /> : <ToggleRight className="mr-2 h-4 w-4" />}
                            {area.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteZone(area.id)} className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold">No Areas Match Filters</h3>
                <p>Try adjusting your search or filter criteria.</p>
              </div>
            )
          ) : (
             <div className="text-center py-12 text-muted-foreground">
              <MapPin className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-xl font-semibold">No Restricted Areas Defined</h3>
              <p>Click "Add New Zone" to define the first restricted area.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <RestrictedAreasModal
        isOpen={isEditModalOpen}
        onClose={() => {
            setIsEditModalOpen(false);
            setCurrentAreaToEdit(null);
        }}
        area={currentAreaToEdit}
        onSave={handleSaveArea}
        isSaving={areaMutation.isPending}
      />
    </>
  );
}
