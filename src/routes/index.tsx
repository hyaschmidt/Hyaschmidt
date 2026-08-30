import { createFileRoute } from "@tanstack/react-router";
import { LibraryPage } from "@/components/library-page";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <LibraryPage />;
}
