import { MODELS, type ModelId } from "@/lib/llm/models";
import { buildMessages, type CraftRequest } from "@/lib/llm/prompts";

type WllamaModule = typeof import("@wllama/wllama");
type WllamaInstance = InstanceType<WllamaModule["Wllama"]>;

let wllamaCtor: WllamaModule["Wllama"] | null = null;
let logger: WllamaModule["LoggerWithoutDebug"] | null = null;
let instance: WllamaInstance | null = null;
let loadedId: ModelId | null = null;
let loadSeq = 0;

function wasmUrl() {
  return new URL("/wllama.wasm", window.location.origin).href;
}

function threadCount() {
  const n =
    typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 2 : 2;
  return Math.max(1, Math.min(4, n));
}

function isAbort(err: unknown) {
  return (
    (err instanceof Error &&
      (err.name === "AbortError" || err.message === "Load cancelled")) ||
    (typeof DOMException !== "undefined" &&
      err instanceof DOMException &&
      err.name === "AbortError")
  );
}

async function getWllama() {
  if (!wllamaCtor) {
    const mod = await import("@wllama/wllama");
    wllamaCtor = mod.Wllama;
    logger = mod.LoggerWithoutDebug;
  }
  return { Wllama: wllamaCtor, LoggerWithoutDebug: logger! };
}

async function makeClient(compat: boolean) {
  const { Wllama, LoggerWithoutDebug } = await getWllama();
  const wllama = new Wllama(
    { default: wasmUrl() },
    {
      logger: LoggerWithoutDebug,
      allowOffline: true,
      parallelDownloads: 4,
      suppressNativeLog: true,
    },
  );
  // Prefer same-origin wasm. CDN compat is only a fallback for browsers
  // without JSPI (some Safari builds).
  wllama.setCompat(compat ? "default" : null);
  return wllama;
}

export async function listCachedFiles() {
  if (typeof window === "undefined") return [];
  const probe = await makeClient(false);
  try {
    return await probe.cacheManager.list();
  } catch {
    return [];
  }
}

export async function isModelCached(id: ModelId) {
  const entries = await listCachedFiles();
  const file = MODELS[id].file.toLowerCase();
  return entries.some(
    (e) =>
      e.name.toLowerCase().includes(file) ||
      e.metadata.originalURL.toLowerCase().includes(file),
  );
}

export async function unloadModel() {
  if (instance) {
    try {
      await instance.exit();
    } catch {
      /* ignore */
    }
  }
  instance = null;
  loadedId = null;
}

export async function loadOnDeviceModel(
  id: ModelId,
  onProgress: (loaded: number, total: number) => void,
  signal?: AbortSignal,
) {
  if (typeof window === "undefined") {
    throw new Error("The writing model only runs in the browser.");
  }
  const seq = ++loadSeq;
  const spec = MODELS[id];
  await unloadModel();

  const gpu =
    typeof navigator !== "undefined" && "gpu" in navigator ? 99 : 0;

  const params = {
    n_ctx: 2048,
    n_batch: 128,
    n_threads: threadCount(),
    progressCallback: ({
      loaded,
      total,
    }: {
      loaded: number;
      total: number;
    }) => {
      if (seq !== loadSeq) return;
      onProgress(loaded, total || 1);
    },
    signal,
    useCache: true,
  };

  const attempts: Array<{ compat: boolean; gpuLayers: number }> = [
    { compat: false, gpuLayers: gpu },
  ];
  if (gpu > 0) attempts.push({ compat: false, gpuLayers: 0 });
  attempts.push({ compat: true, gpuLayers: 0 });

  let lastErr: unknown;
  for (const attempt of attempts) {
    if (signal?.aborted) throw new DOMException("Load cancelled", "AbortError");
    const wllama = await makeClient(attempt.compat);
    try {
      await wllama.loadModelFromHF(
        { repo: spec.repo, file: spec.file },
        { ...params, n_gpu_layers: attempt.gpuLayers },
      );
      if (seq !== loadSeq) {
        await wllama.exit();
        throw new Error("Load cancelled");
      }
      instance = wllama;
      loadedId = id;
      return;
    } catch (err) {
      try {
        await wllama.exit();
      } catch {
        /* ignore */
      }
      if (isAbort(err) || seq !== loadSeq) {
        throw err instanceof Error ? err : new Error("Load cancelled");
      }
      lastErr = err;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("Could not load the model.");
}

export function getLoadedModelId() {
  return loadedId;
}

export function isEngineReady() {
  return Boolean(instance?.isModelLoaded());
}

export async function runCraft(
  req: CraftRequest,
  onToken: (text: string) => void,
  signal?: AbortSignal,
) {
  if (!instance || !instance.isModelLoaded()) {
    throw new Error("Install a model first.");
  }
  const messages = buildMessages(req);
  let acc = "";
  const temperature =
    req.kind === "tighten" || req.kind === "rewrite" ? 0.55 : 0.85;
  await instance.createChatCompletion({
    messages,
    stream: true,
    max_tokens: req.kind === "next" ? 280 : 200,
    temperature,
    top_p: 0.92,
    abortSignal: signal,
    cache_prompt: true,
    onData: (chunk) => {
      const piece = chunk.choices[0]?.delta.content ?? "";
      if (!piece) return;
      acc += piece;
      onToken(acc);
    },
  });
  return cleanDraft(acc);
}

function cleanDraft(text: string) {
  let t = text.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("\u201c") && t.endsWith("\u201d"))
  ) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

export async function clearModelCache() {
  if (typeof window === "undefined") return;
  await unloadModel();
  const probe = await makeClient(false);
  await probe.cacheManager.clear();
}

export function humanizeLlmError(err: unknown) {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const lower = raw.toLowerCase();
  if (!raw || lower === "undefined") {
    return "The model could not finish.";
  }
  if (lower.includes("abort") || lower.includes("cancelled")) {
    return "Cancelled.";
  }
  if (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("download") ||
    lower.includes("hf api")
  ) {
    return "Could not reach the model files. Connect once to download — after that it stays on this device.";
  }
  if (
    lower.includes("memory") ||
    lower.includes("oom") ||
    lower.includes("out of memory")
  ) {
    return "This device ran out of memory. Try Pocket, the smaller model.";
  }
  return raw;
}
