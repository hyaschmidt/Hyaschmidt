import {
  Progress as ProgressRoot,
  ProgressIndicator,
} from "@radix-ui/react-progress";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Progress({
  className,
  value = 0,
  ...props
}: ComponentProps<typeof ProgressRoot>) {
  return (
    <ProgressRoot
      value={value}
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-secondary",
        className,
      )}
      {...props}
    >
      <ProgressIndicator
        className="h-full bg-primary transition-[width] duration-(--motion-fast) ease-(--ease-smooth-out)"
        style={{ width: `${value ?? 0}%` }}
      />
    </ProgressRoot>
  );
}
