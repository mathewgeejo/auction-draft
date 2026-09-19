"use client";
/* eslint-disable @next/next/no-img-element */

import type { CSSProperties } from "react";
import type { ComponentItem, PlayerId, PublicGameState, RoomResponse, RoomSession } from "@/lib/game/types";
import { useEffect, useState } from "react";

type ChallengeCard = {
  id: string;
  name: string;
  kicker: string;
  description: string;
  imageSearchTerm: string;
  accent: string;
  rounds: number;
};

const PLAYER_NAMES: Record<PlayerId, string> = { one: "Player 1", two: "Player 2" };
const SESSION_KEY = "build-best-room-session";

const imageUrl = (term: string) =>
  `https://loremflickr.com/1200/900/${term.split(" ").map(encodeURIComponent).join(",")}/all`;

const initials = (value: string) => value.split(" ").slice(0, 2).map((word) => word[0]).join("");

async function postRoom<T>(payload: unknown): Promise<T> {
  const response = await fetch("/api/game", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "The auction desk is unavailable.");
  return body;
}

async function pollRoom(session: RoomSession): Promise<RoomResponse> {
  const parameters = new URLSearchParams({ roomCode: session.roomCode, token: session.token });
  const response = await fetch(`/api/game?${parameters.toString()}`, { cache: "no-store" });
  const body = (await response.json()) as RoomResponse & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "Unable to refresh the auction room.");
  return body;
}

function Picture({ term, label, className = "" }: { term: string; label: string; className?: string }) {
  return (
    <div className={`picture ${className}`} aria-label={label} role="img">
      <span className="picture-fallback">{initials(label)}</span>
      <img src={imageUrl(term)} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
    </div>
  );
}

function Wordmark() {
  return <div className="wordmark"><span className="wordmark-mark">B</span><span>Build the Best</span></div>;
}

function Budget({ value, player }: { value: number; player: PlayerId }) {
  return <div className={`budget budget-${player}`}>
    <div className="budget-label"><span>{PLAYER_NAMES[player]}</span><strong>${value}</strong></div>
    <div className="budget-track"><span style={{ width: `${value * 5}%` }} /></div>
  </div>;
}

function CreationBoard({ state, player }: { state: PublicGameState; player: PlayerId }) {
  const playerState = state.players[player];
  return <aside className={`creation-board creation-${player}`}>
    <div className="creation-head"><span className="eyebrow">{PLAYER_NAMES[player]}’s build</span><Budget value={playerState.budget} player={player} /></div>
    <div className="component-list">
      {playerState.items.length === 0 ? <p className="empty-build">No winning components yet.</p> : playerState.items.map((item, index) =>
        <div className="won-component" key={item.id} style={{ "--i": index } as CSSProperties}>
          <span className="won-index">0{index + 1}</span><Picture term={item.imageSearchTerm} label={item.name} className="component-thumb" /><div><strong>{item.name}</strong><small>{item.componentType}</small></div>
        </div>,
      )}
    </div>
  </aside>;
}

function Rarity({ item }: { item: ComponentItem }) {
  return <span className={`rarity rarity-${item.rarity}`}>{item.rarity}</span>;
}

