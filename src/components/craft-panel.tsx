import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { humanizeLlmError } from "@/lib/llm/engine";
import { CRAFT_ACTIONS, type CraftKind } from "@/lib/llm/prompts";
import { useLlmStore } from "@/lib/llm/store";
import { cn } from "@/lib/utils";

type CraftPanelProps = {
  body: string;
  selection: string;
  voice: string;
  notes: string;
  onInsert: (text: string, mode: "insert" | "replace") => void;
  onOpenModel: () => void;
};

export function CraftPanel({
  body,
  selection,
  voice,
  notes,
  onInsert,
  onOpenModel,
}: CraftPanelProps) {
  const phase = useLlmStore((s) => s.phase);
  const loadedId = useLlmStore((s) => s.loadedId);
  const draft = useLlmStore((s) => s.draft);
  const generate = useLlmStore((s) => s.generate);
  const stop = useLlmStore((s) => s.stop);
  const clearDraft = useLlmStore((s) => s.clearDraft);
  const [question, setQuestion] = useState("");
  const ready = phase === "ready" && Boolean(loadedId);
  const generating = phase === "generating";

  async function run(kind: CraftKind) {
    if (!ready) {
      onOpenModel();
      return;
    }
    if (!body.trim() && kind !== "ask") {
      toast("Write a few lines first.");
      return;
    }
    try {
      await generate({
        kind,
        body,
        selection,
        voice,
        notes,
        question,
      });
    } catch (err) {
      toast(humanizeLlmError(err));
    }
  }

  return (
    <aside className="flex h-full flex-col">
      <div className="mb-4">
        <p className="text-xs font-medium tracking-(--tracking-wide) text-muted-foreground uppercase">
          Craft
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {selection
            ? "Working from your selection."
            : "Uses the last paragraph if nothing is selected."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {CRAFT_ACTIONS.map((action) => (
          <Button
            key={action.kind}
            variant={action.kind === "continue" ? "default" : "secondary"}
            className={cn(
              "h-auto min-h-11 flex-col items-start gap-0.5 px-3 py-2.5 text-left",
              action.kind === "continue" && "col-span-2",
            )}
            disabled={generating}
            onClick={() => void run(action.kind)}
          >
            <span>{action.label}</span>
            <span
              className={cn(
                "text-xs font-normal",
                action.kind === "continue"
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground",
              )}
            >
              {action.hint}
            </span>
          </Button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="craft-ask">Ask</Label>
        <Textarea
          id="craft-ask"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Give this a colder close, or name the boat."
          className="min-h-20 resize-none text-sm"
        />
        <Button
          variant="outline"
          className="w-full"
          disabled={generating || !question.trim()}
          onClick={() => void run("ask")}
        >
          Ask the model
        </Button>
      </div>

      <div className="mt-5 min-h-0 flex-1">
        {generating || draft ? (
          <div className="flex h-full min-h-40 flex-col rounded-lg bg-paper p-3 shadow-(--shadow-border)">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-medium tracking-(--tracking-wide) text-muted-foreground uppercase">
                Draft
              </p>
              {generating ? (
                <button
                  type="button"
                  onClick={stop}
                  className="inline-flex min-h-11 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Loader2 className="size-3 animate-spin" />
                  Stop
                </button>
              ) : null}
            </div>
            <p
              className={cn(
                "flex-1 overflow-y-auto text-sm leading-(--leading-prose) whitespace-pre-wrap",
                generating && "streaming-caret",
              )}
            >
              {draft || "Listening to the page…"}
            </p>
            {draft && !generating ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onInsert(draft, selection ? "replace" : "insert");
                    clearDraft();
                  }}
                >
                  {selection ? "Replace selection" : "Insert"}
                </Button>
                <Button size="sm" variant="ghost" onClick={clearDraft}>
                  Discard
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-subtle">
            {ready
              ? "A draft will appear here."
              : "Install Pocket or Desk to write with the model. The rest of the desk still works."}
          </p>
        )}
      </div>
    </aside>
  );
}
