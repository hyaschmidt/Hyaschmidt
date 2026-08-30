import { createFileRoute } from "@tanstack/react-router";
import { EditorPage } from "@/components/editor-page";

export const Route = createFileRoute("/write/$storyId")({
  component: WriteRoute,
});

function WriteRoute() {
  const { storyId } = Route.useParams();
  return <EditorPage storyId={storyId} />;
}