function LiveBidding({
  state,
  session,
  onBid,
  onConcede,
  busy,
}: {
  state: PublicGameState;
  session: RoomSession;
  onBid: () => void;
  onConcede: () => void;
  busy: boolean;
}) {
  const item = state.currentItem!;
  const me = session.player;
  const currentAmount = state.currentBid?.amount ?? 0;
  const minimum = currentAmount + 1;
  const budget = state.players[me].budget;
  const leading = state.currentBid?.player === me;
  const eligible = state.canBid[me] && !leading;
  const passed = state.passedBy.includes(me);

  return <main className="auction-stage open-auction">
    <div className="stage-topline"><span>Live lot {String(state.round).padStart(2, "0")}</span><span>{state.maxRounds - state.round + 1} lots remain</span></div>
    <div className="auction-item">
      <Picture term={item.imageSearchTerm} label={item.name} className="auction-picture" />
      <div className="item-copy">
        <div className="item-meta"><span>{item.componentType}</span><Rarity item={item} /></div>
        <h1>{item.name}</h1><p>{item.description}</p>
        <div className="tag-row">{item.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
      </div>
    </div>
    <section className="live-bid-panel">
      <div className="current-bid">
        <span className="eyebrow">{state.currentBid ? `${PLAYER_NAMES[state.currentBid.player]} leads` : "Opening bid"}</span>
        <strong>${currentAmount || "—"}</strong>
        <span className="auction-clock">Live until one player concedes</span>
      </div>
      <div className="live-bid-copy">
        <h2>{leading ? "You have the high bid." : eligible ? "Want it? Beat the bid." : "You can’t bid on this lot."}</h2>
        <p>{leading ? "Your opponent can still take it by raising the offer." : eligible ? `Your budget is $${budget}. The next valid bid is $${minimum}.` : "Your budget or component slots do not allow another bid."}</p>
      </div>
      {eligible ? <div className="live-bid-controls">
        <button className="raise-bid" type="button" disabled={busy || minimum > budget} onClick={onBid}><span>+</span> Raise bid to ${minimum}</button>
      </div> : null}
      {leading ? <p className="concede-status">You lead. Your opponent chooses whether to raise or let you take it.</p> : <button className="concede-lot" type="button" disabled={busy || passed} onClick={onConcede}>
        {state.currentBid ? `Let ${PLAYER_NAMES[state.currentBid.player]} take it for $${currentAmount}` : passed ? "You passed — waiting for opponent" : "Pass this lot"}
      </button>}
    </section>
  </main>;
}

function RoundReveal({ state, onNext, busy }: { state: PublicGameState; onNext: () => void; busy: boolean }) {
  const result = state.lastResult;
  if (!result) return null;
  return <main className="auction-stage result-stage">
    <div className="stage-topline"><span>Lot {String(state.round).padStart(2, "0")}</span><span>Auction closed</span></div>
    <div className="result-item"><Picture term={result.item.imageSearchTerm} label={result.item.name} className="result-picture" /><div>
      <span className="eyebrow">{result.winner ? "Sold" : "Passed"}</span>
      <h1>{result.winner ? `${PLAYER_NAMES[result.winner]} wins ${result.item.name}` : `${result.item.name} goes unsold`}</h1>
      <p>{result.winner ? `Final visible bid: $${result.winningBid}.` : "Neither player placed a bid before the clock ran out."}</p>
    </div></div>
    <button className="primary-action" type="button" onClick={onNext} disabled={busy}>Open next lot <span>→</span></button>
  </main>;
}

function WaitingRoom({ room, onCopy }: { room: RoomResponse; onCopy: () => void }) {
  return <main className="waiting-room">
    <span className="eyebrow">Room created · you are Player 1</span>
    <h1>Invite your<br /><i>rival.</i></h1>
    <p>Send this room code to the second player. The first live lot opens as soon as they join.</p>
    <div className="room-code-display"><span>{room.game.roomCode}</span><button type="button" onClick={onCopy}>Copy</button></div>
    <div className="waiting-status"><span className="live-dot" /> Waiting for Player 2 to enter the room</div>
  </main>;
}

function FinalResults({ state, onLeave }: { state: PublicGameState; onLeave: () => void }) {
  const scores = state.scores!;
  const winner = scores.one.total === scores.two.total ? null : scores.one.total > scores.two.total ? "one" : "two";
  return <main className="final-results">
    <div className="final-intro"><span className="eyebrow">Room {state.roomCode} · final build</span><h1>Two visions. One winner.</h1><p>These scores are a game lens, not an objective judgment.</p></div>
    <section className="final-builds">{(["one", "two"] as PlayerId[]).map((player) => <article className={`final-card final-${player} ${winner === player ? "winner-card" : ""}`} key={player}>
      <div className="final-card-head"><span className="eyebrow">{PLAYER_NAMES[player]}</span><strong className="score-orb">{scores[player].total}<small>/100</small></strong></div>
      <div className="final-composition">{state.players[player].items.slice(0, 5).map((item, index) => <div className="composition-piece" style={{ "--piece": index, "--offset": `${index % 2 ? 42 : 0}px` } as CSSProperties} key={item.id}><Picture term={item.imageSearchTerm} label={item.name} /></div>)}<div className="composition-center">{initials(state.challenge.name)}</div></div>
      <div className="final-components">{state.players[player].items.map((item) => <span key={item.id}>{item.name}</span>)}</div>
      <div className="score-lines">{scores[player].lines.map((line) => <div key={line.name}><span>{line.name}</span><b>{line.value}</b></div>)}</div>
      <p className="score-summary">{scores[player].summary}</p>
    </article>)}</section>
    <p className="winner-banner">{winner ? `${PLAYER_NAMES[winner]} wins the room.` : "A dead heat. Let the players decide."}</p>
    <button type="button" className="primary-action play-again" onClick={onLeave}>Return to lobby <span>→</span></button>
  </main>;
}

function Lobby({ onHost, onJoin, busy, error }: { onHost: (challengeId: string) => void; onJoin: (roomCode: string) => void; busy: boolean; error: string | null }) {
  const [challenges, setChallenges] = useState<ChallengeCard[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState("");
  useEffect(() => { fetch("/api/challenges").then((response) => response.json()).then((data: ChallengeCard[]) => setChallenges(data)).catch(() => undefined); }, []);
  return <main className="lobby">
    <section className="lobby-hero"><div className="lobby-hero-copy"><span className="eyebrow">A live auction party game</span><h1>Build something<br /><i>worth fighting for.</i></h1><p>See every bid. Raise it if you dare. Spend your $20 to build the creation that wins the room.</p><div className="game-rules"><span><b>02</b> players</span><span><b>$20</b> each</span><span><b>LIVE</b> bids</span></div></div><div className="lobby-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-card art-card-one">$08</div><div className="art-card art-card-two">$09</div><div className="art-center">B<br />B</div></div></section>
    <section className="host-access"><div><span className="eyebrow">Start a new game</span><h2>Host a room</h2><p>Choose the challenge, create a private code, then invite your opponent.</p></div><div className="host-controls"><select value={selectedChallenge} onChange={(event) => setSelectedChallenge(event.target.value)} aria-label="Challenge to host"><option value="">Choose challenge</option>{challenges.map((challenge) => <option key={challenge.id} value={challenge.id}>{challenge.name}</option>)}</select><button className="primary-action" type="button" disabled={busy || !selectedChallenge} onClick={() => onHost(selectedChallenge)}>Host room <span>→</span></button></div></section>
    <section className="room-access"><div><span className="eyebrow">Have a code?</span><h2>Join a live room</h2></div><form onSubmit={(event) => { event.preventDefault(); onJoin(roomCode); }}><input value={roomCode} maxLength={5} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} placeholder="ROOM CODE" aria-label="Room code" /><button className="primary-action" disabled={busy || roomCode.trim().length < 5}>Join room <span>→</span></button></form></section>
    <section className="challenge-select"><div className="section-heading"><div><span className="eyebrow">Pick the arena</span><h2>Choose your challenge</h2></div><p>Select a category above, then use Host room to generate the invitation code.</p></div>{error ? <p className="error-message">{error}</p> : null}<div className="challenge-grid">{challenges.map((challenge) => <button className={`challenge-card ${selectedChallenge === challenge.id ? "selected-challenge" : ""}`} key={challenge.id} type="button" onClick={() => setSelectedChallenge(challenge.id)} disabled={busy} style={{ "--accent": challenge.accent } as CSSProperties}><Picture term={challenge.imageSearchTerm} label={challenge.name} /><span className="challenge-shade" /><span className="challenge-content"><small>{challenge.kicker} · {challenge.rounds} lots</small><strong>{challenge.name}</strong><em>{challenge.description}</em><span className="choose-challenge">{selectedChallenge === challenge.id ? "Selected to host" : "Choose this challenge"} <b>→</b></span></span></button>)}</div></section>
  </main>;
}

export default function Home() {
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveRoom = (next: RoomResponse) => { setRoom(next); sessionStorage.setItem(SESSION_KEY, JSON.stringify(next.session)); };
  const leaveRoom = () => { sessionStorage.removeItem(SESSION_KEY); setRoom(null); setError(null); };
  const run = async (payload: unknown) => { setBusy(true); setError(null); try { saveRoom(await postRoom<RoomResponse>(payload)); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Something went wrong."); } finally { setBusy(false); } };

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return;
    try { const session = JSON.parse(stored) as RoomSession; pollRoom(session).then(saveRoom).catch(() => sessionStorage.removeItem(SESSION_KEY)); } catch { sessionStorage.removeItem(SESSION_KEY); }
  }, []);
  useEffect(() => { if (!room) return; const timer = window.setInterval(() => { pollRoom(room.session).then((next) => setRoom(next)).catch(() => undefined); }, 1000); return () => window.clearInterval(timer); }, [room]);

  const roomGame = room?.game;
  return <div className="app-shell"><header className="site-header"><button type="button" className="brand-button" onClick={leaveRoom}><Wordmark /></button><div className="header-note"><span className="live-dot" /> {room ? `Room ${room.game.roomCode}` : "Live auction studio"}</div></header>
    {!room ? <Lobby onHost={(challengeId) => void run({ action: "create", challengeId })} onJoin={(roomCode) => void run({ action: "join", roomCode })} busy={busy} error={error} /> : roomGame.phase === "WAITING_FOR_PLAYER" ? <WaitingRoom room={room} onCopy={() => void navigator.clipboard?.writeText(room.game.roomCode)} /> : roomGame.phase === "FINISHED" ? <FinalResults state={roomGame} onLeave={leaveRoom} /> : <div className="game-layout" style={{ "--accent": roomGame.challenge.accent } as CSSProperties}><section className="game-bar"><div><span className="eyebrow">{roomGame.challenge.kicker} · you are {PLAYER_NAMES[room.session.player]}</span><h2>Build the best {roomGame.challenge.name.replace("Best ", "").toLowerCase()}</h2></div><div className="room-live-status"><span className="live-dot" /> Both players connected</div></section>{error ? <p className="error-message game-error">{error}</p> : null}<div className="game-grid"><CreationBoard state={roomGame} player="one" />{roomGame.phase === "AUCTION_OPEN" ? <LiveBidding key={`${roomGame.currentItem?.id}-${room.session.player}`} state={roomGame} session={room.session} busy={busy} onBid={() => void run({ action: "bid", roomCode: room.session.roomCode, token: room.session.token, amount: (roomGame.currentBid?.amount ?? 0) + 1 })} onConcede={() => void run({ action: "concede", roomCode: room.session.roomCode, token: room.session.token })} /> : <RoundReveal state={roomGame} busy={busy} onNext={() => void run({ action: "next", roomCode: room.session.roomCode, token: room.session.token })} />}<CreationBoard state={roomGame} player="two" /></div></div>}
  </div>;
}
