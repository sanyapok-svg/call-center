import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** Visual size preset for light UI surfaces */
  size?: "header" | "login";
  className?: string;
  priority?: boolean;
};

const SIZES = {
  header: { width: 112, height: 34, className: "h-7 w-auto" },
  login: { width: 200, height: 60, className: "h-auto w-[180px] sm:w-[200px]" },
} as const;

export function Logo({ size = "header", className, priority }: LogoProps) {
  const preset = SIZES[size];

  return (
    <Image
      src="/logo-ael.png"
      alt="A.E.L."
      width={preset.width}
      height={preset.height}
      className={cn(preset.className, "object-contain object-left", className)}
      priority={priority}
    />
  );
}
