import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1F2328] placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:opacity-70",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";
