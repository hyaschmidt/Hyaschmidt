import { clipText, lastParagraph } from "@/lib/utils";
import { WRITER_SYSTEM } from "@/lib/llm/models";

export type CraftKind =
  | "continue"
  | "rewrite"
  | "tighten"
  | "expand"
  | "next"
  | "ask";

export type CraftRequest = {
  kind: CraftKind;
  body: string;
  selection?: string;
  voice?: string;
  notes?: string;
  question?: string;
};

function contextBlock(req: CraftRequest) {
  const selection = req.selection?.trim();
  const source = selection || lastParagraph(req.body) || req.body;
  const voice = req.voice?.trim();
  const notes = req.notes?.trim();
  const parts = [
    voice ? `Voice / style: ${voice}` : "",
    notes ? `Story notes: ${clipText(notes, 400)}` : "",
    `Passage:\n${clipText(source, 1600)}`,
  ].filter(Boolean);
  return parts.join("\n\n");
}

export function buildMessages(req: CraftRequest): {
  role: "system" | "user" | "assistant";
  content: string;
}[] {
  const ctx = contextBlock(req);
  let user = "";
  switch (req.kind) {
    case "continue":
      user = `${ctx}\n\nContinue this passage. Write the next 120–180 words. Stay in voice. Do not repeat the last sentences.`;
      break;
    case "rewrite":
      user = `${ctx}\n\nRewrite the passage with the same meaning, in a cleaner, more vivid line. Keep length similar. Output only the rewrite.`;
      break;
    case "tighten":
      user = `${ctx}\n\nTighten the passage. Cut slack, keep the tension. Output only the revised text, shorter than the original.`;
      break;
    case "expand":
      user = `${ctx}\n\nExpand the passage. Slow down. Add sensory detail and interiority without changing what happens. Output only the expanded text.`;
      break;
    case "next":
      user = `${ctx}\n\nSuggest three possible next beats for this scene. Each beat: one short paragraph, concrete, in story voice. Number them 1–3.`;
      break;
    case "ask":
      user = `${ctx}\n\nAuthor request: ${req.question?.trim() || "Help with this passage."}\n\nRespond with usable writing or brief, specific craft notes — whichever the request needs.`;
      break;
  }
  return [
    { role: "system", content: WRITER_SYSTEM },
    { role: "user", content: user },
  ];
}

export const CRAFT_ACTIONS: {
  kind: Exclude<CraftKind, "ask">;
  label: string;
  hint: string;
}[] = [
  { kind: "continue", label: "Continue", hint: "Write the next stretch" },
  { kind: "rewrite", label: "Rewrite", hint: "Same meaning, cleaner line" },
  { kind: "tighten", label: "Tighten", hint: "Cut slack" },
  { kind: "expand", label: "Expand", hint: "Slow the moment down" },
  { kind: "next", label: "Next beats", hint: "Three ways the scene can turn" },
];
