export type PlayerId = "one" | "two";

export type Rarity = "common" | "standout" | "legendary";

export type GamePhase =
  | "WAITING_FOR_PLAYER"
  | "AUCTION_OPEN"
  | "ROUND_REVEAL"
  | "FINISHED";

export interface ComponentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  maxSelections: number;
}

export interface ComponentItem {
  id: string;
  name: string;
  componentType: string;
  description: string;
  imageSearchTerm: string;
  tags: string[];
  rarity: Rarity;
  score: number;
}

export interface ScoringCriterion {
  name: string;
  description: string;
  weight: number;
}

export interface ChallengeDefinition {
  id: string;
  name: string;
  kicker: string;
  description: string;
  objective: string;
  imageSearchTerm: string;
  accent: string;
  componentTypes: ComponentType[];
  items: ComponentItem[];
  scoringCriteria: ScoringCriterion[];
  numberOfItemsRequired: number;
}

export interface PlayerState {
  budget: number;
  items: string[];
}

export interface RoundResult {
  itemId: string;
  item: ComponentItem;
  winner: PlayerId | null;
  winningBid: number;
}

export interface CurrentBid {
  player: PlayerId;
  amount: number;
  placedAt: number;
}

export interface GameState {
  id: string;
  roomCode: string;
  challengeId: string;
  phase: GamePhase;
  round: number;
  maxRounds: number;
  availableItemIds: string[];
  currentItemId: string | null;
  players: Record<PlayerId, PlayerState>;
  playerTokens: Record<PlayerId, string | null>;
  currentBid: CurrentBid | null;
  passedBy: PlayerId[];
  lastResult: RoundResult | null;
}

export interface PlayerPublicState {
  budget: number;
  items: ComponentItem[];
  componentCounts: Record<string, number>;
}

export interface PublicGameState {
  id: string;
  roomCode: string;
  challenge: Omit<ChallengeDefinition, "items">;
  phase: GamePhase;
  round: number;
  maxRounds: number;
  currentItem: ComponentItem | null;
  players: Record<PlayerId, PlayerPublicState>;
  canBid: Record<PlayerId, boolean>;
  seats: Record<PlayerId, boolean>;
  currentBid: CurrentBid | null;
  passedBy: PlayerId[];
  lastResult: RoundResult | null;
  scores?: Record<PlayerId, ScoreCard>;
}

export interface RoomSession {
  roomCode: string;
  player: PlayerId;
  token: string;
}

export interface RoomResponse {
  game: PublicGameState;
  session: RoomSession;
}

export interface ScoreLine {
  name: string;
  value: number;
  outOf: number;
}

export interface ScoreCard {
  total: number;
  lines: ScoreLine[];
  summary: string;
}
