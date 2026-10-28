const exact = {
 'A LITTLE HELP FOR YOUR HOME GAME':'EINE KLEINE HILFE FÜR DEINE POKERRUNDE', 'Bring everyone':'Alle zusammen', 'to the table':'an den Tisch',
 'Track the chips. Play the cards in real life.':'Verwalte die Chips. Gespielt wird mit echten Karten.', 'THE PLAYERS':'DIE SPIELER', '2–9 seats':'2–9 Plätze',
 '+ Add player':'+ Spieler hinzufügen', '− Remove player':'− Spieler entfernen', 'THE GAME':'DAS SPIEL', 'Starting chips':'Startchips', 'Small blind':'Small Blind', 'Big blind':'Big Blind', 'First dealer':'Erster Dealer', 'Start the game':'Spiel starten',
 'THE HOME GAME':'DIE POKERRUNDE', '⚙ Players & chips / New game':'⚙ Spieler & Chips / Neues Spiel', 'ACTION ON':'AM ZUG', 'No chips to call':'Nichts zu bezahlen', 'To call':'Zum Mitgehen', 'chips':'Chips', 'CHIPS':'CHIPS',
 'Fold':'Passen', 'Check':'Schieben', 'Raise':'Erhöhen', 'Bet':'Setzen', 'Total bet this street':'Gesamteinsatz in dieser Setzrunde', 'Raising has not reopened after a short all-in.':'Nach einem kurzen All-in ist eine Erhöhung noch nicht wieder erlaubt.',
 'DEALER, IT’S YOUR TURN':'DEALER, DU BIST DRAN', 'THE SHOWDOWN':'SHOWDOWN', 'Who won?':'Wer hat gewonnen?', 'Select every winner for each pot. Select again to undo.':'Wähle für jeden Pot alle Gewinner. Erneut auswählen, um die Auswahl aufzuheben.',
 'Main pot':'Hauptpot', 'Confirm payout':'Auszahlung bestätigen', 'Select at least one winner for each pot.':'Wähle mindestens einen Gewinner für jeden Pot.', 'HAND COMPLETE':'RUNDE BEENDET', 'Chips are settled':'Chips ausgezahlt', 'Edit winners':'Gewinner ändern', 'Next hand':'Nächste Runde',
 'GAME COMPLETE':'SPIEL BEENDET', 'Start a new session to play again.':'Starte ein neues Spiel, um erneut zu spielen.', 'TOTAL POT':'GESAMTPOT', 'YOUR TURN':'DU BIST DRAN', 'Folded':'Gepasst', 'All in':'All-in', 'In hand':'Im Spiel', '↶ Undo last action':'↶ Letzte Aktion rückgängig',
 'Saved game unavailable':'Gespeichertes Spiel nicht verfügbar', 'The saved game is invalid or from an unsupported version.':'Das gespeicherte Spiel ist ungültig oder stammt aus einer nicht unterstützten Version.', 'Reset saved game':'Gespeichertes Spiel zurücksetzen', 'Start a new game?':'Neues Spiel starten?', 'Your current game will be removed when you go back to setup.':'Dein aktuelles Spiel wird beim Zurückkehren zur Einrichtung gelöscht.', 'Cancel':'Abbrechen', 'Go to setup':'Zur Einrichtung',
 'Saving is unavailable. Refresh recovery is disabled.':'Speichern nicht möglich. Nach dem Neuladen kann das Spiel nicht wiederhergestellt werden.', 'Unable to reset saved game.':'Das gespeicherte Spiel konnte nicht zurückgesetzt werden.',
 'Choose between 2 and 9 players.':'Wähle zwischen 2 und 9 Spielern.', 'Each player needs a name.':'Jeder Spieler braucht einen Namen.', 'Player names must be unique.':'Die Spielernamen müssen eindeutig sein.', 'Starting chips and total chips must be positive safe integers.':'Startchips und Gesamtzahl müssen positive ganze Zahlen sein.', 'Small blind must be a positive integer.':'Der Small Blind muss eine positive ganze Zahl sein.', 'Big blind must be at least twice the small blind and no larger than the starting stack.':'Der Big Blind muss mindestens doppelt so hoch wie der Small Blind und höchstens so hoch wie die Startchips sein.', 'Choose a valid dealer.':'Wähle einen gültigen Dealer.',
 'No player can act now.':'Zurzeit kann kein Spieler handeln.', 'Unknown action.':'Unbekannte Aktion.', 'You must call or fold.':'Du musst mitgehen oder passen.', 'Nothing to call.':'Es gibt nichts zum Mitgehen.', 'Enter a valid total bet.':'Gib einen gültigen Gesamteinsatz ein.', 'Raise must exceed the current bet.':'Die Erhöhung muss den aktuellen Einsatz übersteigen.', 'A short all-in has not reopened raising.':'Nach einem kurzen All-in ist eine Erhöhung noch nicht wieder erlaubt.', 'No cards to reveal.':'Es sind keine Karten aufzudecken.', 'Nothing to undo.':'Es gibt nichts rückgängig zu machen.', 'Invalid winner.':'Ungültiger Gewinner.', 'Payout is not available.':'Eine Auszahlung ist nicht möglich.', 'No payout to edit.':'Es gibt keine Auszahlung zu ändern.', 'Select a winner for each pot.':'Wähle für jeden Pot einen Gewinner.', 'Invalid winner selection.':'Ungültige Gewinnerauswahl.'
};
const patterns = [
 [/^· (preflop|flop|turn|river)$/i,(_,s)=>`· ${{preflop:'Preflop',flop:'Flop',turn:'Turn',river:'River'}[s.toLowerCase()]}`],
 [/^(preflop|flop|turn|river)$/i,(_,s)=>({preflop:'PREFLOP',flop:'FLOP',turn:'TURN',river:'RIVER'}[s.toLowerCase()])],
 [/^Next hand →$/,()=> 'Nächste Runde →'],
 [/^(flop|turn|river) revealed →$/i,(_,s)=>`${{flop:'Flop',turn:'Turn',river:'River'}[s.toLowerCase()]} aufgedeckt →`],
 [/^(.+) won (\d+)(?: · .+ won \d+)+$/, value=>value.split(' · ').map(part=>part.replace(/^(.*) won (\d+)$/, '$1 gewinnt $2')).join(' · ')],
 [/^Player (\d+)$/, (_,n)=>`Spieler ${n}`], [/^HAND (\d+)$/,(_,n)=>`RUNDE ${n}`], [/^BLINDS (.+)$/,(_,v)=>`BLINDS ${v}`],
 [/^Call (\d+)$/,(_,n)=>`Mitgehen ${n}`], [/^All in (\d+)$/,(_,n)=>`All-in ${n}`], [/^Side pot (\d+) · (\d+) chips$/,(_,n,v)=>`Nebenpot ${n} · ${v} Chips`], [/^Main pot · (\d+) chips$/,(_,v)=>`Hauptpot · ${v} Chips`],
 [/^Minimum raise to (\d+) · Maximum (\d+) · Added chips shown when entered$/,(_,min,max)=>`Mindesterhöhung auf ${min} · Maximum ${max} · Zusätzliche Chips werden bei der Eingabe angezeigt`],
 [/^Minimum raise is (\d+)\.$/,(_,n)=>`Mindesterhöhung: ${n}.`], [/^Adds (\d+) chips$/,(_,n)=>`Zusätzlich ${n} Chips`],
 [/^Reveal the (flop|turn|river)$/i,(_,s)=>`${{flop:'Flop',turn:'Turn',river:'River'}[s.toLowerCase()]} aufdecken`], [/^(flop|turn|river) revealed$/i,(_,s)=>`${{flop:'Flop',turn:'Turn',river:'River'}[s.toLowerCase()]} aufgedeckt`],
 [/^Place (\d+) (?:card|cards) on the table\.$/,(_,n)=>`Lege ${n} ${n==='1'?'Karte':'Karten'} auf den Tisch.`],
 [/^Bet (\d+) · Hand (\d+)$/,(_,bet,hand)=>`Einsatz ${bet} · Runde ${hand}`], [/^(.+) won (\d+)$/,(_,name,n)=>`${name} gewinnt ${n}`], [/^(.+) wins!$/,(_,name)=>`${name} gewinnt!`],
 [/^Payout: (.+)$/,(_,rest)=>`Auszahlung: ${rest}`], [/^(\d+) community cards revealed$/,(_,n)=>`${n} Gemeinschaftskarten aufgedeckt`],
 [/^(.+) breakdown: (.+)$/,(_,owner,breakdown)=>`${owner === 'Pot' ? 'Pot' : owner.replace(/ stack$/, ' Stack')} – Aufteilung: ${breakdown.replace(/\b(gold|purple|black|green|blue|red|white)\b/g, x=>({gold:'goldene',purple:'lila',black:'schwarze',green:'grüne',blue:'blaue',red:'rote',white:'weiße'}[x])).replace(/-chips?\b/g,'er-Chips')}`],
 [/^(.+) is empty$/,(_,owner)=>`${owner === 'Pot' ? 'Pot' : owner.replace(/ stack$/, ' Stack')} ist leer`]
];
export function translate(text, language) {
 if (language !== 'de') return text;
 const trimmed = text.trim();
 if (!trimmed) return text;
 let result = exact[trimmed];
 if (!result) for (const [pattern, replacement] of patterns) { if (pattern.test(trimmed)) { result = trimmed.replace(pattern, replacement); break; } }
 if (!result) return text;
 return text.replace(trimmed, result);
}
export function translateDOM(root, language) {
 if (language !== 'de') return;
 const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
 while (walker.nextNode()) {
  const node = walker.currentNode;
  if (node.parentElement.closest('.seat-head strong, [data-action="winner"], option, .pot-chip-label, .win-banner strong')) continue;
  node.nodeValue = translate(node.nodeValue, language);
 }
 root.querySelectorAll('[aria-label]').forEach(el => el.setAttribute('aria-label', translate(el.getAttribute('aria-label'), language)));
}
