import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function LoadingSkeleton({
  className,
  variant = "rectangular",
  width,
  height,
}: LoadingSkeletonProps) {
  const variantClasses = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div
      className={cn(
        "animate-pulse-soft bg-muted",
        variantClasses[variant],
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("space-y-3 rounded-lg border p-4", className)}>
      <LoadingSkeleton variant="rectangular" height={120} className="w-full" />
      <LoadingSkeleton variant="text" className="w-3/4" />
      <LoadingSkeleton variant="text" className="w-1/2" />
    </div>
  );
}

interface SkeletonListProps {
  count?: number;
  className?: string;
}

export function SkeletonList({ count = 3, className }: SkeletonListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <LoadingSkeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton variant="text" className="w-3/4" />
            <LoadingSkeleton variant="text" className="w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
