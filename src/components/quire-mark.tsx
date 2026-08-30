import { cn } from "@/lib/utils";

export function QuireMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("text-foreground", className)}
      aria-hidden
    >
      <rect
        x="10.5"
        y="3.5"
        width="15"
        height="20"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.35"
      />
      <rect
        x="8"
        y="6"
        width="15"
        height="20"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.65"
      />
      <rect
        x="5.5"
        y="8.5"
        width="15"
        height="20"
        rx="1.4"
        fill="var(--bg-elevated)"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}
