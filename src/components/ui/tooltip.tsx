import {
  Tooltip as TooltipRoot,
  TooltipContent as TooltipContentPrimitive,
  TooltipProvider as TooltipProviderPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
} from "@radix-ui/react-tooltip";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function TooltipProvider({
  delayDuration = 400,
  ...props
}: ComponentProps<typeof TooltipProviderPrimitive>) {
  return (
    <TooltipProviderPrimitive delayDuration={delayDuration} {...props} />
  );
}

export function Tooltip(props: ComponentProps<typeof TooltipRoot>) {
  return <TooltipRoot {...props} />;
}

export function TooltipTrigger(
  props: ComponentProps<typeof TooltipTriggerPrimitive>,
) {
  return <TooltipTriggerPrimitive {...props} />;
}

export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof TooltipContentPrimitive>) {
  return (
    <TooltipContentPrimitive
      sideOffset={sideOffset}
      className={cn(
        "z-50 rounded-sm bg-foreground px-2 py-1 text-xs text-background shadow-(--shadow-lift)",
        "origin-(--radix-tooltip-content-transform-origin)",
        className,
      )}
      {...props}
    />
  );
}
