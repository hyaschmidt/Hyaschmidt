import type { InputHTMLAttributes, Ref } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-paper px-3 text-base text-foreground shadow-(--shadow-border) outline-none placeholder:text-subtle",
        "transition-[box-shadow] duration-(--motion-quick) ease-(--ease-out)",
        "focus-visible:shadow-(--shadow-border-hover) focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
