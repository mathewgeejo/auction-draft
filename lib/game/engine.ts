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

const randomId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const shuffle = <T,>(items: T[]) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
};

const itemFor = (challenge: ChallengeDefinition, itemId: string) => {
  const item = getItem(challenge, itemId);
  if (!item) throw new Error("Unknown component item.");
  return item;
};

export const componentCounts = (
  challenge: ChallengeDefinition,
  player: PlayerState,
) =>
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
  const component = challenge.componentTypes.find(
    (entry) => entry.id === item.componentType,
  );
  if (!component || player.budget < 1) return false;
  return componentCounts(challenge, player)[component.id] < component.maxSelections;
};

const availableItemsByPlan = (challenge: ChallengeDefinition) => {
  // Every required role gets a chance to appear, then the remaining slots
  // are sampled from the full pool. The final ordering remains hidden.
  const anchors = challenge.componentTypes
    .filter((component) => component.required)
    .flatMap((component) =>
      shuffle(challenge.items.filter((item) => item.componentType === component.id)).slice(0, 1),
    );
  const remaining = challenge.items.filter(
    (item) => !anchors.some((anchor) => anchor.id === item.id),
  );
  const extraCount = Math.max(0, challenge.numberOfItemsRequired - anchors.length);
  return shuffle([...anchors, ...shuffle(remaining).slice(0, extraCount)]).map(
    (item) => item.id,
  );
};

export const createGame = (challengeId: string): GameState => {
  const challenge = getChallenge(challengeId);
  if (!challenge) throw new Error("That challenge is unavailable.");

  const state: GameState = {
    id: randomId(),
    challengeId,
    phase: "PLAYER_ONE_BIDDING",
    round: 1,
    maxRounds: challenge.numberOfItemsRequired,
    availableItemIds: availableItemsByPlan(challenge),
    currentItemId: null,
    players: {
      one: { budget: STARTING_BUDGET, items: [] },
      two: { budget: STARTING_BUDGET, items: [] },
    },
    lastResult: null,
  };
  advanceToNextItem(state, challenge);
  return state;
};

const eligibleAvailableItemIndex = (
  state: GameState,
  challenge: ChallengeDefinition,
) =>
  state.availableItemIds.findIndex((itemId) => {
    const item = itemFor(challenge, itemId);
    return PLAYERS.some((playerId) =>
      canPlayerTake(challenge, state.players[playerId], item),
    );
  });

export const advanceToNextItem = (
  state: GameState,
  challenge: ChallengeDefinition,
) => {
  if (state.round > state.maxRounds) {
    state.phase = "FINISHED";
    state.currentItemId = null;
    return;
  }

  const nextItemIndex = eligibleAvailableItemIndex(state, challenge);
  if (nextItemIndex === -1) {
    state.phase = "FINISHED";
    state.currentItemId = null;
    return;
  }

  state.currentItemId = state.availableItemIds.splice(nextItemIndex, 1)[0];
  state.phase = "PLAYER_ONE_BIDDING";
  state.lastResult = null;
};

const requireCurrentItem = (state: GameState, challenge: ChallengeDefinition) => {
  if (!state.currentItemId) throw new Error("No component is being auctioned.");
  return itemFor(challenge, state.currentItemId);
};

export const submitBid = (
  state: GameState,
  playerId: PlayerId,
  bid: number,
) => {
  const challenge = getChallenge(state.challengeId);
  if (!challenge) throw new Error("Challenge data is unavailable.");
  const expectedPhase =
    playerId === "one" ? "PLAYER_ONE_BIDDING" : "PLAYER_TWO_BIDDING";
  if (state.phase !== expectedPhase) throw new Error("It is not that player’s turn.");
  if (!Number.isInteger(bid) || bid < 0) throw new Error("Bids must be whole dollars.");

  const item = requireCurrentItem(state, challenge);
  const player = state.players[playerId];
  const canBid = canPlayerTake(challenge, player, item);
  if (canBid && (bid < 1 || bid > player.budget)) {
    throw new Error("Bid between $1 and the player’s remaining budget.");
  }
  if (!canBid && bid !== 0) {
    throw new Error("This player cannot add that component right now.");
  }

  player.pendingBid = bid;
  if (playerId === "one") {
    state.phase = "PLAYER_TWO_BIDDING";
    return;
  }
  resolveRound(state, challenge, item);
};

