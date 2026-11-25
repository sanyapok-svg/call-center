import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        draft: "bg-[#F3F4F6] text-[#6B7280]",
        submitted: "bg-[#ECFDF5] text-[#16A34A]",
        failed: "bg-[#FEF2F2] text-[#B91C1C]",
        active: "bg-[#ECFDF5] text-[#16A34A]",
        inactive: "bg-[#F3F4F6] text-[#6B7280]",
      },
    },
    defaultVariants: {
      variant: "draft",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
