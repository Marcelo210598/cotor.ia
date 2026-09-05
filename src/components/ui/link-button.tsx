import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "secondary" | "ghost" | "link";
type Size = "sm" | "default" | "lg" | "xl";

/** <Link> com a aparência de Button. Base UI não tem `asChild`. */
export function LinkButton({
  variant = "default",
  size = "default",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return (
    <Link
      className={cn(
        buttonVariants({ variant, size: size === "xl" ? "lg" : size }),
        size === "xl" && "h-11 rounded-lg px-5 text-sm",
        size === "lg" && "h-10 rounded-lg px-4",
        className,
      )}
      {...props}
    />
  );
}
