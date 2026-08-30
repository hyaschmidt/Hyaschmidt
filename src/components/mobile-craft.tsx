import { Drawer } from "vaul";
import { useEffect, useState } from "react";
import { CraftPanel } from "@/components/craft-panel";
import { Button } from "@/components/ui/button";
import { humanizeLlmError } from "@/lib/llm/engine";
import { useLlmStore } from "@/lib/llm/store";
import type { CraftKind } from "@/lib/llm/prompts";
import { toast } from "sonner";

function isPhoneLayout() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 1023px)").matches
  );
}

export function MobileCraft({
  body,
  selection,
  voice,
  notes,
  onInsert,
  onOpenModel,
}: {
  body: string;
  selection: string;
  voice: string;
  notes: string;
  onInsert: (text: string, mode: "insert" | "replace") => void;
  onOpenModel: () => void;
}) {
  const [open, setOpen] = useState(false);
  const phase = useLlmStore((s) => s.phase);
  const loadedId = useLlmStore((s) => s.loadedId);
  const generate = useLlmStore((s) => s.generate);
  const generating = phase === "generating";

  useEffect(() => {
    if (generating && isPhoneLayout()) setOpen(true);
  }, [generating]);

  async function continueScene() {
    if (phase !== "ready" || !loadedId) {
      onOpenModel();
      return;
    }
    if (!body.trim()) {
      toast("Write a few lines first.");
      return;
    }
    setOpen(true);
    try {
      await generate({
        kind: "continue" satisfies CraftKind,
        body,
        selection,
        voice,
        notes,
      });
    } catch (err) {
      toast(humanizeLlmError(err));
    }
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-xl gap-2">
          <Button
            className="min-h-11 flex-1"
            onClick={() => void continueScene()}
            disabled={generating}
          >
            Continue
          </Button>
          <Button
            variant="secondary"
            className="min-h-11 flex-1"
            onClick={() => setOpen(true)}
          >
            Craft
          </Button>
        </div>
      </div>

      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-background/70 lg:hidden" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-xl bg-card px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-(--shadow-lift) lg:hidden">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
            <div className="min-h-0 flex-1 overflow-y-auto">
              <CraftPanel
                body={body}
                selection={selection}
                voice={voice}
                notes={notes}
                onInsert={(text, mode) => {
                  onInsert(text, mode);
                  setOpen(false);
                }}
                onOpenModel={() => {
                  setOpen(false);
                  onOpenModel();
                }}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
