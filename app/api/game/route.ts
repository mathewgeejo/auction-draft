import { createGame, nextRound, submitBid, toPublicGame } from "@/lib/game/engine";
import { findGame, saveGame } from "@/lib/game/store";
import type { PlayerId } from "@/lib/game/types";
import { NextResponse } from "next/server";

type GameAction =
  | { action: "start"; challengeId: string }
  | { action: "bid"; gameId: string; player: PlayerId; bid: number }
  | { action: "next"; gameId: string };

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as GameAction;
    if (payload.action === "start") {
      const game = createGame(payload.challengeId);
      saveGame(game);
      return NextResponse.json(toPublicGame(game));
    }
    const game = findGame(payload.gameId);
    if (!game) {
      return NextResponse.json({ error: "This game session has expired." }, { status: 404 });
    }
    if (payload.action === "bid") submitBid(game, payload.player, payload.bid);
    if (payload.action === "next") nextRound(game);
    saveGame(game);
    return NextResponse.json(toPublicGame(game));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update the game.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
