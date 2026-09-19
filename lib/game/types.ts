export type PlayerId = "one" | "two";

export type Rarity = "common" | "standout" | "legendary";

export type GamePhase =
  | "PLAYER_ONE_BIDDING"
  | "PLAYER_TWO_BIDDING"
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
  pendingBid?: number;
}

export interface RoundResult {
  itemId: string;
  item: ComponentItem;
  bids: Record<PlayerId, number>;
  winner: PlayerId | null;
  tieBreak: boolean;
}

export interface GameState {
  id: string;
  challengeId: string;
  phase: GamePhase;
  round: number;
  maxRounds: number;
  availableItemIds: string[];
  currentItemId: string | null;
  players: Record<PlayerId, PlayerState>;
  lastResult: RoundResult | null;
}

export interface PlayerPublicState {
  budget: number;
  items: ComponentItem[];
  componentCounts: Record<string, number>;
}

export interface PublicGameState {
  id: string;
  challenge: Omit<ChallengeDefinition, "items">;
  phase: GamePhase;
  round: number;
  maxRounds: number;
  currentItem: ComponentItem | null;
  players: Record<PlayerId, PlayerPublicState>;
  canBid: Record<PlayerId, boolean>;
  lastResult: RoundResult | null;
  scores?: Record<PlayerId, ScoreCard>;
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
