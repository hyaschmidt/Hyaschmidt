import type { Ref, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ref,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: Ref<HTMLTextAreaElement>;
}) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-28 w-full rounded-md bg-paper px-3 py-2.5 text-base text-foreground shadow-(--shadow-border) outline-none placeholder:text-subtle",
        "transition-[box-shadow] duration-(--motion-quick) ease-(--ease-out)",
        "focus-visible:shadow-(--shadow-border-hover) focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
