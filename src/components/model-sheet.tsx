import { HardDrive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { MODEL_LIST } from "@/lib/llm/models";
import { useLlmStore, type LlmPhase } from "@/lib/llm/store";
import { cn } from "@/lib/utils";

export function ModelSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const phase = useLlmStore((s) => s.phase);
  const loadedId = useLlmStore((s) => s.loadedId);
  const cached = useLlmStore((s) => s.cached);
  const progress = useLlmStore((s) => s.progress);
  const statusLine = useLlmStore((s) => s.statusLine);
  const error = useLlmStore((s) => s.error);
  const load = useLlmStore((s) => s.load);
  const stop = useLlmStore((s) => s.stop);
  const forgetModels = useLlmStore((s) => s.forgetModels);
  const busy = phase === "downloading" || phase === "loading";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>On-device model</DialogTitle>
        <DialogDescription>
          Download once. After that, Quire writes without a network. The model
          never leaves this device.
        </DialogDescription>

        <ul className="mt-5 space-y-2">
          {MODEL_LIST.map((model) => (
            <ModelChoice
              key={model.id}
              name={model.name}
              sizeLabel={model.sizeLabel}
              blurb={model.blurb}
              active={loadedId === model.id}
              cached={cached[model.id]}
              disabled={busy}
              onSelect={() => void load(model.id)}
            />
          ))}
        </ul>

        {busy ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{statusLine}</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <Progress value={progress} />
            <Button variant="ghost" size="sm" className="w-full" onClick={stop}>
              Cancel
            </Button>
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        ) : null}

        <p className="mt-4 text-xs leading-relaxed text-subtle">
          First generation can take a few seconds on a phone. Abliterated
          instruct weights — they stay with the page. Best at short bursts,
          not a novel in one pass.
        </p>

        {cached.pocket || cached.desk ? (
          <Button
            variant="link"
            size="sm"
            className="mt-2 h-auto px-0"
            onClick={() => void forgetModels()}
          >
            Remove downloaded models
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ModelChoice({
  name,
  sizeLabel,
  blurb,
  active,
  cached,
  disabled,
  onSelect,
}: {
  name: string;
  sizeLabel: string;
  blurb: string;
  active: boolean;
  cached: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        className={cn(
          "flex min-h-11 w-full flex-col items-start rounded-lg bg-paper px-3.5 py-3 text-left shadow-(--shadow-border) transition-[box-shadow,transform] duration-(--motion-quick) ease-(--ease-out)",
          "hover:shadow-(--shadow-border-hover) disabled:opacity-50",
          active && "shadow-(--shadow-border-hover)",
        )}
      >
        <span className="flex w-full items-baseline justify-between gap-3">
          <span className="font-display text-lg font-medium">{name}</span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {sizeLabel}
            {active ? " · ready" : cached ? " · on device" : ""}
          </span>
        </span>
        <span className="mt-1 text-sm text-muted-foreground">{blurb}</span>
      </button>
    </li>
  );
}

function statusLabel(phase: LlmPhase, statusLine: string) {
  switch (phase) {
    case "generating":
      return "Writing";
    case "downloading":
      return statusLine.startsWith("Downloading")
        ? statusLine.replace("Downloading… ", "")
        : "Fetching";
    case "loading":
    case "checking":
      return "Loading";
    case "ready":
      return "Offline";
    case "error":
      return "Failed";
    default:
      return statusLine === "Install model" ? "Install" : statusLine;
  }
}

export function ModelStatusButton({ onClick }: { onClick: () => void }) {
  const phase = useLlmStore((s) => s.phase);
  const statusLine = useLlmStore((s) => s.statusLine);
  const busy =
    phase === "downloading" ||
    phase === "loading" ||
    phase === "checking" ||
    phase === "generating";
  const label = statusLabel(phase, statusLine);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-label={statusLine}
      className="max-w-36 gap-1.5 px-2 text-muted-foreground sm:max-w-52"
    >
      {busy ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <HardDrive className="size-3.5" />
      )}
      <span className="truncate">{label}</span>
    </Button>
  );
}
