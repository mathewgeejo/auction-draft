import type { GameState } from "./types";

// A deliberately server-only in-memory store for the prototype. In production,
// replace it with a session-backed database or Redis store.
const games = new Map<string, GameState>();

export const saveGame = (game: GameState) => games.set(game.id, game);

export const findGame = (id: string) => games.get(id);
