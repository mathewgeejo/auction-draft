import { getChallenge, getItem } from "./catalog";
import type {
  ChallengeDefinition,
  ComponentItem,
  GameState,
  PlayerId,
  PlayerState,
  PublicGameState,
  ScoreCard,
} from "./types";

const PLAYERS: PlayerId[] = ["one", "two"];
const STARTING_BUDGET = 20;
export const AUCTION_QUIET_WINDOW_MS = 8_000;

const randomToken = () =>
  `${Date.now().toString(36)}-${crypto.randomUUID().replaceAll("-", "")}`;

const randomRoomCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
};

const shuffle = <T,>(items: T[]) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const itemFor = (challenge: ChallengeDefinition, itemId: string) => {
  const item = getItem(challenge, itemId);
  if (!item) throw new Error("Unknown component item.");
  return item;
};

export const componentCounts = (challenge: ChallengeDefinition, player: PlayerState) =>
  challenge.componentTypes.reduce<Record<string, number>>((counts, component) => {
    counts[component.id] = player.items.filter(
      (itemId) => itemFor(challenge, itemId).componentType === component.id,
    ).length;
    return counts;
  }, {});

export const canPlayerTake = (
  challenge: ChallengeDefinition,
  player: PlayerState,
  item: ComponentItem,
) => {
  const component = challenge.componentTypes.find((entry) => entry.id === item.componentType);
  if (!component || player.budget < 1) return false;
  return componentCounts(challenge, player)[component.id] < component.maxSelections;
};

const availableItemsByPlan = (challenge: ChallengeDefinition) => {
  const anchors = challenge.componentTypes
    .filter((component) => component.required)
    .flatMap((component) =>
      shuffle(challenge.items.filter((item) => item.componentType === component.id)).slice(0, 1),
    );
  let remaining = challenge.items.filter(
    (item) => !anchors.some((anchor) => anchor.id === item.id),
  );
  const selected = [...anchors];
  while (selected.length < challenge.numberOfItemsRequired) {
    const eligible = remaining.filter((item) => {
      const component = challenge.componentTypes.find((entry) => entry.id === item.componentType);
      if (!component) return false;
      const selectedOfType = selected.filter((entry) => entry.componentType === item.componentType).length;
      return selectedOfType < component.maxSelections * PLAYERS.length;
    });
    if (!eligible.length) break;
    const next = eligible[Math.floor(Math.random() * eligible.length)];
    selected.push(next);
    remaining = remaining.filter((item) => item.id !== next.id);
  }
  return shuffle(selected).map((item) => item.id);
};

export const createRoom = (challengeId: string): GameState => {
  const challenge = getChallenge(challengeId);
  if (!challenge) throw new Error("That challenge is unavailable.");
  return {
    id: randomToken(),
    roomCode: randomRoomCode(),
    challengeId,
    phase: "WAITING_FOR_PLAYER",
    round: 1,
    maxRounds: challenge.numberOfItemsRequired,
    availableItemIds: availableItemsByPlan(challenge),
    currentItemId: null,
    players: {
      one: { budget: STARTING_BUDGET, items: [] },
      two: { budget: STARTING_BUDGET, items: [] },
    },
    playerTokens: { one: randomToken(), two: null },
    currentBid: null,
    closeAt: null,
    lastResult: null,
  };
};

export const sessionFor = (state: GameState, player: PlayerId) => {
  const token = state.playerTokens[player];
  if (!token) throw new Error("This seat has not joined yet.");
  return { roomCode: state.roomCode, player, token };
};

export const joinRoom = (state: GameState) => {
  if (state.playerTokens.two) throw new Error("This room already has two players.");
  if (state.phase !== "WAITING_FOR_PLAYER") throw new Error("This room is no longer accepting players.");
  state.playerTokens.two = randomToken();
  const challenge = getChallenge(state.challengeId);
  if (!challenge) throw new Error("Challenge data is unavailable.");
  advanceToNextItem(state, challenge);
  return sessionFor(state, "two");
};

export const playerForToken = (state: GameState, token: string) =>
  PLAYERS.find((player) => state.playerTokens[player] === token) ?? null;

const eligibleAvailableItemIndex = (state: GameState, challenge: ChallengeDefinition) =>
  state.availableItemIds.findIndex((itemId) => {
    const item = itemFor(challenge, itemId);
    return PLAYERS.some((playerId) => canPlayerTake(challenge, state.players[playerId], item));
  });

export const advanceToNextItem = (state: GameState, challenge: ChallengeDefinition) => {
  if (state.round > state.maxRounds) {
    state.phase = "FINISHED";
    state.currentItemId = null;
    state.currentBid = null;
    state.closeAt = null;
    return;
  }
  const nextItemIndex = eligibleAvailableItemIndex(state, challenge);
  if (nextItemIndex === -1) {
    state.phase = "FINISHED";
    state.currentItemId = null;
    state.currentBid = null;
    state.closeAt = null;
    return;
  }
  state.currentItemId = state.availableItemIds.splice(nextItemIndex, 1)[0];
  state.currentBid = null;
  state.closeAt = Date.now() + AUCTION_QUIET_WINDOW_MS;
  state.phase = "AUCTION_OPEN";
  state.lastResult = null;
};

const requireCurrentItem = (state: GameState, challenge: ChallengeDefinition) => {
  if (!state.currentItemId) throw new Error("No component is being auctioned.");
  return itemFor(challenge, state.currentItemId);
};

