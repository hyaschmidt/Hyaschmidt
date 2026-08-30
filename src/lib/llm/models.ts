export type ModelId = "pocket" | "desk";

export type ModelSpec = {
  id: ModelId;
  name: string;
  sizeLabel: string;
  blurb: string;
  repo: string;
  file: string;
  params: string;
};

export const MODELS: Record<ModelId, ModelSpec> = {
  pocket: {
    id: "pocket",
    name: "Pocket",
    sizeLabel: "398 MB",
    blurb: "Abliterated Qwen 0.5B. The phone-sized writer.",
    repo: "mradermacher/Qwen2.5-0.5B-Instruct-abliterated-v3-GGUF",
    file: "Qwen2.5-0.5B-Instruct-abliterated-v3.Q4_K_M.gguf",
    params: "0.5B",
  },
  desk: {
    id: "desk",
    name: "Desk",
    sizeLabel: "955 MB",
    blurb: "Abliterated Llama 3.2 1B. Stronger on-device revision.",
    repo: "mradermacher/Llama-3.2-1B-Instruct-abliterated-GGUF",
    file: "Llama-3.2-1B-Instruct-abliterated.Q4_K_M.gguf",
    params: "1B",
  },
};

export const MODEL_LIST: ModelSpec[] = [MODELS.pocket, MODELS.desk];

export function modelLabel(id: ModelId | null) {
  if (id === "desk") return "Desk";
  if (id === "pocket") return "Pocket";
  return "Model";
}

export const WRITER_SYSTEM = `You are a private fiction companion running entirely on the author's device. Match their voice, tense, and point of view. Write what they ask for. Output only the requested writing — no preamble, no title, no quotation marks around the passage, no analysis unless they ask for it.`;
