import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession } from '../docs/src/game/setup.js';

const setup = (names = ['Alice', 'Bob'], overrides = {}) => createSession({ names, startingStack: 1000, smallBlind: 5, bigBlind: 10, dealer: 0, ...overrides });
test('valid tables retain stable seats and conserve initial chips', () => {
  for (const n of [2, 3, 9]) {
    const session = setup(Array.from({ length: n }, (_, i) => `Player ${i}`));
    assert.equal(session.players.reduce((total, p) => total + p.stack, 0), session.startingTotal);
    assert.deepEqual(session.players.map(p => p.id), Array.from({ length: n }, (_, i) => i));
  }
});
test('invalid setup is rejected', () => {
  for (const run of [
    () => setup(['Alice', ' alice ']), () => setup(['Alice', ' ']),
    () => setup(['Alice']), () => setup(Array(10).fill('Alice')),
    () => setup(undefined, { smallBlind: 0 }), () => setup(undefined, { bigBlind: 9 }),
    () => setup(undefined, { bigBlind: 1001 }), () => setup(undefined, { startingStack: 10.5 }),
    () => setup(undefined, { startingStack: Number.MAX_SAFE_INTEGER }),
    () => setup(undefined, { dealer: 2 }),
  ]) assert.throws(run);
});
