import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Download, MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CraftPanel } from "@/components/craft-panel";
import { MobileCraft } from "@/components/mobile-craft";
import { ModelSheet, ModelStatusButton } from "@/components/model-sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLlmStore } from "@/lib/llm/store";
import { useStoryStore } from "@/lib/stories";
import { downloadTextFile, wordCount } from "@/lib/utils";

export function EditorPage({ storyId }: { storyId: string }) {
  const navigate = useNavigate();
  const story = useStoryStore((s) => s.stories.find((x) => x.id === storyId));
  const patch = useStoryStore((s) => s.patch);
  const remove = useStoryStore((s) => s.remove);
  const hydrated = useStoryStore((s) => s.hydrated);
  const refreshCache = useLlmStore((s) => s.refreshCache);

  const [title, setTitle] = useState(story?.title ?? "");
  const [body, setBody] = useState(story?.body ?? "");
  const [notes, setNotes] = useState(story?.notes ?? "");
  const [voice, setVoice] = useState(story?.voice ?? "");
  const [selection, setSelection] = useState("");
  const [modelOpen, setModelOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const synced = useRef(false);

  useEffect(() => {
    const unsub = useStoryStore.persist.onFinishHydration(() => {
      useStoryStore.getState().finishHydration();
    });
    if (useStoryStore.persist.hasHydrated()) {
      useStoryStore.getState().finishHydration();
    }
    void refreshCache();
    return unsub;
  }, [refreshCache]);

  useEffect(() => {
    if (!story || synced.current) return;
    setTitle(story.title);
    setBody(story.body);
    setNotes(story.notes);
    setVoice(story.voice);
    synced.current = true;
  }, [story]);

  useEffect(() => {
    if (!story) return;
    const t = window.setTimeout(() => {
      patch(story.id, { title, body, notes, voice });
    }, 280);
    return () => window.clearTimeout(t);
  }, [body, notes, patch, story, title, voice]);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 420)}px`;
  }, [body]);

  function captureSelection() {
    const el = textareaRef.current;
    if (!el) return;
    setSelection(body.slice(el.selectionStart, el.selectionEnd));
  }

  function insertDraft(text: string, mode: "insert" | "replace") {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    const chunk = text.trim();
    if (mode === "replace" && start !== end) {
      setBody(body.slice(0, start) + chunk + body.slice(end));
      setSelection("");
      return;
    }
    const padBefore =
      start > 0 && !body.slice(0, start).endsWith("\n\n") ? "\n\n" : "";
    const next = body.slice(0, start) + padBefore + chunk + body.slice(end);
    setBody(next);
    setSelection("");
    requestAnimationFrame(() => {
      const pos = start + padBefore.length + chunk.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  }

  function exportStory() {
    const name = (title.trim() || "untitled")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    downloadTextFile(`${name || "untitled"}.txt`, `${title.trim()}\n\n${body}`);
    toast("Saved as a text file.");
  }

  if (!story) {
    if (!hydrated) {
      return (
        <main className="flex min-h-dvh items-center justify-center text-muted-foreground">
          Opening the page…
        </main>
      );
    }
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center px-6">
        <p className="font-display text-2xl">That manuscript is gone.</p>
        <Button asChild className="mt-6">
          <Link to="/">Back to the desk</Link>
        </Button>
      </main>
    );
  }

  const words = wordCount(body);
  const craftProps = {
    body,
    selection,
    voice,
    notes,
    onInsert: insertDraft,
    onOpenModel: () => setModelOpen(true),
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-2 sm:px-4">
          <Button variant="ghost" size="icon-sm" asChild aria-label="Back">
            <Link to="/">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-display min-w-0 flex-1 bg-transparent px-2 text-lg font-medium tracking-(--tracking-tight) outline-none"
            aria-label="Title"
          />
          <p className="hidden text-xs tabular-nums text-muted-foreground sm:block">
            {words} words
          </p>
          <ModelStatusButton onClick={() => setModelOpen(true)} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="More">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setShowNotes((v) => !v)}>
                {showNotes ? "Hide notes" : "Story notes"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={exportStory}>
                <Download className="size-4" />
                Export text
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="px-4 pt-6 pb-28 sm:px-8 lg:pb-16">
          {showNotes ? (
            <div className="mb-6 grid gap-3 rounded-xl bg-card p-4 shadow-(--shadow-border) sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="voice">Voice</Label>
                <Input
                  id="voice"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  placeholder="Close third. Spare, salt-worn."
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What the scene wants. Who is waiting off-page."
                  className="min-h-24"
                />
              </div>
            </div>
          ) : null}

          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onSelect={captureSelection}
            onKeyUp={captureSelection}
            onMouseUp={captureSelection}
            placeholder="Begin on the page."
            spellCheck
            className="block w-full resize-none bg-transparent text-lg leading-(--leading-prose) text-foreground outline-none placeholder:text-subtle"
          />
          <p className="mt-6 text-xs tabular-nums text-subtle lg:hidden">
            {words} words
          </p>
        </div>

        <div className="hidden border-l border-border lg:block">
          <div className="sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto p-5">
            <CraftPanel {...craftProps} />
          </div>
        </div>
      </div>

      <MobileCraft {...craftProps} />

      <ModelSheet open={modelOpen} onOpenChange={setModelOpen} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete this manuscript?</AlertDialogTitle>
          <AlertDialogDescription>
            It lives only on this device. Once it is gone, it cannot be
            restored.
          </AlertDialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                remove(story.id);
                void navigate({ to: "/" });
              }}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
