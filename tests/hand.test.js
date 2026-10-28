import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession } from '../docs/src/game/setup.js';
import { startHand, act, reveal, undo, toggleWinner, settle, editWinners } from '../docs/src/game/hand.js';
const session = (names=['Alice','Bob','Cara']) => createSession({names,startingStack:1000,smallBlind:5,bigBlind:10,dealer:0});
const conserved = s => assert.equal(s.players.reduce((a,p)=>a+p.stack+(s.phase === 'settled' ? 0 : p.contribution),0),s.startingTotal);
test('blinds, big blind option, streets, undo and showdown correction', () => {
 let s=startHand(session()); assert.equal(s.actor,0); assert.deepEqual(s.players.map(p=>p.bet),[0,5,10]);
 s=act(s,'call'); s=act(s,'call'); assert.equal(s.actor,2); s=act(s,'check'); assert.equal(s.phase,'reveal');
 s=reveal(s); assert.equal(s.street,'flop'); assert.equal(s.actor,1); s=undo(s); assert.equal(s.phase,'reveal'); s=reveal(s);
 for (const street of ['flop','turn','river']) { assert.equal(s.street,street); for(let i=0;i<3;i++) s=act(s,'check'); if(street!=='river') s=reveal(s); }
 assert.equal(s.phase,'showdown'); conserved(s); s=toggleWinner(s,0,0); s=toggleWinner(s,0,1); s=settle(s); conserved(s);
 assert.deepEqual(s.players.map(p=>p.stack),[1005,1005,990]); assert.throws(()=>settle(s)); s=editWinners(s); s=toggleWinner(s,0,0); s=settle(s); assert.deepEqual(s.players.map(p=>p.stack),[990,1020,990]);
 s=startHand(s,true); assert.equal(s.dealer,1); assert.equal(s.history.length,0); conserved(s);
});
test('heads up and short blind',()=>{let x=session(['A','B']); x.players[1].stack=3; x.players[0].stack=1997; let s=startHand(x); assert.equal(s.small,0); assert.equal(s.big,1); assert.equal(s.target,10); assert.equal(s.actor,0); assert.equal(s.players[1].bet,3);});
test('illegal raise leaves original unchanged and fold can be undone',()=>{let s=startHand(session()); const before=structuredClone(s); assert.throws(()=>act(s,'raise',15)); assert.deepEqual(s,before); s=act(s,'fold'); s=undo(s); assert.deepEqual(s,before);});

test('all-in runout prompts each street and conserves chips',()=>{
 let x=session(['A','B']); x.players[0].stack=10; x.players[1].stack=1990;
 let s=startHand(x); s=act(s,'allin'); assert.equal(s.phase,'reveal');
 for(const expected of ['flop','turn','river']) { s=reveal(s); assert.equal(s.street,expected); }
 assert.equal(s.phase,'showdown'); conserved(s);
});
test('short raises do not reopen raising but cumulatively can reopen it',()=>{
 let x=session(['A','B','C','D']); x.players[1].stack=150; x.players[2].stack=200; x.players[0].stack=1550; x.players[3].stack=2100;
 let s=startHand(x); s=act(s,'raise',100); s=act(s,'call'); s=act(s,'allin'); s=act(s,'allin');
 assert.equal(s.actor,3); s=act(s,'call'); assert.equal(s.actor,0); assert.doesNotThrow(()=>act(s,'raise',300));
 let y=session(['A','B','C']); y.players[0].stack=150; y.players[1].stack=1400; y.players[2].stack=1450;
 s=startHand(y); s=act(s,'allin'); s=act(s,'call'); s=act(s,'raise',300);
 assert.equal(s.actor,1); assert.doesNotThrow(()=>act(s,'call')); 
});
test('dealer skips busted seats and completes with one funded player',()=>{
 let s=session(); s.players[1].stack=0; s.players[0].stack=2000; s=startHand(s,true); assert.equal(s.dealer,2); assert.equal(s.small,2); assert.equal(s.big,0);
 s.players[2].stack=0; s.players[0].stack=3000; s=startHand(s,true); assert.equal(s.phase,'complete'); assert.equal(s.winner,0);
});

test('heads up dealer acts first before flop and second on flop',()=>{
 let s=startHand(session(['A','B'])); assert.equal(s.actor,0); assert.equal(s.small,0); assert.equal(s.big,1);
 s=act(s,'call'); assert.equal(s.actor,1); s=act(s,'check'); s=reveal(s); assert.equal(s.actor,1);
});
test('short blind is posted only up to the remaining stack',()=>{
 let s=session(); s.players[1].stack=3; s.players[0].stack=1997; s=startHand(s); assert.equal(s.players[1].bet,3); assert.equal(s.players[1].stack,0); assert.equal(s.actor,0); conserved(s);
});
