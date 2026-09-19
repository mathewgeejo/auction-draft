"use client";

import type { ComponentItem, PlayerId, PublicGameState } from "@/lib/game/types";
import { useEffect, useMemo, useState } from "react";

type ChallengeCard = {
  id: string;
  name: string;
  kicker: string;
  description: string;
  objective: string;
  imageSearchTerm: string;
  accent: string;
  rounds: number;
};

const PLAYER_NAMES: Record<PlayerId, string> = {
  one: "Player 1",
  two: "Player 2",
};

const imageUrl = (term: string, width = 1200) =>
  `https://loremflickr.com/${width}/900/${term
    .split(" ")
    .map((word) => encodeURIComponent(word))
    .join(",")}/all`;

const initials = (value: string) =>
  value
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

async function gameRequest<T>(payload: unknown): Promise<T> {
  const response = await fetch("/api/game", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "The auction desk is unavailable.");
  return body;
}

function Picture({
  term,
  label,
  className = "",
}: {
  term: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={`picture ${className}`} aria-label={label} role="img">
      <span className="picture-fallback">{initials(label)}</span>
      <img
        src={imageUrl(term)}
        alt=""
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

function Wordmark() {
  return (
    <div className="wordmark" aria-label="Build the Best">
      <span className="wordmark-mark">B</span>
      <span>Build the Best</span>
    </div>
  );
}

function Budget({ value, player }: { value: number; player: PlayerId }) {
  return (
    <div className={`budget budget-${player}`}>
      <div className="budget-label">
        <span>{PLAYER_NAMES[player]}</span>
        <strong>${value}</strong>
      </div>
      <div className="budget-track" aria-label={`${PLAYER_NAMES[player]} has $${value} left`}>
        <span style={{ width: `${value * 5}%` }} />
      </div>
    </div>
  );
}

function Rarity({ item }: { item: ComponentItem }) {
  return <span className={`rarity rarity-${item.rarity}`}>{item.rarity}</span>;
}

function CreationBoard({
  state,
  player,
}: {
  state: PublicGameState;
  player: PlayerId;
}) {
  const playerState = state.players[player];
  return (
    <aside className={`creation-board creation-${player}`}>
      <div className="creation-head">
        <span className="eyebrow">{PLAYER_NAMES[player]}’s build</span>
        <Budget value={playerState.budget} player={player} />
      </div>
      <div className="component-list">
        {playerState.items.length === 0 ? (
          <p className="empty-build">Win components to start your build.</p>
        ) : (
          playerState.items.map((item, index) => (
            <div className="won-component" key={item.id} style={{ "--i": index } as React.CSSProperties}>
              <span className="won-index">0{index + 1}</span>
              <div>
                <strong>{item.name}</strong>
                <small>{item.componentType}</small>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

function BidStation({
  state,
  onBid,
  busy,
}: {
  state: PublicGameState;
  onBid: (player: PlayerId, bid: number) => void;
  busy: boolean;
}) {
  const player: PlayerId = state.phase === "PLAYER_ONE_BIDDING" ? "one" : "two";
  const [bid, setBid] = useState(1);
  const canBid = state.canBid[player];
  const budget = state.players[player].budget;

  useEffect(() => {
    setBid(Math.min(Math.max(1, budget), 20));
  }, [player, state.currentItem?.id, budget]);

  return (
    <div className={`bid-station bidder-${player}`}>
      <div className="handoff-line">
        <span className="handoff-dot" />
        {player === "one" ? "First bid — keep it hidden" : "Pass the device — Player 2 bids now"}
      </div>
      <h2>{PLAYER_NAMES[player]}, what is it worth?</h2>
      <p>
        {canBid
          ? `You have $${budget}. Lock in a whole-dollar bid.`
          : "You cannot take another component in this slot or your budget is empty. Pass this one."}
      </p>
      {canBid ? (
        <div className="bid-controls">
          <button
            className="stepper"
            type="button"
            onClick={() => setBid((current) => Math.max(1, current - 1))}
            aria-label="Lower bid"
            disabled={busy || bid <= 1}
          >
            −
          </button>
          <label className="bid-number">
            <span>$</span>
            <input
              type="number"
              min={1}
              max={budget}
              value={bid}
              onChange={(event) =>
                setBid(Math.min(budget, Math.max(1, Number(event.target.value) || 1)))
              }
              aria-label="Secret bid"
              disabled={busy}
            />
          </label>
          <button
            className="stepper"
            type="button"
            onClick={() => setBid((current) => Math.min(budget, current + 1))}
            aria-label="Raise bid"
            disabled={busy || bid >= budget}
          >
            +
          </button>
        </div>
      ) : null}
      <button
        className="primary-action lock-bid"
        type="button"
        disabled={busy}
        onClick={() => onBid(player, canBid ? bid : 0)}
      >
        {canBid ? "Lock secret bid" : "Pass this auction"}
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

function RoundReveal({ state, onNext, busy }: { state: PublicGameState; onNext: () => void; busy: boolean }) {
  const result = state.lastResult;
  if (!result) return null;
  const winner = result.winner ? PLAYER_NAMES[result.winner] : null;
  return (
    <div className="round-reveal">
      <span className="eyebrow">Auction closed</span>
      <h2>{winner ? `${winner} takes it` : "Nobody takes it"}</h2>
      <p>
        {winner
          ? `${result.item.name} joins their build for $${result.bids[result.winner]}.`
          : "Both players passed on this component."}
        {result.tieBreak ? " Tie broken by the auction coin toss." : ""}
      </p>
      <div className="reveal-bids">
        <span>Player 1 <b>${result.bids.one}</b></span>
        <span>Player 2 <b>${result.bids.two}</b></span>
      </div>
      <button className="primary-action" type="button" onClick={onNext} disabled={busy}>
        Next blind auction <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

function AuctionStage({
  state,
  onBid,
  onNext,
  busy,
}: {
  state: PublicGameState;
  onBid: (player: PlayerId, bid: number) => void;
  onNext: () => void;
  busy: boolean;
}) {
  const item = state.currentItem ?? state.lastResult?.item;
  if (!item) return null;
  const reveal = state.phase === "ROUND_REVEAL";
  return (
    <main className={`auction-stage ${reveal ? "is-revealed" : ""}`}>
      <div className="stage-topline">
        <span>Lot {String(state.round).padStart(2, "0")}</span>
        <span>{state.maxRounds - state.round + 1} auctions remain</span>
      </div>
      <div className="auction-item">
        <Picture term={item.imageSearchTerm} label={item.name} className="auction-picture" />
        <div className="item-copy">
          <div className="item-meta">
            <span>{item.componentType}</span>
            <Rarity item={item} />
          </div>
          <h1>{item.name}</h1>
          <p>{item.description}</p>
          <div className="tag-row">
            {item.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
      </div>
      {reveal ? (
        <RoundReveal state={state} onNext={onNext} busy={busy} />
      ) : (
        <BidStation state={state} onBid={onBid} busy={busy} />
      )}
    </main>
  );
}

function FinalResults({ state, onPlayAgain }: { state: PublicGameState; onPlayAgain: () => void }) {
  const [mode, setMode] = useState<"system" | "players">("system");
  const [manualWinner, setManualWinner] = useState<PlayerId | null>(null);
  const scores = state.scores!;
  const leader: PlayerId = scores.one.total === scores.two.total
    ? "one"
    : scores.one.total > scores.two.total ? "one" : "two";
  return (
    <main className="final-results">
      <div className="final-intro">
        <span className="eyebrow">The final build</span>
        <h1>Two visions. One winner.</h1>
        <p>System scores are a playful game lens, not an objective judgment. Pick your own winner if you disagree.</p>
      </div>
      <div className="judge-toggle" role="group" aria-label="Judging mode">
        <button className={mode === "system" ? "active" : ""} onClick={() => setMode("system")} type="button">Game scoring</button>
        <button className={mode === "players" ? "active" : ""} onClick={() => setMode("players")} type="button">Player judging</button>
      </div>
      <section className="final-builds">
        {(["one", "two"] as PlayerId[]).map((player) => {
          const card = scores[player];
          const isSystemWinner = leader === player && scores.one.total !== scores.two.total;
          const isManualWinner = manualWinner === player;
          return (
            <article className={`final-card final-${player} ${isSystemWinner || isManualWinner ? "winner-card" : ""}`} key={player}>
              <div className="final-card-head">
                <span className="eyebrow">{PLAYER_NAMES[player]}</span>
                {mode === "system" ? <strong className="score-orb">{card.total}<small>/100</small></strong> : null}
              </div>
              <div className="final-composition">
                {state.players[player].items.slice(0, 5).map((item, index) => (
                  <div className="composition-piece" style={{ "--piece": index } as React.CSSProperties} key={item.id}>
                    <Picture term={item.imageSearchTerm} label={item.name} />
                  </div>
                ))}
                <div className="composition-center">{initials(state.challenge.name)}</div>
              </div>
              <div className="final-components">
                {state.players[player].items.length ? state.players[player].items.map((item) => <span key={item.id}>{item.name}</span>) : <em>No winning components</em>}
              </div>
              {mode === "system" ? (
                <>
                  <div className="score-lines">
                    {card.lines.map((line) => <div key={line.name}><span>{line.name}</span><b>{line.value}</b></div>)}
                  </div>
                  <p className="score-summary">{card.summary}</p>
                </>
              ) : (
                <button className="judge-button" type="button" onClick={() => setManualWinner(player)}>
                  {isManualWinner ? "Chosen winner" : `Choose ${PLAYER_NAMES[player]}`}
                </button>
              )}
            </article>
          );
        })}
      </section>
      <p className="winner-banner">
        {mode === "players" && manualWinner
          ? `${PLAYER_NAMES[manualWinner]} wins the room’s vote.`
          : mode === "system" && scores.one.total === scores.two.total
            ? "It is a dead heat. Let the players decide."
            : mode === "system" ? `${PLAYER_NAMES[leader]} wins the game-score showdown.` : "Choose the build that deserves the crown."}
      </p>
      <button type="button" className="primary-action play-again" onClick={onPlayAgain}>Choose another challenge <span aria-hidden="true">→</span></button>
    </main>
  );
}

function Lobby({ onStart, loading, error }: { onStart: (id: string) => void; loading: boolean; error: string | null }) {
  const [challenges, setChallenges] = useState<ChallengeCard[]>([]);
  useEffect(() => {
    fetch("/api/challenges")
      .then((response) => response.json())
      .then((data: ChallengeCard[]) => setChallenges(data))
      .catch(() => undefined);
  }, []);
  return (
    <main className="lobby">
      <section className="lobby-hero">
        <div className="lobby-hero-copy">
          <span className="eyebrow">A blind auction party game</span>
          <h1>Build something<br /><i>worth fighting for.</i></h1>
          <p>Bid blind. Spend a shared-size budget. Build the creation that wins the room.</p>
          <div className="game-rules">
            <span><b>02</b> players</span>
            <span><b>$20</b> each</span>
            <span><b>∞</b> regret</span>
          </div>
        </div>
        <div className="lobby-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-card art-card-one">$08</div>
          <div className="art-card art-card-two">?</div>
          <div className="art-center">B<br />B</div>
        </div>
      </section>
      <section className="challenge-select">
        <div className="section-heading">
          <div><span className="eyebrow">Choose the arena</span><h2>What will you build?</h2></div>
          <p>Every game draws a new hidden pool. The next great component is always unknown.</p>
        </div>
        {error ? <p className="error-message">{error}</p> : null}
        <div className="challenge-grid">
          {challenges.map((challenge) => (
            <button
              className="challenge-card"
              key={challenge.id}
              type="button"
              onClick={() => onStart(challenge.id)}
              disabled={loading}
              style={{ "--accent": challenge.accent } as React.CSSProperties}
            >
              <Picture term={challenge.imageSearchTerm} label={challenge.name} />
              <span className="challenge-shade" />
              <span className="challenge-content">
                <small>{challenge.kicker} · {challenge.rounds} lots</small>
                <strong>{challenge.name}</strong>
                <em>{challenge.description}</em>
                <span className="choose-challenge">Enter auction <b>→</b></span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  const [game, setGame] = useState<PublicGameState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(() => game ? Math.max(0, Math.min(100, ((game.round - 1) / game.maxRounds) * 100)) : 0, [game]);

  const run = async (payload: unknown) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await gameRequest<PublicGameState>(payload);
      setGame(updated);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const start = (challengeId: string) => void run({ action: "start", challengeId });
  const bid = (player: PlayerId, amount: number) => {
    if (game) void run({ action: "bid", gameId: game.id, player, bid: amount });
  };
  const next = () => {
    if (game) void run({ action: "next", gameId: game.id });
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <button type="button" className="brand-button" onClick={() => setGame(null)}><Wordmark /></button>
        <div className="header-note"><span className="live-dot" /> Blind auction studio</div>
      </header>
      {game ? (
        game.phase === "FINISHED" ? (
          <FinalResults state={game} onPlayAgain={() => setGame(null)} />
        ) : (
          <div className="game-layout" style={{ "--accent": game.challenge.accent } as React.CSSProperties}>
            <section className="game-bar">
              <div><span className="eyebrow">{game.challenge.kicker}</span><h2>Build the best {game.challenge.name.replace("Best ", "").toLowerCase()}</h2></div>
              <div className="round-progress"><span>Round {game.round} / {game.maxRounds}</span><div><i style={{ width: `${progress}%` }} /></div></div>
            </section>
            {error ? <p className="error-message game-error">{error}</p> : null}
            <div className="game-grid">
              <CreationBoard state={game} player="one" />
              <AuctionStage state={game} onBid={bid} onNext={next} busy={busy} />
              <CreationBoard state={game} player="two" />
            </div>
          </div>
        )
      ) : <Lobby onStart={start} loading={busy} error={error} />}
    </div>
  );
}
