/** Validate a new table before creating any chip balances. */
export function createSession({ names, startingStack, smallBlind, bigBlind, dealer }) {
  if (!Array.isArray(names) || names.length < 2 || names.length > 9) throw new Error('Choose between 2 and 9 players.');
  if (names.some(name => typeof name !== 'string' || !name.trim())) throw new Error('Each player needs a name.');
  const trimmed = names.map(name => name.trim());
  if (new Set(trimmed.map(name => name.toLocaleLowerCase())).size !== trimmed.length) throw new Error('Player names must be unique.');
  if (!Number.isSafeInteger(startingStack) || startingStack <= 0 || !Number.isSafeInteger(startingStack * names.length)) throw new Error('Starting chips and total chips must be positive safe integers.');
  if (!Number.isSafeInteger(smallBlind) || smallBlind <= 0) throw new Error('Small blind must be a positive integer.');
  if (!Number.isSafeInteger(bigBlind) || bigBlind < smallBlind * 2 || bigBlind > startingStack) throw new Error('Big blind must be at least twice the small blind and no larger than the starting stack.');
  if (!Number.isInteger(dealer) || dealer < 0 || dealer >= names.length) throw new Error('Choose a valid dealer.');
  return {
    version: 1,
    players: trimmed.map((name, id) => ({ id, name, stack: startingStack })),
    startingTotal: startingStack * names.length,
    smallBlind, bigBlind, dealer, handNumber: 0,
  };
}
