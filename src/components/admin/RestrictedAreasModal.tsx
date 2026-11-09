
"use client";

import { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RestrictedArea } from "@/types";
import { Loader2 } from 'lucide-react';

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

const restrictedAreaSchema = z.object({
  name: z.string().min(1, "Zone name is required."),
  locationDescription: z.string().min(1, "Location description is required."),
  restrictionType: z.string().min(1, "Restriction type is required."),
  status: z.enum(['Active', 'Inactive']),
  notes: z.string().optional().nullable(),
});

export type RestrictedAreaFormData = z.infer<typeof restrictedAreaSchema>;

type RestrictedAreasModalProps = {
  isOpen: boolean;
  onClose: () => void;
  area: RestrictedArea | null;
  onSave: (data: RestrictedAreaFormData, id: string | null) => void;
  isSaving: boolean;
};

export default function RestrictedAreasModal({
  isOpen,
  onClose,
  area,
  onSave,
  isSaving,
}: RestrictedAreasModalProps) {
  const form = useForm<RestrictedAreaFormData>({
    resolver: zodResolver(restrictedAreaSchema),
    defaultValues: area ? {
        name: area.name,
        locationDescription: area.locationDescription,
        restrictionType: area.restrictionType,
        status: area.status,
        notes: area.notes,
    } : {
        name: '',
        locationDescription: '',
        restrictionType: 'Illegal Parking',
        status: 'Active',
        notes: '',
    },
  });

  const isEditMode = !!area;

  useEffect(() => {
    if (isOpen) {
        const defaultValues = area ? {
            name: area.name,
            locationDescription: area.locationDescription,
            restrictionType: area.restrictionType,
            status: area.status,
            notes: area.notes,
        } : {
            name: '',
            locationDescription: '',
            restrictionType: 'Illegal Parking',
            status: 'Active',
            notes: '',
        };
        form.reset(defaultValues);
    }
  }, [area, isOpen, form]);

  const onSubmit = (values: RestrictedAreaFormData) => {
    onSave(values, area?.id || null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Restricted Area' : 'Add New Restricted Area'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Make changes to the restricted area details.' : 'Define the new restricted area.'} Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[70vh] pr-2 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Hospital Road No-Parking" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="locationDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Description (Textual Summary)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} placeholder="e.g., Main Street between 1st and 2nd Ave"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="restrictionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restriction Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select restriction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {parkingViolationTypesForSelect.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ''} rows={2} placeholder="e.g., Effective 8AM-8PM daily"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Add Area'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
