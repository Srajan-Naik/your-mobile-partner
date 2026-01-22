import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ITEM_CATEGORIES } from "@/hooks/use-lost-items";
import { cn } from "@/lib/utils";
import type { ReportItemFormData } from "@/lib/validations/report-item";

interface ItemDetailsStepProps {
  form: UseFormReturn<ReportItemFormData>;
}

export function ItemDetailsStep({ form }: ItemDetailsStepProps) {
  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Item Category *</FormLabel>
            <FormControl>
              <div className="grid grid-cols-4 gap-2">
                {ITEM_CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => field.onChange(category.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                      field.value === category.value
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <span className="text-xs font-medium text-center">
                      {category.label}
                    </span>
                  </button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Title */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Item Title *</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Black iPhone 14 Pro"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe the item in detail - color, brand, any distinguishing features..."
                className="min-h-[120px] resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
            <p className="text-xs text-muted-foreground">
              {(field.value?.length || 0)}/1000 characters
            </p>
          </FormItem>
        )}
      />
    </div>
  );
}
