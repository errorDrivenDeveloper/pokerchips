# Tasks

## 1. Static app foundation

- [x] 1.1 Create docs/index.html, docs/styles.css, native modules under docs/src/, and docs/.nojekyll; verify relative assets load from both / and /poker/ using a development static server.
- [x] 1.2 Add development-only package scripts for static serving, Node domain tests, and Playwright with desktop Chromium and mobile WebKit; verify installation and browser startup without a production build.

## 2. Setup and betting engine

- [x] 2.1 Implement session setup, input validation, stable seat IDs, and integer chip conservation; verify tests cover valid 2/3/9-player setups, duplicate names, invalid blinds, and unsafe or fractional values.
- [x] 2.2 Implement blind posting, nominal bring-in, heads-up order, dealer rotation, and skipping busted seats; verify short blind, heads-up, next-hand, and session-complete domain fixtures.
- [ ] 2.3 Implement fold/check/call/bet/raise/all-in actions, total-street amount semantics, pending responders, minimum raises, and reopening rights; verify big-blind option, rejected actions, short calls, full raises, and single/cumulative short all-ins with conserved balances.
- [ ] 2.4 Implement street closure, explicit flop/turn/river reveal confirmation, all-in runouts, and early fold wins; verify exact street/actor sequences and that reveals cannot be skipped or triggered early.
- [ ] 2.5 Add per-hand undo snapshots for accepted actions and reveals; verify reversing a fold, bet, and reveal restores balances, action rights, actor, and phase, and that a new hand clears history.

## 3. Settlement and corrections

- [x] 3.1 Derive uncalled returns, main/side pots, and eligible players; verify 50/100/100 produces pots of 150 and 100, folded chips remain included, and a 100-versus-40 fold win returns 60 and awards 80.
- [ ] 3.2 Implement independent winner toggles, payout preview, integer ties, and clockwise odd-chip assignment; verify deselection, empty-selection rejection, ineligible-winner rejection, and a 15-chip split of 8/7.
- [ ] 3.3 Implement single-application payout, Edit winners from a pre-payout baseline, and next-hand finalization; verify replacing a paid winner restores the old award, repeated confirmation cannot duplicate chips, and prior-hand correction is unavailable after advancing.

## 4. Browser interface and recovery

- [ ] 4.1 Build the setup form with defaults, player names/count, initial dealer, stack/blind fields, errors, and new-session confirmation; verify valid setup starts a game and cancelling replacement preserves it.
- [ ] 4.2 Build the green round table, role/status badges, pot/side-pot information, street and hand labels, stacks, street bets, and hand contributions; verify readable 2/3/9-player layouts at 1440×900 and 390×844.
- [ ] 4.3 Connect legal action controls, incremental costs, total-street amount entry, call/minimum/maximum labels, undo, and reveal prompts to the engine; verify controls reflect each actor and cannot bypass validation.
- [ ] 4.4 Build accessible per-pot winner selection, payout previews, hand summary, Edit winners, and Next hand; verify keyboard selection/deselection, visible focus, announced selection state, and correction before and after payout.
- [ ] 4.5 Add lightweight chip/pot and street animations plus reduced-motion styling; verify text updates immediately and actions do not depend on animation completion.
- [ ] 4.6 Persist and validate versioned session state, undo history, selections, and payout baseline; verify reload during betting and after payout retains correct recovery controls, unavailable storage allows play with an explanation, and invalid saves require explicit reset.

## 5. Playwright acceptance and delivery

- [ ] 5.1 Add and run browser flows from setup through all streets, showdown, split payout, correction, and the next hand; verify visible balances, turn order, dealer rotation, reveal prompts, and conserved session totals using real controls.
- [ ] 5.2 Add and run browser cases for all-ins and side pots, early fold wins, illegal bets, undo, repeat confirmation, and reload followed by winner correction; verify the numeric outcomes from the corresponding specs.
- [ ] 5.3 Run desktop Chromium and mobile WebKit UI checks, including nine players, keyboard winner correction, reduced motion, and /poker/ hosting; capture and visually inspect screenshots for setup, betting, reveal, showdown, and settlement, fixing overflow, overlap, or inaccessible controls.
- [ ] 5.4 Write README instructions for local testing, branch-based GitHub Pages publication from /docs, opening the URL on a phone, physical-card operation, device-local saves, and correction limits; verify documented commands and static directory contents, and record actual test results and screenshot locations. Publication itself awaits a GitHub target and a request to publish.
