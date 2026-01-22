import { UseFormReturn } from "react-hook-form";
import { Car, Route, User } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ReportItemFormData } from "@/lib/validations/report-item";

interface AutoDetailsStepProps {
  form: UseFormReturn<ReportItemFormData>;
}

export function AutoDetailsStep({ form }: AutoDetailsStepProps) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-muted/50 border">
        <p className="text-sm text-muted-foreground">
          Any details about the auto-rickshaw can help drivers identify if they
          have your item. Even partial information is helpful!
        </p>
      </div>

      {/* Auto Number */}
      <FormField
        control={form.control}
        name="auto_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Auto Registration Number</FormLabel>
            <FormControl>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="e.g., KA 01 AB 1234"
                  className="pl-10 uppercase"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </div>
            </FormControl>
            <FormMessage />
            <p className="text-xs text-muted-foreground">
              Full or partial number plate if you remember
            </p>
          </FormItem>
        )}
      />

      {/* Route Description */}
      <FormField
        control={form.control}
        name="route_description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Route Taken</FormLabel>
            <FormControl>
              <div className="relative">
                <Route className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  placeholder="e.g., From Koramangala to Indiranagar via 100 Feet Road..."
                  className="pl-10 min-h-[80px] resize-none"
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Driver Description */}
      <FormField
        control={form.control}
        name="driver_description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Driver Description</FormLabel>
            <FormControl>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  placeholder="Any details about the driver you remember - approximate age, attire, etc."
                  className="pl-10 min-h-[80px] resize-none"
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
