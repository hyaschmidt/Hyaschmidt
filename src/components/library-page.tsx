import { formatDistanceToNow } from "date-fns";
import { Moon, Plus, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ModelSheet, ModelStatusButton } from "@/components/model-sheet";
import { QuireMark } from "@/components/quire-mark";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLlmStore } from "@/lib/llm/store";
import { MODELS } from "@/lib/llm/models";
import { newStory, useStoryStore } from "@/lib/stories";
import { applyTheme, readTheme, type Theme } from "@/lib/theme";
import { wordCount } from "@/lib/utils";

export function LibraryPage() {
  const navigate = useNavigate();
  const stories = useStoryStore((s) => s.stories);
  const hydrated = useStoryStore((s) => s.hydrated);
  const upsert = useStoryStore((s) => s.upsert);
  const refreshCache = useLlmStore((s) => s.refreshCache);
  const phase = useLlmStore((s) => s.phase);
  const loadedId = useLlmStore((s) => s.loadedId);
  const cached = useLlmStore((s) => s.cached);
  const progress = useLlmStore((s) => s.progress);
  const statusLine = useLlmStore((s) => s.statusLine);
  const error = useLlmStore((s) => s.error);
  const load = useLlmStore((s) => s.load);
  const stop = useLlmStore((s) => s.stop);
  const [modelOpen, setModelOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const unsub = useStoryStore.persist.onFinishHydration(() => {
      useStoryStore.getState().finishHydration();
    });
    if (useStoryStore.persist.hasHydrated()) {
      useStoryStore.getState().finishHydration();
    }
    setTheme(readTheme());
    applyTheme(readTheme());
    void refreshCache();
    return unsub;
  }, [refreshCache]);

  function startNew() {
    const story = newStory();
    upsert(story);
    void navigate({ to: "/write/$storyId", params: { storyId: story.id } });
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  const ready = phase === "ready" && Boolean(loadedId);
  const busy = phase === "downloading" || phase === "loading";
  const hasCache = cached.pocket || cached.desk;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 pt-10 pb-16 sm:pt-16">
      <header className="stagger-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <QuireMark className="size-8" />
            <p className="hidden text-xs font-medium tracking-(--tracking-wide) text-muted-foreground uppercase sm:block">
              Private desk
            </p>
          </div>
          <div className="flex items-center gap-1">
            <ModelStatusButton onClick={() => setModelOpen(true)} />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={
                theme === "dark" ? "Switch to paper" : "Switch to night"
              }
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
          </div>
        </div>
        <h1 className="font-display mt-8 text-5xl leading-(--leading-tight) font-medium tracking-(--tracking-display) sm:text-6xl">
          Quire
        </h1>
        <p className="mt-3 max-w-sm text-base text-muted-foreground italic">
          A writing room that thinks on this device. Stories never leave it.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button onClick={startNew}>
            <Plus className="size-4" />
            New manuscript
          </Button>
        </div>
      </header>

      {!ready ? (
        <section className="mt-8 rounded-xl bg-card p-4 shadow-(--shadow-border)">
          <p className="font-display text-lg font-medium">On-device model</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Pocket is {MODELS.pocket.sizeLabel}. Download it once on Wi-Fi —
            after that, Quire writes without a network.
          </p>
          {busy ? (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{statusLine}</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <Progress value={progress} />
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={stop}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => void load("pocket")}>
                {cached.pocket ? "Load Pocket" : "Install Pocket"}
              </Button>
              <Button variant="ghost" onClick={() => setModelOpen(true)}>
                {hasCache ? "Choose model" : "See Desk too"}
              </Button>
            </div>
          )}
          {error ? (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          ) : null}
        </section>
      ) : null}

      <section className="mt-12">
        <p className="text-xs font-medium tracking-(--tracking-wide) text-muted-foreground uppercase">
          Manuscripts
        </p>
        <div className="mt-4">
          {!hydrated && stories.length === 0 ? (
            <div className="space-y-6">
              <div className="h-16 rounded-md bg-secondary/60" />
              <div className="h-16 rounded-md bg-secondary/40" />
            </div>
          ) : stories.length === 0 ? (
            <p className="text-muted-foreground">
              The desk is empty. Begin a manuscript.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {stories.map((story) => {
                const preview =
                  story.body.trim().split("\n").find(Boolean) ??
                  "A blank page.";
                return (
                  <li key={story.id}>
                    <button
                      type="button"
                      onClick={() =>
                        void navigate({
                          to: "/write/$storyId",
                          params: { storyId: story.id },
                        })
                      }
                      className="group flex min-h-11 w-full flex-col items-start py-5 text-left transition-opacity duration-(--motion-quick) hover:opacity-80"
                    >
                      <span className="font-display text-2xl font-medium tracking-(--tracking-tight)">
                        {story.title || "Untitled"}
                      </span>
                      <span className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {preview}
                      </span>
                      <span className="mt-2 text-xs tabular-nums text-subtle">
                        {wordCount(story.body)} words ·{" "}
                        {formatDistanceToNow(story.updatedAt, {
                          addSuffix: true,
                        })}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <ModelSheet open={modelOpen} onOpenChange={setModelOpen} />
    </main>
  );
}
