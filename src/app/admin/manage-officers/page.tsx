
"use client"
import { useState, useEffect } from "react";
import PageTitle from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Edit, Trash2, UserCheck, UserX, Users, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserRole, UserStatus } from "@prisma/client";

// This type now reflects the data coming from our API, which excludes the password.
export type Officer = {
  id: string;
  name: string;
  badgeNumber: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  lastLogin: Date | string | null;
};

// This schema is for form validation. The password can be an empty string for edits.
const officerSchema = z.object({
  name: z.string().min(1, "Name is required."),
  badgeNumber: z.string().min(1, "Badge number is required."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters.").or(z.literal('')),
  status: z.enum(['Active', 'Inactive', 'Suspended']),
  // Role is managed internally for now, defaulting to OFFICER
  role: z.enum(['ADMIN', 'OFFICER']).default('OFFICER'),
});

type OfficerFormData = z.infer<typeof officerSchema>;


function OfficerFormModal({
  isOpen,
  onClose,
  officer,
  onSave,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  officer: Officer | null;
  onSave: (data: OfficerFormData, id: string | null) => void;
  isSaving: boolean;
}) {
  const form = useForm<OfficerFormData>({
    resolver: zodResolver(officerSchema),
    defaultValues: officer 
      ? { ...officer, password: '' } 
      : { name: '', badgeNumber: '', email: '', password: '', status: 'Inactive', role: 'OFFICER' },
  });

  const [showPassword, setShowPassword] = useState(false);
  const isEditMode = !!officer;

  useEffect(() => {
    if (isOpen) {
      form.reset(
        officer
          ? { ...officer, password: '' }
          : { name: '', badgeNumber: '', email: '', password: '', status: 'Inactive', role: 'OFFICER' }
      );
      setShowPassword(false);
    }
  }, [officer, isOpen, form]);

  const onSubmit = (values: OfficerFormData) => {
    onSave(values, officer?.id || null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Officer' : 'Add New Officer'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Make changes to the officer's details below." : "Fill in the details for the new officer."} Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="badgeNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Badge Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., B1234" {...field} disabled={isEditMode} />
                    </FormControl>
                    {isEditMode && <FormDescription>Badge numbers cannot be changed after creation.</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="officer@police.gov" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={isEditMode ? "New password (leave blank to keep old)" : "Enter password (min 6 chars)"}
                          {...field}
                          className="pr-10"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                      </Button>
                    </div>
                     {!isEditMode && <FormMessage />}
                     {isEditMode && form.getValues("password") && form.formState.errors.password && <FormMessage />}
                     {isEditMode && !form.getValues("password") && <FormDescription>Leave blank to keep current password.</FormDescription>}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
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
            {isEditMode ? 'Save Changes' : 'Add Officer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ManageOfficersPage() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentOfficer, setCurrentOfficer] = useState<Officer | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetching data with react-query
  const { data: officers = [], isLoading, isError } = useQuery<Officer[]>({
    queryKey: ['officers'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch officers');
      }
      return response.json();
    }
  });

  const handleApiError = (error: any, defaultMessage: string) => {
    let message = defaultMessage;
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      message = error.response.data.message || defaultMessage;
    } else if (error.request) {
      // The request was made but no response was received
      message = "No response from server. Please check your connection.";
    } else {
      // Something happened in setting up the request that triggered an Error
      message = error.message;
    }
    toast({ variant: "destructive", title: "An error occurred", description: message });
  };
  
  // Mutation for creating/updating an officer
  const officerMutation = useMutation({
    mutationFn: async ({ data, id }: { data: Partial<OfficerFormData>, id: string | null }) => {
      const url = id ? `/api/users/${id}` : '/api/users';
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
      queryClient.invalidateQueries({ queryKey: ['officers'] });
      setIsFormModalOpen(false);
      toast({
        title: variables.id ? "Officer Updated" : "Officer Added",
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

  // Mutation for deleting an officer
  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/users/${id}`, { method: 'DELETE' }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['officers'] });
      toast({
        variant: "destructive",
        title: "Officer Deleted",
        description: `Officer has been removed.`,
      });
    },
    onError: (error: Error) => handleApiError(error, "Failed to delete officer."),
  });

  // Mutation for changing officer status
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: UserStatus }) =>
      fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    onSuccess: (data: Officer) => {
      queryClient.invalidateQueries({ queryKey: ['officers'] });
      toast({
        title: "Status Updated",
        description: `${data.name}'s status changed to ${data.status}.`,
      });
    },
    onError: (error: Error) => handleApiError(error, "Failed to update status."),
  });


  const handleOpenAddModal = () => {
    setCurrentOfficer(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (officer: Officer) => {
    setCurrentOfficer(officer);
    setIsFormModalOpen(true);
  };

  const handleSaveOfficer = (data: OfficerFormData, id: string | null) => {
    const payload: Partial<OfficerFormData> = { ...data };
    if (id && !payload.password) {
      delete payload.password; // Don't send empty password on update
    }
    officerMutation.mutate({ data: payload, id });
  };

  const handleDeleteOfficer = (officerId: string) => {
    deleteMutation.mutate(officerId);
  };

  const handleOfficerSuspension = (officer: Officer) => {
    const newStatus = officer.status === 'Suspended' ? 'Inactive' : 'Suspended';
    statusMutation.mutate({ id: officer.id, status: newStatus });
  };

  return (
    <>
      <PageTitle title="Manage Officers" description="Add, edit, or remove traffic officer accounts. Suspend or unsuspend officer access.">
        <Button onClick={handleOpenAddModal} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Officer
        </Button>
      </PageTitle>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Officer List</CardTitle>
          <CardDescription>Currently registered traffic officers in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Badge No.</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="p-0">
                      <div className="h-12 w-full bg-muted animate-pulse rounded"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                 <TableRow>
                    <TableCell colSpan={6} className="text-center text-destructive py-12">
                      <Users className="mx-auto h-12 w-12 mb-4" />
                      <h3 className="text-xl font-semibold">Error Fetching Officers</h3>
                      <p>Could not load data from the server.</p>
                    </TableCell>
                  </TableRow>
              ) : officers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Users className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="text-xl font-semibold">No Officers Found</h3>
                    <p>Click "Add New Officer" to add the first officer.</p>
                  </TableCell>
                </TableRow>
              ) : (
                officers.map((officer) => (
                  <TableRow key={officer.id}>
                    <TableCell className="font-medium">{officer.name}</TableCell>
                    <TableCell>{officer.badgeNumber}</TableCell>
                    <TableCell>{officer.email}</TableCell>
                    <TableCell>
                      <Badge variant={
                        officer.status === 'Active' ? 'default' :
                        officer.status === 'Inactive' ? 'secondary' :
                        'destructive'
                      }
                      className={
                          officer.status === 'Active' ? 'bg-green-500 hover:bg-green-600' :
                          officer.status === 'Inactive' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' :
                          ''
                      }
                      >{officer.status}</Badge>
                    </TableCell>
                    <TableCell>{officer.lastLogin ? new Date(officer.lastLogin).toLocaleString() : 'Never'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenEditModal(officer)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOfficerSuspension(officer)} className={officer.status === 'Suspended' ? 'text-green-600 focus:text-green-600' : 'text-orange-600 focus:text-orange-600'}>
                            {officer.status === 'Suspended' ? <UserCheck className="mr-2 h-4 w-4" /> : <UserX className="mr-2 h-4 w-4" />}
                            {officer.status === 'Suspended' ? 'Unsuspend Officer' : 'Suspend Officer'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteOfficer(officer.id)} className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <OfficerFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        officer={currentOfficer}
        onSave={handleSaveOfficer}
        isSaving={officerMutation.isPending}
      />
    </>
  );
}
