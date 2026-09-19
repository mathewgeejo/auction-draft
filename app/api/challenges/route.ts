import { challengeCatalog } from "@/lib/game/catalog";
import { NextResponse } from "next/server";

export function GET() {
  // The lobby receives only presentation information. Component pools remain
  // exclusively on the server until a component is revealed in play.
  return NextResponse.json(
    challengeCatalog.map((challenge) => ({
      id: challenge.id,
      name: challenge.name,
      kicker: challenge.kicker,
      description: challenge.description,
      objective: challenge.objective,
      imageSearchTerm: challenge.imageSearchTerm,
      accent: challenge.accent,
      rounds: challenge.numberOfItemsRequired,
    })),
  );
}
