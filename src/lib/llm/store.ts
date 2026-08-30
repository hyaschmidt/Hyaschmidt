import { create } from "zustand";
import { persist } from "zustand/middleware";
import { modelLabel, type ModelId } from "@/lib/llm/models";
import {
  clearModelCache,
  getLoadedModelId,
  humanizeLlmError,
  isModelCached,
  loadOnDeviceModel,
  runCraft,
  unloadModel,
} from "@/lib/llm/engine";
import type { CraftRequest } from "@/lib/llm/prompts";

export type LlmPhase =
  | "idle"
  | "checking"
  | "downloading"
  | "loading"
  | "ready"
  | "generating"
  | "error";

type LlmState = {
  phase: LlmPhase;
  preferredId: ModelId;
  loadedId: ModelId | null;
  cached: Record<ModelId, boolean>;
  progress: number;
  statusLine: string;
  error: string | null;
  draft: string;
  setPreferred: (id: ModelId) => void;
  refreshCache: () => Promise<void>;
  load: (id: ModelId) => Promise<void>;
  generate: (req: CraftRequest) => Promise<string>;
  stop: () => void;
  forgetModels: () => Promise<void>;
  clearDraft: () => void;
};

let abortLoad: AbortController | null = null;
let abortGen: AbortController | null = null;
let autoLoadToken = 0;

function readyLine(id: ModelId | null) {
  return `${modelLabel(id)} ready · offline`;
}

function pickCachedId(
  cached: Record<ModelId, boolean>,
  preferred: ModelId,
): ModelId | null {
  if (cached[preferred]) return preferred;
  if (cached.pocket) return "pocket";
  if (cached.desk) return "desk";
  return null;
}

function isBusy(phase: LlmPhase) {
  return (
    phase === "downloading" ||
    phase === "loading" ||
    phase === "generating"
  );
}

function isAbortName(err: unknown) {
  return (
    (err instanceof Error &&
      (err.name === "AbortError" || err.message === "Load cancelled")) ||
    (typeof DOMException !== "undefined" &&
      err instanceof DOMException &&
      err.name === "AbortError")
  );
}

export const useLlmStore = create<LlmState>()(
  persist(
    (set, get) => ({
      phase: "idle",
      preferredId: "pocket",
      loadedId: null,
      cached: { pocket: false, desk: false },
      progress: 0,
      statusLine: "Install model",
      error: null,
      draft: "",
      setPreferred: (id) => set({ preferredId: id }),
      refreshCache: async () => {
        if (typeof window === "undefined") return;
        const busy = isBusy(get().phase);
        const alreadyReady = Boolean(getLoadedModelId());
        if (!alreadyReady && !busy) set({ phase: "checking" });
        try {
          const [pocket, desk] = await Promise.all([
            isModelCached("pocket"),
            isModelCached("desk"),
          ]);
          const cached = { pocket, desk };
          const loadedId = getLoadedModelId();
          if (loadedId) {
            set({
              cached,
              loadedId,
              phase: get().phase === "generating" ? "generating" : "ready",
              statusLine: readyLine(loadedId),
            });
            return;
          }
          if (isBusy(get().phase)) {
            set({ cached });
            return;
          }
          const next = pickCachedId(cached, get().preferredId);
          set({
            cached,
            loadedId: null,
            phase: "idle",
            statusLine: next ? "Model on device · warming" : "Install model",
          });
          if (!next) return;
          const token = ++autoLoadToken;
          await get().load(next);
          if (token !== autoLoadToken) return;
        } catch {
          if (!getLoadedModelId() && !isBusy(get().phase)) {
            set({ phase: "idle" });
          }
        }
      },
      load: async (id) => {
        abortLoad?.abort();
        abortLoad = new AbortController();
        const fromCache = get().cached[id];
        set({
          phase: fromCache ? "loading" : "downloading",
          preferredId: id,
          error: null,
          progress: fromCache ? 70 : 0,
          statusLine: fromCache ? "Warming the model…" : "Fetching model…",
        });
        try {
          await loadOnDeviceModel(
            id,
            (loaded, total) => {
              const pct = Math.min(100, Math.round((loaded / total) * 100));
              const cachedNow = get().cached[id];
              set({
                phase: cachedNow || pct >= 99 ? "loading" : "downloading",
                progress: pct,
                statusLine:
                  pct >= 99 || cachedNow
                    ? "Warming the model…"
                    : `Downloading… ${pct}%`,
              });
            },
            abortLoad.signal,
          );
          set({
            phase: "ready",
            loadedId: id,
            cached: { ...get().cached, [id]: true },
            progress: 100,
            statusLine: readyLine(id),
            error: null,
          });
        } catch (err) {
          if (isAbortName(err)) {
            set({
              phase: getLoadedModelId() ? "ready" : "idle",
              statusLine: getLoadedModelId()
                ? readyLine(getLoadedModelId())
                : "Download cancelled",
            });
            return;
          }
          set({
            phase: "error",
            error: humanizeLlmError(err),
            statusLine: "Load failed",
          });
        }
      },
      generate: async (req) => {
        abortGen?.abort();
        abortGen = new AbortController();
        set({ phase: "generating", draft: "", error: null });
        try {
          const text = await runCraft(
            req,
            (acc) => set({ draft: acc }),
            abortGen.signal,
          );
          set({
            phase: "ready",
            draft: text,
            statusLine: readyLine(get().loadedId),
          });
          return text;
        } catch (err) {
          if (isAbortName(err)) {
            set({ phase: "ready" });
            return get().draft;
          }
          set({
            phase: get().loadedId ? "ready" : "error",
            error: humanizeLlmError(err),
          });
          throw err;
        }
      },
      stop: () => {
        abortGen?.abort();
        abortLoad?.abort();
        autoLoadToken += 1;
        set({
          phase: get().loadedId ? "ready" : "idle",
          statusLine: get().loadedId
            ? readyLine(get().loadedId)
            : "Install model",
        });
      },
      forgetModels: async () => {
        abortGen?.abort();
        abortLoad?.abort();
        autoLoadToken += 1;
        await unloadModel();
        await clearModelCache();
        set({
          phase: "idle",
          loadedId: null,
          cached: { pocket: false, desk: false },
          progress: 0,
          draft: "",
          statusLine: "Install model",
          error: null,
        });
      },
      clearDraft: () => set({ draft: "" }),
    }),
    {
      name: "quire-llm-ablit-v1",
      partialize: (s) => ({
        preferredId: s.preferredId,
        cached: s.cached,
      }),
    },
  ),
);
