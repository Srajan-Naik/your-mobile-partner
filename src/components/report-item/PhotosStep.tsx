import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, X, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PhotosStepProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

export function PhotosStep({ files, onFilesChange, maxFiles = 5 }: PhotosStepProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
      onFilesChange(newFiles);
    },
    [files, onFilesChange, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-muted/50 border">
        <p className="text-sm text-muted-foreground">
          Add photos of the lost item to help drivers identify it. You can upload
          up to {maxFiles} images.
        </p>
      </div>

      {/* Upload Area */}
      {files.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
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
          onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
          disabled={files.length >= maxFiles}
        >
          <Camera className="h-4 w-4 mr-2" />
          Take Photo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
          disabled={files.length >= maxFiles}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Choose from Gallery
        </Button>
      </div>

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {files.map((file, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
              <img
                src={URL.createObjectURL(file)}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No photos added yet</p>
          <p className="text-xs">Photos help drivers identify your item</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {files.length}/{maxFiles} photos uploaded
      </p>
    </div>
  );
}
