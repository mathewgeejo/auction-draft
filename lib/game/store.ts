import type { GameState } from "./types";

// Server-memory room store for this playable prototype. Deploy with a shared
// data store (Redis/database) when running more than one server instance.
const gamesByCode = new Map<string, GameState>();

export const saveGame = (game: GameState) => gamesByCode.set(game.roomCode, game);

export const findGameByCode = (roomCode: string) => gamesByCode.get(roomCode.toUpperCase());
