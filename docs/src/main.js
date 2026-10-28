import { createSession } from './game/setup.js';
import { startHand, act, reveal, undo, toggleWinner, settle, editWinners } from './game/hand.js';
import { previewAwards } from './game/pots.js';
import { translate, translateDOM } from './i18n.js';

const root = document.querySelector('#app');
const key = 'poker-chip-tracker-v1';
const languageKey = 'poker-chip-tracker-language';
let language = 'en';
try { if (localStorage.getItem(languageKey) === 'de') language = 'de'; } catch {}
const languageButton = () => `<button type="button" class="language-button" data-action="language" aria-label="${language === 'de' ? 'Switch language to English' : 'Sprache auf Deutsch wechseln'}">${language === 'de' ? 'EN' : 'DE'}</button>`;
let state = null, storageWarning = '', badSave = false, showReset = false, error = '', names = ['Alice','Bob','Cara'], draft = { stack: '500', small: '10', big: '20', dealer: '0' }, newlyDealt = [];
const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
try {
  const raw = localStorage.getItem(key);
  if (raw) {
    const candidate = JSON.parse(raw);
    if (candidate.version !== 1 || !Array.isArray(candidate.players) || !Array.isArray(candidate.history) || !Number.isSafeInteger(candidate.startingTotal)) throw new Error('Invalid save');
    state = candidate;
  }
} catch (e) { if (e instanceof SyntaxError || e.message === 'Invalid save') badSave = true; else storageWarning = 'Saving is unavailable. Refresh recovery is disabled.'; }
function persist() { try { if (state && !badSave) localStorage.setItem(key, JSON.stringify(state)); } catch { storageWarning = 'Saving is unavailable. Refresh recovery is disabled.'; } }
function setup() {
 return `<div class="setup card">${languageButton()}<div class="eyebrow">A LITTLE HELP FOR YOUR HOME GAME</div><h1>Bring everyone<br>to the table<span class="gold">.</span></h1><p>Track the chips. Play the cards in real life.</p><form id="setup-form"><div class="section-title">THE PLAYERS <span>2–9 seats</span></div><div class="player-inputs">${names.map((n,i)=>`<label>Player ${i+1}<input name="player" value="${escape(n)}" required maxlength="40"></label>`).join('')}</div><div class="row"><button type="button" data-action="add">+ Add player</button><button type="button" data-action="remove">− Remove player</button></div><div class="section-title">THE GAME</div><div class="grid"><label>Starting chips<input type="number" name="stack" value="${escape(draft.stack)}" min="1" required></label><label>Small blind<input type="number" name="small" value="${escape(draft.small)}" min="1" required></label><label>Big blind<input type="number" name="big" value="${escape(draft.big)}" min="1" required></label><label>First dealer<select name="dealer">${names.map((n,i)=>`<option value="${i}" ${String(i)===draft.dealer?'selected':''}>${escape(n || `Player ${i+1}`)}</option>`).join('')}</select></label></div><button class="primary wide" type="submit">Start the game <span>→</span></button></form></div>`;
}
const name = id => escape(state.players[id]?.name ?? '');
const boardSize = street => ({ preflop: 0, flop: 3, turn: 4, river: 5 })[street] ?? 0;
function board(street) {
 const count = boardSize(street);
 return `<div class="board" aria-label="${count} community cards revealed">${Array.from({length: 5}, (_, i) => `<span class="board-card ${i < count ? 'dealt' : 'empty'} ${newlyDealt.includes(i) ? 'dealing' : ''}" style="--deal-order:${newlyDealt.indexOf(i)}" aria-hidden="true">${i < count ? '<span>◆</span>' : ''}</span>`).join('')}</div>`;
}
// The visual breakdown uses common denominations; counts describe the pot value,
// not an inventory of the physical chips on the table.
const denominations = [
 { value: 1000, color: 'gold' }, { value: 500, color: 'purple' },
 { value: 100, color: 'black' }, { value: 25, color: 'green' },
 { value: 10, color: 'blue' }, { value: 5, color: 'red' }, { value: 1, color: 'white' },
];
function potChips(amount, owner = 'Pot') {
 let remainder = amount;
 const stacks = denominations.flatMap(({value, color}) => {
  const count = Math.floor(remainder / value);
  remainder %= value;
  if (!count) return [];
  const shown = Math.min(count, 4);
  return [{ value, color, count, shown }];
 });
 const description = stacks.map(({count, value, color}) => `${count} ${color} ${value}-chip${count === 1 ? '' : 's'}`).join(', ');
 return `<div class="pot-chips ${owner === 'Pot' ? '' : 'player-chips'}" role="img" aria-label="${escape(description ? `${owner} breakdown: ${description}` : `${owner} is empty`)}">${stacks.map(({value, color, count, shown}) => `<div class="pot-stack" title="${count} × ${value} (${color})"><span class="pot-stack-pile">${Array.from({length:shown}, () => `<i class="pot-chip chip-${color}"></i>`).join('')}</span><span class="pot-chip-label">${count}×${value}</span></div>`).join('')}</div>`;
}
function animateBet(origin, actor) {
 if (!origin || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
 const destination = root.querySelector('.pot');
 if (!destination) return;
 const target = destination.getBoundingClientRect();
 const chip = document.createElement('div');
 chip.className = 'flying-chip';
 chip.setAttribute('aria-hidden', 'true');
 chip.style.left = `${origin.left + origin.width / 2}px`;
 chip.style.top = `${origin.top + origin.height / 2}px`;
 chip.dataset.actor = actor;
 document.body.append(chip);
 const dx = target.left + target.width / 2 - (origin.left + origin.width / 2);
 const dy = target.top + target.height / 2 - (origin.top + origin.height / 2);
 const animation = chip.animate([
  { transform: 'translate(-50%, -50%) scale(.85)', opacity: 1 },
  { transform: `translate(calc(-50% + ${dx * .5}px), calc(-50% + ${dy * .5 - 24}px)) scale(1.15)`, opacity: 1, offset: .5 },
  { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.5)`, opacity: 0 }
 ], { duration: 650, easing: 'ease-in-out' });
 animation.finished.catch(() => {}).finally(() => chip.remove());
}

function animatePayout(origin, awards) {
 if (!origin || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
 const fromX = origin.left + origin.width / 2, fromY = origin.top + origin.height / 2;
 const winners = Object.entries(awards).filter(([, amount]) => amount > 0);
 if (!winners.length) return;
 const celebration = document.createElement('div');
 celebration.className = 'win-celebration';
 celebration.setAttribute('aria-hidden', 'true');
 const winnersText = winners.map(([id, amount]) => `${name(Number(id))} +${amount}`).join(' · ');
 celebration.innerHTML = `<div class="win-banner"><span>✦ &nbsp; ${language === 'de' ? (winners.length > 1 ? 'GEWINNER' : 'GEWINNER') : (winners.length > 1 ? 'WINNERS' : 'WINNER')} &nbsp; ✦</span><strong>${winnersText}</strong></div>${Array.from({length: 32}, (_, i) => `<i class="confetti confetti-${i % 5}" style="--x:${5 + (i * 37) % 90}vw;--delay:${(i % 8) * 70}ms;--drift:${(i % 2 ? 1 : -1) * (25 + i % 5 * 12)}px;--spin:${i % 2 ? 1 : -1}turn"></i>`).join('')}`;
 document.body.append(celebration);
 setTimeout(() => celebration.remove(), 3200);
 Object.entries(awards).filter(([, amount]) => amount > 0).forEach(([id], winnerIndex) => {
  const seat = root.querySelector(`[data-seat="${id}"]`);
  if (!seat) return;
  const target = seat.getBoundingClientRect();
  const dx = target.left + target.width / 2 - fromX;
  const dy = target.top + target.height / 2 - fromY;
  seat.classList.add('celebrate-win');
  seat.addEventListener('animationend', () => seat.classList.remove('celebrate-win'), { once:true });
  for (let i = 0; i < 3; i++) {
   const chip = document.createElement('div');
   chip.className = `flying-chip payout-chip payout-chip-${i}`;
   chip.dataset.winner = id;
   chip.setAttribute('aria-hidden', 'true');
   chip.style.left = `${fromX}px`; chip.style.top = `${fromY}px`;
   document.body.append(chip);
   const spread = (i - 1) * 18;
   const animation = chip.animate([
    { transform:'translate(-50%, -50%) scale(.6)', opacity:0 },
    { transform:`translate(calc(-50% + ${dx * .5 + spread}px), calc(-50% + ${dy * .5 - 32}px)) scale(1.1)`, opacity:1, offset:.45 },
    { transform:`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.65)`, opacity:0 }
   ], { duration:850, delay:winnerIndex * 100 + i * 90, easing:'ease-in-out' });
   animation.finished.catch(() => {}).finally(() => chip.remove());
  }
 });
}

function game() {
 const s=state, pot=s.players.reduce((n,p)=>n+p.contribution,0), p=s.players[s.actor], owed=p?Math.max(0,s.target-p.bet):0;
 let panel='';
 if(s.phase==='betting') {
  const raiseAllowed = p.lastAction === null || s.target-p.lastAction>=s.raiseSize;
  panel=`<div class="eyebrow">ACTION ON</div><h2>${name(p.id)} <span class="muted">· ${s.street}</span></h2><p>${owed ? `To call <strong>${Math.min(owed,p.stack)}</strong> chips` : 'No chips to call'}</p><div class="actions"><button data-action="fold">Fold</button>${owed?`<button data-action="call">Call ${Math.min(owed,p.stack)}</button>`:'<button data-action="check">Check</button>'}<button data-action="allin">All in ${p.stack}</button></div><form id="raise-form"><label>Total bet this street <input name="amount" type="number" min="1" max="${p.bet+p.stack}" value="${Math.min(p.bet+p.stack,s.target+s.raiseSize)}"></label><small>Minimum raise to ${s.target+s.raiseSize} · Maximum ${p.bet+p.stack} · Added chips shown when entered</small><output id="cost"></output><button class="primary" ${!raiseAllowed?'disabled':''}>${s.target?'Raise':'Bet'}</button>${!raiseAllowed?'<small>Raising has not reopened after a short all-in.</small>':''}</form>`;
 } else if(s.phase==='reveal') { const next={preflop:['flop',3],flop:['turn',1],turn:['river',1]}[s.street]; panel=`<div class="eyebrow">DEALER, IT’S YOUR TURN</div><h2>Reveal the ${next[0]}</h2><p>Place ${next[1]} ${next[1]===1?'card':'cards'} on the table.</p><button class="primary" data-action="reveal">${next[0]} revealed →</button>`;
 } else if(s.phase==='showdown') {
  let preview; try {preview=previewAwards(s.pots,s.selections,s.players.map(p=>p.id),s.dealer);}catch{preview=null;}
  panel=`<div class="eyebrow">THE SHOWDOWN</div><h2>Who won?</h2><p>Select every winner for each pot. Select again to undo.</p>${s.pots.map((pot,i)=>`<div class="pot-choice"><strong>${i?'Side pot '+i:'Main pot'} · ${pot.amount} chips</strong><div class="actions">${pot.eligible.map(id=>`<button data-action="winner" data-pot="${i}" data-id="${id}" aria-pressed="${pot.eligible.length===1||s.selections[i].includes(id)}" ${pot.eligible.length===1?'disabled':''}>${name(id)}</button>`).join('')}</div></div>`).join('')}<p>${preview ? 'Payout: '+s.players.filter(p=>preview[p.id]).map(p=>`${name(p.id)} ${preview[p.id]}`).join(' · ') : 'Select at least one winner for each pot.'}</p><button class="primary" data-action="settle" ${preview?'':'disabled'}>Confirm payout</button>`;
 } else if(s.phase==='settled') panel=`<div class="eyebrow">HAND COMPLETE</div><h2>Chips are settled</h2><p>${s.players.filter(p=>s.awards[p.id]).map(p=>`${name(p.id)} won ${s.awards[p.id]}`).join(' · ')}</p><div class="actions"><button data-action="edit">Edit winners</button><button class="primary" data-action="next">Next hand →</button></div>`;
 else panel=`<div class="eyebrow">GAME COMPLETE</div><h2>${name(s.winner)} wins!</h2><p>Start a new session to play again.</p>`;
 return `<div class="shell"><header><div><div class="eyebrow">THE HOME GAME</div><h1>Chip<span class="gold">club.</span></h1></div><div class="header-actions">${languageButton()}<button data-action="new">⚙ Players &amp; chips / New game</button></div></header><div class="status"><span>HAND ${s.handNumber}</span><span>BLINDS ${s.smallBlind} / ${s.bigBlind}</span><span>${s.street.toUpperCase()}</span></div><div class="layout"><section class="table-area"><div class="table"><div class="felt"><span class="eyebrow">TOTAL POT</span><strong class="pot">${s.phase==='settled'?0:pot}</strong><span>CHIPS</span>${potChips(s.phase==='settled'?0:pot)}${board(s.street)}</div></div><div class="seats">${s.players.map(p=>`<article data-seat="${p.id}" class="seat ${s.actor===p.id?'current':''} ${p.folded?'folded':''}"><div class="seat-head"><strong>${name(p.id)}</strong><div>${p.id===s.dealer?'<b>D</b>':''}${p.id===s.small?'<b>SB</b>':''}${p.id===s.big?'<b>BB</b>':''}</div></div><div class="stack">${p.stack} <small>chips</small></div>${potChips(p.stack, `${p.name} stack`)}<div class="seat-meta">Bet ${p.bet} · Hand ${p.contribution}</div><div class="seat-meta">${s.actor===p.id?'YOUR TURN':p.folded?'Folded':p.stack===0?'All in':'In hand'}</div></article>`).join('')}</div></section><aside class="panel card">${panel}${s.history?.length&&s.phase!=='settled'?'<button class="undo" data-action="undo">↶ Undo last action</button>':''}</aside></div></div>`;
}
function render() { root.innerHTML=`${storageWarning?`<div role="alert" class="notice">${storageWarning}</div>`:''}${badSave?'<div class="card"><h1>Saved game unavailable</h1><p>The saved game is invalid or from an unsupported version.</p><button data-action="reset-save">Reset saved game</button></div>':state?game():setup()}${error?`<div class="error" role="alert">${escape(error)}</div>`:''}${showReset?'<div class="modal-backdrop"><section class="card reset-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title"><h2 id="reset-title">Start a new game?</h2><p>Your current game will be removed when you go back to setup.</p><div class="actions"><button data-action="cancel-new">Cancel</button><button class="primary" data-action="confirm-new">Go to setup</button></div></section></div>':''}`; document.documentElement.lang=language; translateDOM(root, language); }
function update(fn, effect) {
 try {
  const previous = state;
  const actor = previous?.actor;
  const origin = effect === 'bet' && actor != null ? root.querySelector(`[data-seat="${actor}"]`)?.getBoundingClientRect() : effect === 'payout' ? root.querySelector('.pot-chips')?.getBoundingClientRect() : null;
  const next = fn();
  newlyDealt = effect === 'reveal' ? Array.from({length: boardSize(next.street) - boardSize(previous.street)}, (_, i) => boardSize(previous.street) + i) : [];
  document.querySelector('.win-celebration')?.remove();
  state = next; error = ''; persist(); render();
  if (effect === 'bet' && actor != null && next.players[actor].stack < previous.players[actor].stack) animateBet(origin, actor);
  if (effect === 'payout') animatePayout(origin, next.awards);
  newlyDealt = [];
 } catch(e) { error=e.message; render(); }
}
root.addEventListener('input', e=>{ if(e.target.name==='player'){names=[...root.querySelectorAll('[name=player]')].map(x=>x.value); const select=root.querySelector('[name=dealer]'); if(select) [...select.options].forEach((option,i)=>option.textContent=names[i] || `Player ${i+1}`);} if(['stack','small','big','dealer'].includes(e.target.name)) draft[e.target.name]=e.target.value; if(e.target.name==='amount'&&state?.players[state.actor]) root.querySelector('#cost').textContent=translate(`Adds ${Math.max(0,Number(e.target.value)-state.players[state.actor].bet)} chips`, language); });
root.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target); if(e.target.id==='setup-form') {const values={names:f.getAll('player'),startingStack:Number(f.get('stack')),smallBlind:Number(f.get('small')),bigBlind:Number(f.get('big')),dealer:Number(f.get('dealer'))}; try {state=startHand(createSession(values)); error='';persist();render();window.scrollTo(0, 0);}catch(err){error=err.message; let old=root.querySelector('.error'); if(old)old.remove(); root.insertAdjacentHTML('beforeend',`<div class="error" role="alert">${escape(translate(error, language))}</div>`);} } else if(e.target.id==='raise-form') update(()=>act(state,'raise',f.get('amount')), 'bet');});
root.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action;if(a==='language'){language=language==='en'?'de':'en';try{localStorage.setItem(languageKey,language);}catch{}render();}else if(a==='add'||a==='remove'){if(a==='add'&&names.length<9)names.push('');if(a==='remove'&&names.length>2)names.pop();if(Number(draft.dealer)>=names.length)draft.dealer='0';render();}else if(a==='new'){showReset=true;render();root.querySelector('[data-action=cancel-new]').focus();}else if(a==='cancel-new'){showReset=false;render();root.querySelector('[data-action=new]')?.focus();}else if(a==='confirm-new'){names=state.players.map(player => player.name);state=null;showReset=false;try{localStorage.removeItem(key);}catch{storageWarning='Saving is unavailable. Refresh recovery is disabled.';}render();}else if(a==='reset-save'){try{localStorage.removeItem(key);badSave=false;render();}catch{storageWarning='Unable to reset saved game.';render();}}else if(['fold','check','call','allin'].includes(a))update(()=>act(state,a), 'bet');else if(a==='reveal')update(()=>reveal(state), 'reveal');else if(a==='undo')update(()=>undo(state));else if(a==='winner')update(()=>toggleWinner(state,Number(el.dataset.pot),Number(el.dataset.id)));else if(a==='settle')update(()=>settle(state), 'payout');else if(a==='edit')update(()=>editWinners(state));else if(a==='next')update(()=>startHand(state,true));});
render();
