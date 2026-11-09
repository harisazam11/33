
"use client"; 
import { useState, useMemo } from 'react';
import PageTitle from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Loader2 } from "lucide-react";
import type { RestrictedArea } from "@/types";
import { useQuery } from '@tanstack/react-query';


export default function OfficerRestrictedAreasPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: allAreas = [], isLoading, isError } = useQuery<RestrictedArea[]>({
    queryKey: ['officerRestrictedAreas'],
    queryFn: async () => {
      const response = await fetch('/api/officer/restricted-areas');
      if (!response.ok) {
        throw new Error('Failed to fetch restricted areas from server.');
      }
      return response.json();
    }
  });

  const filteredAreas = useMemo(() => {
    if (!allAreas) return [];

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
    
    return tempAreas;

  }, [searchTerm, allAreas]);

  return (
    <>
      <PageTitle 
        title="Active Restricted Areas" 
        description="View current restricted parking zones and no-go areas relevant for enforcement."
      />
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div>
              <CardTitle className="font-headline flex items-center gap-2"><MapPin className="text-primary"/>Active Restricted Zones List</CardTitle>
              <CardDescription>These are the currently active restricted areas defined by administrators.</CardDescription>
            </div>
            <div className="relative flex-1 sm:flex-grow-0 w-full md:w-auto mt-4 md:mt-0">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input
                  type="search"
                  placeholder="Search name, location, type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[300px]"
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="mx-auto h-12 w-12 animate-spin mb-4" />
              <h3 className="text-xl font-semibold">Loading Restricted Areas...</h3>
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
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAreas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell>{area.locationDescription}</TableCell>
                    <TableCell>{area.restrictionType}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{area.notes || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold">No Active Areas Match Search</h3>
                <p>Try adjusting your search criteria.</p>
              </div>
            )
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-xl font-semibold">No Active Restricted Areas</h3>
              <p>There are currently no active restricted areas defined by administrators.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
