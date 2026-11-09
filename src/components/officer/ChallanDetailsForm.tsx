"use client";

import { useForm } from "react-hook-form";
import type * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Loader2, Send, XCircle, MapPin, Clock } from "lucide-react";

// Define the schema type based on the expected form structure
type ChallanFormSchema = z.infer<any>;

const violationTypes = [
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
  "General Obstruction Due to Parking",
];

interface ChallanDetailsFormProps {
  form: ReturnType<typeof useForm<ChallanFormSchema>>;
  onSubmit: (values: ChallanFormSchema) => void;
  isSubmitting: boolean;
  isVerifyingPlate: boolean;
  isCurrentPlateValidAndFound: boolean;
  handleCancelViolation: () => void;
}

export default function ChallanDetailsForm({
  form,
  onSubmit,
  isSubmitting,
  isVerifyingPlate,
  isCurrentPlateValidAndFound,
  handleCancelViolation,
}: ChallanDetailsFormProps) {
  const capturedTimestamp = form.watch("capturedTimestamp");
  const capturedGeoLocation = form.watch("capturedGeoLocation");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="plateNumber"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>License Plate Number (Editable)</FormLabel>
                {isVerifyingPlate && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <FormControl>
                <Input
                  placeholder="e.g., ABC-123"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  className="uppercase font-mono text-lg"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {capturedTimestamp && (
          <FormItem>
            <FormLabel className="flex items-center gap-1 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Captured At
            </FormLabel>
            <FormControl>
              <Input
                readOnly
                value={capturedTimestamp}
                className="text-sm bg-muted/50"
              />
            </FormControl>
          </FormItem>
        )}

        {capturedGeoLocation && (
          <FormItem>
            <FormLabel className="flex items-center gap-1 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Captured GPS Location
            </FormLabel>
            <FormControl>
              <Input
                readOnly
                value={capturedGeoLocation}
                className="text-sm bg-muted/50"
              />
            </FormControl>
            <FormDescription>
              This is the GPS location at the time of image capture.
            </FormDescription>
          </FormItem>
        )}

        <FormField
          control={form.control}
          name="vehicleType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="Car">Car</SelectItem>
                  <SelectItem value="Rickshaw">Rickshaw</SelectItem>
                  <SelectItem value="Truck">Truck</SelectItem>
                  <SelectItem value="Bus">Bus</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="violationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parking Violation Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select violation type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-60">
                  {violationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the most appropriate parking violation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="violationLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location of Parking Violation (Textual)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Jinnah Road near GPO Chowk"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Describe where the parking violation occurred.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fineAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fine Amount (PKR)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 500"
                  {...field}
                  value={field.value === 0 ? "" : field.value}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? undefined : +value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Additional Notes (Auto-filled if vehicle verified)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Vehicle details will appear here if verified. Or, add any relevant details, e.g., vehicle color, model if known..."
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="submit"
            className="w-full sm:flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={isSubmitting || isVerifyingPlate}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Issue Parking E-Challan
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelViolation}
            className="w-full sm:flex-1"
            disabled={isSubmitting || isVerifyingPlate}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Violation
          </Button>
        </div>
      </form>
    </Form>
  );
}