const resolveRound = (
  state: GameState,
  challenge: ChallengeDefinition,
  item: ComponentItem,
) => {
  const bids: Record<PlayerId, number> = {
    one: state.players.one.pendingBid ?? 0,
    two: state.players.two.pendingBid ?? 0,
  };
  let winner: PlayerId | null = null;
  let tieBreak = false;

  if (bids.one > bids.two) winner = "one";
  if (bids.two > bids.one) winner = "two";
  if (bids.one > 0 && bids.one === bids.two) {
    winner = Math.random() > 0.5 ? "one" : "two";
    tieBreak = true;
  }

  if (winner) {
    state.players[winner].budget -= bids[winner];
    state.players[winner].items.push(item.id);
  }
  state.players.one.pendingBid = undefined;
  state.players.two.pendingBid = undefined;
  state.lastResult = { itemId: item.id, item, bids, winner, tieBreak };
  state.phase = "ROUND_REVEAL";
};

export const nextRound = (state: GameState) => {
  if (state.phase !== "ROUND_REVEAL") {
    throw new Error("Reveal the round before moving on.");
  }
  const challenge = getChallenge(state.challengeId);
  if (!challenge) throw new Error("Challenge data is unavailable.");
  state.round += 1;
  advanceToNextItem(state, challenge);
};

const scorePlayer = (
  challenge: ChallengeDefinition,
  player: PlayerState,
): ScoreCard => {
  const items = player.items.map((itemId) => itemFor(challenge, itemId));
  const typesFilled = new Set(items.map((item) => item.componentType)).size;
  const requiredFilled = challenge.componentTypes.filter(
    (component) =>
    component.required && items.some((item) => item.componentType === component.id),
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
  const coverage = challenge.componentTypes.length
    ? requiredFilled / challenge.componentTypes.filter((component) => component.required).length
    : 0;
  const variety = challenge.componentTypes.length ? typesFilled / challenge.componentTypes.length : 0;
  const quality = Math.min(1, rarity / Math.max(1, items.length * 9));
  const synergy = Math.min(1, synergyPairs / Math.max(2, items.length));
  const rawSignals = [coverage, synergy, quality, variety, (coverage + quality + synergy) / 3];
  const lines = challenge.scoringCriteria.map((criterion, index) => ({
    name: criterion.name,
    value: Math.max(1, Math.round((rawSignals[index] ?? quality) * 20)),
    outOf: 20,
  }));
  const total = lines.reduce((sum, line) => sum + line.value, 0);
  const missing = challenge.componentTypes
    .filter(
      (component) => component.required && !items.some((item) => item.componentType === component.id),
    )
    .map((component) => component.name);
  const summary = missing.length
    ? `Strong personality, but missing ${missing.join(" and ")} kept the build from its full potential.`
    : `A complete build with ${synergyPairs > items.length ? "excellent" : "promising"} internal synergy.`;
  return { total, lines, summary };
};

export const toPublicGame = (state: GameState): PublicGameState => {
  const challenge = getChallenge(state.challengeId);
  if (!challenge) throw new Error("Challenge data is unavailable.");
  const currentItem = state.currentItemId
    ? itemFor(challenge, state.currentItemId)
    : null;
  const playerPublic = (player: PlayerState) => ({
    budget: player.budget,
    items: player.items.map((itemId) => itemFor(challenge, itemId)),
    componentCounts: componentCounts(challenge, player),
  });
  const challengeInfo = { ...challenge, items: undefined };
  const { items: _items, ...publicChallenge } = challengeInfo;
  const publicGame: PublicGameState = {
    id: state.id,
    challenge: publicChallenge,
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    currentItem,
    players: { one: playerPublic(state.players.one), two: playerPublic(state.players.two) },
    canBid: {
      one: currentItem ? canPlayerTake(challenge, state.players.one, currentItem) : false,
      two: currentItem ? canPlayerTake(challenge, state.players.two, currentItem) : false,
    },
    lastResult: state.lastResult,
  };
  if (state.phase === "FINISHED") {
    publicGame.scores = {
      one: scorePlayer(challenge, state.players.one),
      two: scorePlayer(challenge, state.players.two),
    };
  }
  return publicGame;
};
