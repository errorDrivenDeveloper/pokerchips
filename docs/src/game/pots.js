/** Return unmatched chips and build side-pot layers from committed amounts. */
export function derivePots(players) {
  const contributions = players.map(p => p.contribution);
  if (contributions.some(n => !Number.isSafeInteger(n) || n < 0)) throw new Error('Invalid contribution');
  const ordered = [...contributions].sort((a, b) => b - a);
  const returned = players.map(() => 0);
  if (ordered[0] > (ordered[1] || 0)) {
    const i = contributions.indexOf(ordered[0]);
    returned[i] = ordered[0] - (ordered[1] || 0);
    contributions[i] -= returned[i];
  }
  const levels = [...new Set(contributions.filter(n => n > 0))].sort((a, b) => a - b);
  let previous = 0;
  const pots = [];
  levels.forEach(level => {
    const covering = players.filter((_, i) => contributions[i] >= level);
    const pot = { amount: (level - previous) * covering.length, eligible: covering.filter(p => !p.folded).map(p => p.id) };
    previous = level;
    // Folded players contribute dead money but cannot create a new group of
    // eligible winners. Adjacent layers with the same eligibility are one pot.
    const prior = pots.at(-1);
    if (prior && prior.eligible.length === pot.eligible.length && prior.eligible.every((id, i) => id === pot.eligible[i])) {
      prior.amount += pot.amount;
    } else {
      pots.push(pot);
    }
  });
  return { pots, returned };
}

/** Preview pot awards without changing any balances. */
export function previewAwards(pots, selections, seatIds, dealerId) {
  const dealer = seatIds.indexOf(dealerId);
  if (dealer < 0) throw new Error('Invalid dealer');
  const order = [...seatIds.slice(dealer + 1), ...seatIds.slice(0, dealer + 1)];
  const awards = Object.fromEntries(seatIds.map(id => [id, 0]));
  for (let i = 0; i < pots.length; i++) {
    const pot = pots[i];
    const chosen = pot.eligible.length === 1 ? pot.eligible : (selections[i] || []);
    if (!chosen.length) throw new Error('Select a winner for each pot.');
    if (new Set(chosen).size !== chosen.length || chosen.some(id => !pot.eligible.includes(id) || !seatIds.includes(id))) throw new Error('Invalid winner selection.');
    const sorted = order.filter(id => chosen.includes(id));
    const share = Math.floor(pot.amount / sorted.length);
    const remainder = pot.amount % sorted.length;
    sorted.forEach((id, position) => { awards[id] += share + (position < remainder ? 1 : 0); });
  }
  return awards;
}
