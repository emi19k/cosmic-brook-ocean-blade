import { createFileRoute } from "@tanstack/react-router";
import { CornerApp } from "@/components/corner-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <CornerApp />;
}
