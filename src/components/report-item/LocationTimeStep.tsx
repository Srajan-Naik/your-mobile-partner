import { format } from "date-fns";
import { CalendarIcon, MapPin } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ReportItemFormData } from "@/lib/validations/report-item";

interface LocationTimeStepProps {
  form: UseFormReturn<ReportItemFormData>;
}

export function LocationTimeStep({ form }: LocationTimeStepProps) {
  const { t } = useLanguage();
  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Lost Date */}
        <FormField
          control={form.control}
          name="lost_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>When did you lose it? *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>{t("pickDate")}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("2020-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Quick Date Selection */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => form.setValue("lost_date", new Date())}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              form.setValue("lost_date", yesterday);
            }}
          >
            Yesterday
          </Button>
        </div>

        {/* Location */}
        <FormField
          control={form.control}
          name="lost_location_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Where did you lose it?</FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Enter address or landmark"
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                Enter the approximate location where you think you lost the item
              </p>
            </FormItem>
          )}
        />

        {/* Map placeholder - can be enhanced with Google Maps later */}
        <div className="aspect-video rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Map integration coming soon</p>
            <p className="text-xs">Enter address above for now</p>
          </div>
        </div>
      </div>
    </Form>
  );
}
