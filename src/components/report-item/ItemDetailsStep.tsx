import { useCallback, useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { Camera, X, Upload, Image as ImageIcon } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ITEM_CATEGORIES } from "@/hooks/use-lost-items";
import { cn } from "@/lib/utils";
import type { ReportItemFormData } from "@/lib/validations/report-item";

interface ItemDetailsStepProps {
  form: UseFormReturn<ReportItemFormData>;
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  maxFiles?: number;
}

export function ItemDetailsStep({ 
  form, 
  files = [], 
  onFilesChange,
  maxFiles = 5 
}: ItemDetailsStepProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  // Generate and cleanup preview URLs
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
      onFilesChange?.(newFiles);
    },
    [files, onFilesChange, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles,
    noClick: false,
    noKeyboard: false,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange?.(newFiles);
  };

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
                className="min-h-[100px] resize-none"
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

      {/* Photo Upload Section */}
      {onFilesChange && (
        <div className="space-y-3">
          <FormLabel>Photos (Optional)</FormLabel>
          <p className="text-xs text-muted-foreground -mt-1">
            Add photos to help drivers identify your item
          </p>

          {/* Upload Area */}
          {files.length < maxFiles && (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-sm font-medium">Drop the files here...</p>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    Drag & drop images here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WEBP up to 10MB each
                  </p>
                </>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
              disabled={files.length >= maxFiles}
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
              disabled={files.length >= maxFiles}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Gallery
            </Button>
          </div>

          {/* Preview Grid */}
          {files.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                  {previews[index] ? (
                    <img
                      src={previews[index]}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            {files.length}/{maxFiles} photos
          </p>
        </div>
      )}
    </div>
  );
}
