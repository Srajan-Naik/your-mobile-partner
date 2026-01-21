import * as React from "react";
import { cn } from "@/lib/utils";

interface TextAreaWithCounterProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength?: number;
  showCount?: boolean;
}

const TextAreaWithCounter = React.forwardRef<
  HTMLTextAreaElement,
  TextAreaWithCounterProps
>(({ className, maxLength, showCount = true, value, onChange, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState(
    (value as string) || ""
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInternalValue(e.target.value);
    onChange?.(e);
  };

  const currentLength = String(value ?? internalValue).length;

  return (
    <div className="relative">
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          showCount && maxLength && "pb-6",
          className
        )}
        ref={ref}
        value={value ?? internalValue}
        onChange={handleChange}
        maxLength={maxLength}
        {...props}
      />
      {showCount && maxLength && (
        <span
          className={cn(
            "absolute bottom-2 right-3 text-xs text-muted-foreground",
            currentLength >= maxLength && "text-destructive"
          )}
        >
          {currentLength}/{maxLength}
        </span>
      )}
    </div>
  );
});

TextAreaWithCounter.displayName = "TextAreaWithCounter";

export { TextAreaWithCounter };
