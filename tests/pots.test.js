import { test } from 'node:test';
import assert from 'node:assert/strict';
import { derivePots } from '../docs/src/game/pots.js';

test('layers all-in contributions and excludes folded players from eligibility', () => {
  assert.deepEqual(derivePots([{id:0,contribution:50},{id:1,contribution:100},{id:2,contribution:100,folded:true}]), {
    returned:[0,0,0], pots:[{amount:150,eligible:[0,1]},{amount:100,eligible:[1]}],
  });
});
test('returns unmatched chips before awarding the remainder', () => {
  assert.deepEqual(derivePots([{id:0,contribution:100},{id:1,contribution:40,folded:true}]), {
    returned:[60,0], pots:[{amount:80,eligible:[0]}],
  });
});
test('all players are eligible when no one folded', () => {
  assert.deepEqual(derivePots([{id:0,contribution:50},{id:1,contribution:100},{id:2,contribution:100}]).pots,
    [{amount:150,eligible:[0,1,2]},{amount:100,eligible:[1,2]}]);
});

import { previewAwards } from '../docs/src/game/pots.js';
test('splits odd chips clockwise and supports replacement in the preview', () => {
  const pot = [{ amount: 15, eligible: [0, 1] }];
  assert.deepEqual(previewAwards(pot, [[0,1]], [0,1,2], 2), { 0:8, 1:7, 2:0 });
  assert.deepEqual(previewAwards(pot, [[1]], [0,1,2], 2), { 0:0, 1:15, 2:0 });
  assert.throws(() => previewAwards(pot, [[]], [0,1,2], 2));
  assert.throws(() => previewAwards(pot, [[2]], [0,1,2], 2));
});

test('folded contributions do not create a side pot when remaining players are equally eligible', () => {
  const result = derivePots([
    {id:0,contribution:100}, {id:1,contribution:20,folded:true}, {id:2,contribution:100},
  ]);
  assert.deepEqual(result, {returned:[0,0,0], pots:[{amount:220,eligible:[0,2]}]});
});
test('folded contributions merge into the appropriate pots with a genuine all-in', () => {
  const result = derivePots([
    {id:0,contribution:50}, {id:1,contribution:100}, {id:2,contribution:100},
    {id:3,contribution:20,folded:true}, {id:4,contribution:75,folded:true},
  ]);
  assert.deepEqual(result, {returned:[0,0,0,0,0], pots:[
    {amount:220,eligible:[0,1,2]}, {amount:125,eligible:[1,2]},
  ]});
});