export const placeBid = (state: GameState, playerId: PlayerId, amount: number) => {
  if (state.phase !== "AUCTION_OPEN") throw new Error("This lot is not open for bids.");
  if (!Number.isInteger(amount)) throw new Error("Bids must be whole dollars.");
  const challenge = getChallenge(state.challengeId);
  if (!challenge) throw new Error("Challenge data is unavailable.");
  const item = requireCurrentItem(state, challenge);
  const player = state.players[playerId];
  if (!canPlayerTake(challenge, player, item)) {
    throw new Error("You cannot add this component with your remaining budget or build slots.");
  }
  if (state.currentBid?.player === playerId) {
    throw new Error("You already have the leading bid. Wait for your opponent to raise.");
  }
  const minimum = (state.currentBid?.amount ?? 0) + 1;
  if (amount < minimum || amount > player.budget) {
    throw new Error(`Bid between $${minimum} and $${player.budget}.`);
  }
  state.currentBid = { player: playerId, amount, placedAt: Date.now() };
  state.closeAt = Date.now() + AUCTION_QUIET_WINDOW_MS;
};

export const closeAuction = (state: GameState) => {
  if (state.phase !== "AUCTION_OPEN") throw new Error("There is no open auction to close.");
  const remaining = (state.closeAt ?? Date.now()) - Date.now();
  if (remaining > 0) {
    throw new Error(`Bidding remains open for ${Math.ceil(remaining / 1000)} more seconds.`);
  }
  const challenge = getChallenge(state.challengeId);
  if (!challenge) throw new Error("Challenge data is unavailable.");
  const item = requireCurrentItem(state, challenge);
  const winner = state.currentBid?.player ?? null;
  const winningBid = state.currentBid?.amount ?? 0;
  if (winner) {
    state.players[winner].budget -= winningBid;
    state.players[winner].items.push(item.id);
  }
  state.lastResult = { itemId: item.id, item, winner, winningBid };
  state.phase = "ROUND_REVEAL";
  state.closeAt = null;
};

export const nextRound = (state: GameState) => {
  if (state.phase !== "ROUND_REVEAL") throw new Error("Close the auction before starting the next lot.");
  const challenge = getChallenge(state.challengeId);
  if (!challenge) throw new Error("Challenge data is unavailable.");
  state.round += 1;
  advanceToNextItem(state, challenge);
};

const scorePlayer = (challenge: ChallengeDefinition, player: PlayerState): ScoreCard => {
  const items = player.items.map((itemId) => itemFor(challenge, itemId));
  const typesFilled = new Set(items.map((item) => item.componentType)).size;
  const requiredTypes = challenge.componentTypes.filter((component) => component.required);
  const requiredFilled = requiredTypes.filter((component) =>
    items.some((item) => item.componentType === component.id),
  ).length;
  const rarity = items.reduce((total, item) => total + item.score, 0);
  const tagCounts = items.flatMap((item) => item.tags).reduce<Record<string, number>>(
    (counts, tag) => ({ ...counts, [tag]: (counts[tag] ?? 0) + 1 }),
    {},
  );
  const synergyPairs = Object.values(tagCounts).reduce(
    (total, count) => total + (count > 1 ? count - 1 : 0),
    0,
  );
  const coverage = requiredTypes.length ? requiredFilled / requiredTypes.length : 0;
  const variety = challenge.componentTypes.length ? typesFilled / challenge.componentTypes.length : 0;
  const quality = Math.min(1, rarity / Math.max(1, items.length * 9));
  const synergy = Math.min(1, synergyPairs / Math.max(2, items.length));
  const signals = [coverage, synergy, quality, variety, (coverage + quality + synergy) / 3];
  const lines = challenge.scoringCriteria.map((criterion, index) => ({
    name: criterion.name,
    value: Math.max(1, Math.round((signals[index] ?? quality) * 20)),
    outOf: 20,
  }));
  const total = lines.reduce((sum, line) => sum + line.value, 0);
  const missing = requiredTypes
    .filter((component) => !items.some((item) => item.componentType === component.id))
    .map((component) => component.name);
  return {
    total,
    lines,
    summary: missing.length
      ? `Strong personality, but missing ${missing.join(" and ")} kept the build from its full potential.`
      : `A complete build with ${synergyPairs > items.length ? "excellent" : "promising"} internal synergy.`,
  };
};

export const toPublicGame = (state: GameState): PublicGameState => {
  const challenge = getChallenge(state.challengeId);
  if (!challenge) throw new Error("Challenge data is unavailable.");
  const currentItem = state.currentItemId ? itemFor(challenge, state.currentItemId) : null;
  const playerPublic = (player: PlayerState) => ({
    budget: player.budget,
    items: player.items.map((itemId) => itemFor(challenge, itemId)),
    componentCounts: componentCounts(challenge, player),
  });
  const publicGame: PublicGameState = {
    id: state.id,
    roomCode: state.roomCode,
    challenge: {
      id: challenge.id,
      name: challenge.name,
      kicker: challenge.kicker,
      description: challenge.description,
      objective: challenge.objective,
      imageSearchTerm: challenge.imageSearchTerm,
      accent: challenge.accent,
      componentTypes: challenge.componentTypes,
      scoringCriteria: challenge.scoringCriteria,
      numberOfItemsRequired: challenge.numberOfItemsRequired,
    },
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    currentItem,
    players: { one: playerPublic(state.players.one), two: playerPublic(state.players.two) },
    canBid: {
      one: currentItem ? canPlayerTake(challenge, state.players.one, currentItem) : false,
      two: currentItem ? canPlayerTake(challenge, state.players.two, currentItem) : false,
    },
    seats: { one: Boolean(state.playerTokens.one), two: Boolean(state.playerTokens.two) },
    currentBid: state.currentBid,
    closeAt: state.closeAt,
    lastResult: state.lastResult,
  };
  if (state.phase === "FINISHED") {
    publicGame.scores = { one: scorePlayer(challenge, state.players.one), two: scorePlayer(challenge, state.players.two) };
  }
  return publicGame;
};
