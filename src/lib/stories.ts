import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Story = {
  id: string;
  title: string;
  body: string;
  notes: string;
  voice: string;
  createdAt: number;
  updatedAt: number;
};

type StoryState = {
  hydrated: boolean;
  userTouched: boolean;
  stories: Story[];
  finishHydration: () => void;
  upsert: (story: Story) => void;
  patch: (id: string, patch: Partial<Omit<Story, "id" | "createdAt">>) => void;
  remove: (id: string) => void;
  getById: (id: string) => Story | undefined;
};

const SAMPLE: Story = {
  id: "sample-last-keep",
  title: "The Last Keep",
  voice: "Close third. Spare, salt-worn.",
  notes:
    "Maren keeps the lighthouse. The spare oil is gone. A boat sits too still in the channel.",
  createdAt: Date.now() - 1000 * 60 * 60 * 20,
  updatedAt: Date.now() - 1000 * 60 * 60 * 6,
  body: `The lamp had been out for nine minutes before Maren admitted it. Below the gallery the sea kept its own time, a black metronome against the piles. She wrote the failure in the log with a pencil worn to a nail: 03:14, wick drowned, glass weeping salt.

The spare oil was not spare. It was a rumor she had been rationing since Tuesday.

Out in the channel a boat sat without lights. Not drifting — sitting. As if someone had set it down on the water and forgotten to pick the thought back up.`,
};

function sortStories(stories: Story[]) {
  return [...stories].sort((a, b) => b.updatedAt - a.updatedAt);
}

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      userTouched: false,
      stories: [SAMPLE],
      finishHydration: () => {
        const { stories, userTouched } = get();
        if (!userTouched && stories.length === 0) {
          set({ hydrated: true, stories: [SAMPLE] });
          return;
        }
        set({ hydrated: true });
      },
      upsert: (story) =>
        set({
          userTouched: true,
          stories: sortStories([
            story,
            ...get().stories.filter((s) => s.id !== story.id),
          ]),
        }),
      patch: (id, patch) =>
        set({
          userTouched: true,
          stories: sortStories(
            get().stories.map((s) =>
              s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s,
            ),
          ),
        }),
      remove: (id) =>
        set({
          userTouched: true,
          stories: get().stories.filter((s) => s.id !== id),
        }),
      getById: (id) => get().stories.find((s) => s.id === id),
    }),
    {
      name: "quire-desk-v1",
      partialize: (s) => ({ stories: s.stories, userTouched: s.userTouched }),
      onRehydrateStorage: () => (state) => {
        state?.finishHydration();
      },
    },
  ),
);

export function newStory(): Story {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "Untitled",
    body: "",
    notes: "",
    voice: "",
    createdAt: now,
    updatedAt: now,
  };
}
