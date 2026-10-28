import { derivePots, previewAwards } from './pots.js';

const copy = x => structuredClone(x);
const active = p => !p.folded && p.stack > 0;
const next = (s, from, predicate) => {
  for (let i = 1; i <= s.players.length; i++) {
    const p = s.players[(from + i) % s.players.length];
    if (predicate(p)) return p.id;
  }
  return null;
};
const snapshot = s => { const x = copy(s); delete x.history; return x; };
const save = s => { s.history.push(snapshot(s)); };
const pay = (p, amount) => { p.stack -= amount; p.bet += amount; p.contribution += amount; };
const contenders = s => s.players.filter(p => !p.folded && p.inHand);

export function startHand(session, rotate = false) {
  const s = copy(session);
  const funded = s.players.filter(p => p.stack > 0);
  if (funded.length < 2) { s.phase = 'complete'; s.winner = funded[0]?.id ?? null; return s; }
  if (rotate || !s.players[s.dealer].stack) s.dealer = next(s, s.dealer, p => p.stack > 0);
  s.players.forEach(p => Object.assign(p, { inHand: p.stack > 0, folded: p.stack === 0, bet: 0, contribution: 0, lastAction: null }));
  s.handNumber++; s.street = 'preflop'; s.phase = 'betting'; s.history = []; s.pots = []; s.selections = [];
  s.small = funded.length === 2 ? s.dealer : next(s, s.dealer, p => p.inHand);
  s.big = next(s, s.small, p => p.inHand);
  pay(s.players[s.small], Math.min(s.smallBlind, s.players[s.small].stack));
  pay(s.players[s.big], Math.min(s.bigBlind, s.players[s.big].stack));
  s.target = s.bigBlind; s.raiseSize = s.bigBlind;
  s.pending = s.players.filter(active).map(p => p.id);
  s.actor = next(s, s.big, p => s.pending.includes(p.id));
  closeIfReady(s);
  return s;
}
function closeIfReady(s) {
  if (contenders(s).length === 1) { prepareSettlement(s); return; }
  const able = s.players.filter(p => p.inHand && active(p));
  if (able.length <= 1 && (able.length === 0 || able[0].bet >= s.target)) s.pending = [];
  if (!s.pending.length) {
    s.actor = null;
    if (s.street === 'river') prepareSettlement(s);
    else s.phase = 'reveal';
  }
}
function prepareSettlement(s) {
  const { pots, returned } = derivePots(s.players);
  s.players.forEach((p, i) => { p.stack += returned[i]; p.contribution -= returned[i]; });
  s.pots = pots; s.selections = pots.map(() => []); s.phase = 'showdown'; s.actor = null;
  s.baseline = s.players.map(p => p.stack);
}
export function act(state, type, amount) {
  if (state.phase !== 'betting' || state.actor == null) throw new Error('No player can act now.');
  const s = copy(state), p = s.players[s.actor], owed = Math.max(0, s.target - p.bet);
  if (!['fold','check','call','raise','allin'].includes(type)) throw new Error('Unknown action.');
  if (type === 'check' && owed) throw new Error('You must call or fold.');
  if (type === 'call' && !owed) throw new Error('Nothing to call.');
  let total = p.bet;
  if (type === 'call') total += Math.min(owed, p.stack);
  if (type === 'raise') total = Number(amount);
  if (type === 'allin') total += p.stack;
  if (!Number.isSafeInteger(total) || total < p.bet || total > p.bet + p.stack) throw new Error('Enter a valid total bet.');
  if (['raise','allin'].includes(type)) {
    if (type === 'raise' && total <= s.target) throw new Error('Raise must exceed the current bet.');
    if (total > s.target) {
      if (p.lastAction !== null && s.target - p.lastAction < s.raiseSize) throw new Error('A short all-in has not reopened raising.');
      if (total - s.target < s.raiseSize && total !== p.bet + p.stack) throw new Error(`Minimum raise is ${s.target + s.raiseSize}.`);
    } else if (type === 'raise') throw new Error('Raise must exceed the current bet.');
  }
  save(s);
  if (type === 'fold') p.folded = true;
  else pay(p, total - p.bet);
  s.pending = s.pending.filter(id => id !== p.id);
  if (total > s.target) {
    const increase = total - s.target;
    s.target = total;
    if (increase >= s.raiseSize) { s.raiseSize = increase; s.pending = s.players.filter(q => q.id !== p.id && q.inHand && active(q)).map(q => q.id); }
    else s.pending = s.players.filter(q => q.id !== p.id && q.inHand && active(q) && (s.pending.includes(q.id) || q.bet < s.target)).map(q => q.id);
  }
  p.lastAction = s.target;
  s.actor = next(s, p.id, q => s.pending.includes(q.id));
  closeIfReady(s);
  return s;
}
export function reveal(state) {
  if (state.phase !== 'reveal') throw new Error('No cards to reveal.');
  const s = copy(state); save(s);
  s.street = ({ preflop:'flop', flop:'turn', turn:'river' })[s.street];
  s.players.forEach(p => { p.bet = 0; p.lastAction = null; });
  s.target = 0; s.raiseSize = s.bigBlind; s.phase = 'betting';
  s.pending = s.players.filter(p => p.inHand && active(p)).map(p => p.id);
  s.actor = next(s, s.dealer, p => s.pending.includes(p.id));
  closeIfReady(s); return s;
}
export function undo(state) {
  if (!state.history?.length || state.phase === 'settled') throw new Error('Nothing to undo.');
  const history = copy(state.history); const previous = history.pop(); previous.history = history; return previous;
}
export function toggleWinner(state, pot, id) {
  if (state.phase !== 'showdown' || !state.pots[pot]?.eligible.includes(id) || state.pots[pot].eligible.length < 2) throw new Error('Invalid winner.');
  const s = copy(state), choices = s.selections[pot];
  s.selections[pot] = choices.includes(id) ? choices.filter(x => x !== id) : [...choices, id]; return s;
}
export function settle(state) {
  if (state.phase !== 'showdown') throw new Error('Payout is not available.');
  const s = copy(state); s.awards = previewAwards(s.pots, s.selections, s.players.map(p => p.id), s.dealer);
  s.players.forEach((p, i) => { p.stack = s.baseline[i] + s.awards[p.id]; });
  s.phase = 'settled'; return s;
}
export function editWinners(state) {
  if (state.phase !== 'settled') throw new Error('No payout to edit.');
  const s = copy(state); s.players.forEach((p, i) => { p.stack = s.baseline[i]; }); s.phase = 'showdown'; return s;
}
