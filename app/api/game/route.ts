import {
  closeAuction,
  createRoom,
  joinRoom,
  nextRound,
  placeBid,
  playerForToken,
  sessionFor,
  toPublicGame,
} from "@/lib/game/engine";
import { findGameByCode, saveGame } from "@/lib/game/store";
import type { RoomResponse } from "@/lib/game/types";
import { NextResponse } from "next/server";

type RoomAction =
  | { action: "create"; challengeId: string }
  | { action: "join"; roomCode: string }
  | { action: "bid"; roomCode: string; token: string; amount: number }
  | { action: "close"; roomCode: string; token: string }
  | { action: "next"; roomCode: string; token: string };

const normalizeCode = (roomCode: string) => roomCode.trim().toUpperCase();

const responseFor = (game: ReturnType<typeof findGameByCode>, token: string) => {
  if (!game) throw new Error("That room code was not found.");
  const player = playerForToken(game, token);
  if (!player) throw new Error("Your room session is no longer valid.");
  return { game: toPublicGame(game), session: sessionFor(game, player) } satisfies RoomResponse;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomCode = searchParams.get("roomCode");
    const token = searchParams.get("token");
    if (!roomCode || !token) throw new Error("A room code and player session are required.");
    return NextResponse.json(responseFor(findGameByCode(normalizeCode(roomCode)), token));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load the auction room.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RoomAction;
    if (payload.action === "create") {
      const game = createRoom(payload.challengeId);
      saveGame(game);
      return NextResponse.json({ game: toPublicGame(game), session: sessionFor(game, "one") } satisfies RoomResponse);
    }
    if (payload.action === "join") {
      const game = findGameByCode(normalizeCode(payload.roomCode));
      if (!game) throw new Error("That room code was not found.");
      const session = joinRoom(game);
      saveGame(game);
      return NextResponse.json({ game: toPublicGame(game), session } satisfies RoomResponse);
    }
    const game = findGameByCode(normalizeCode(payload.roomCode));
    if (!game) throw new Error("That room code was not found.");
    const player = playerForToken(game, payload.token);
    if (!player) throw new Error("Your room session is no longer valid.");
    if (payload.action === "bid") placeBid(game, player, payload.amount);
    if (payload.action === "close") closeAuction(game);
    if (payload.action === "next") nextRound(game);
    saveGame(game);
    return NextResponse.json({ game: toPublicGame(game), session: sessionFor(game, player) } satisfies RoomResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update the auction room.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
