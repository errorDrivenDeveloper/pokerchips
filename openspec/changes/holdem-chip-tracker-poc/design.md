# Design

## Context

The repository has OpenSpec scaffolding only: no app, package manifest, source, tests, or existing specs. The user confirmed that cards are physical and requested phone access through GitHub Pages. See proposal.md for motivation. This design is needed because betting, undo, persistence, and payout correction share a new state model.

## Goals / Non-Goals

**Goals:** Keep runtime delivery to static files; make accounting deterministic and independently testable; provide explicit physical-dealer steps; preserve a phone session across refreshes; make corrections safe before the next hand.

**Non-Goals:** A backend, cross-device state, simultaneous operators, a card engine, tournament rules, and offline-first installation. Direct opening with a file URL is not a deployment requirement; GitHub Pages serves the static files over HTTPS.

## Decisions

### 1. Plain HTML, CSS, and JavaScript with a small test toolchain

Use docs/index.html, docs/styles.css, and native JavaScript modules under docs/src/. Keep game logic in docs/src/game/, rendering and event delegation in docs/src/ui/, and persistence in docs/src/storage.js. Use relative asset/module URLs and no client-side routes, so both a domain root and /repository/ hosting work without rewrites. Use CSS for the table and chips; no generated images or asset service is needed.

Use Node's built-in test runner for the pure engine and Playwright for browser tests; package.json is development tooling only. A development static server can serve the same files tested for deployment. Prefer this over React/Vite because there is no existing stack and the user wants a simple page without an application server or build pipeline. A monolithic HTML file is possible, but separate modules make accounting review and tests easier while remaining ordinary static files.

### 2. One deterministic state machine owns every accepted change

Model setup, betting, awaiting-reveal, showdown, settled, and session-complete phases. Session data includes schema version, stable player IDs and seat order, initial chip total, blinds, dealer, and hand number. Hand data includes street, stacks, street commitments, hand contributions, folded/all-in flags, current actor, target, last full raise increment, pending actors, last-action targets, raise rights, pots, and selections. The transition function returns a new state or a validation error; rendering cannot change balances directly. User names are rendered as text.

Use integer chips and reject unsafe integer inputs/totals. During betting, pot equals the sum of hand contributions, which already contains street commitments. Settlement replaces committed chips with awards, without double counting the pot. Validate conservation and nonnegative balances at transition boundaries. Derive legal controls from the engine rather than duplicate rules in the UI.

Track pending responders rather than closing a street solely because commitments match; this preserves the big blind's option. Full raises reset responders. Short all-ins require responses from players below target and reopen raising only when cumulative increases faced reach the last full increment. Preserve the nominal big-blind bring-in when the blind is short. Skip folded and all-in actors. When no further betting is possible, progress through explicit physical-card reveal confirmations, never automatic timed advancement.

Alternative: ad hoc click handlers with mutable balances are smaller initially but make undo, short raises, and repeated payout confirmation difficult to reason about.

### 3. Derive pots by contribution levels

At settlement, return any uniquely unmatched contribution above the next-highest contribution. For each remaining distinct positive contribution threshold, create a layer equal to the difference from the previous threshold times the number of players covering it. Folded contributions fund layers but folded players are not eligible winners. Display the resulting main and side pots; allow independent winner toggles for every contested pot. Automatically award uncontested pots. Divide each pot with integer arithmetic and distribute remainder chips to winners clockwise from the seat left of the dealer.

Example: contributions 50/100/100 produce a 150 main pot and a 100 side pot. This small layer algorithm supports all-ins without external poker libraries or manual pot arithmetic.

### 4. Snapshots for undo and a stable settlement baseline

Store snapshots before accepted actions and reveal transitions within the current hand. Snapshots exclude their own history to avoid recursive growth. Keep a separate immutable pre-payout baseline with uncalled returns already applied; preview and confirmed awards are always computed from this baseline. Edit winners restores the baseline and selection draft; repeated confirmation in settled phase is a no-op or rejected. Undo is unavailable while settled until Edit winners reopens settlement. Starting the next hand clears prior-hand snapshots and payout correction state, then rotates among funded seats.

Alternative: reverse arithmetic commands consume less memory but are error-prone for folds, all-ins, returns, and changes in pot eligibility. The bounded session size makes snapshots acceptable for a proof of concept.

### 5. Versioned browser storage, separated from the engine

Persist the complete current session, undo snapshots, and settlement baseline after each accepted change. On load, validate schema version, shape, numeric bounds, references, and conservation before resuming. Catch storage access/write errors and show a persistent recovery-unavailable message while allowing in-memory play. Invalid or unsupported saves require an explicit reset; do not silently overwrite them. New-session confirmation replaces the saved session only after acceptance.

Browser storage is sufficient for one phone. IndexedDB and server storage add complexity without serving this scope. Clearing browser data removes the save; opening the URL on another phone starts an independent game.

### 6. Responsive table and explicit operator controls

Use a circular green felt table with a subtle rim, pot/street display at the center, and positioned seats on wide screens. At phone widths keep the round table prominent while using a compact arrangement and readable player list for up to nine seats. Put the current actor's controls below the table; permit vertical scrolling. Show amounts, role badges, and statuses with text. Label amount entry as the total bet on this street and show the incremental cost. Keep reveal, winner selection, payout summary, Edit winners, Undo, and Next hand as explicit phase-specific controls.

Use short CSS chip/pot and street transitions, disabled under prefers-reduced-motion. Domain changes happen immediately; animation completion never drives game state. Native buttons, labeled inputs, visible focus, and aria-pressed winner toggles support keyboard operation.

### 7. Static deployment and focused verification

Put the deployable app in docs/ and document publishing that directory through GitHub Pages from a branch, including docs/.nojekyll and relative assets. Keep Node dependencies and tests outside docs/. This requires no production build or custom CI. The repository is not currently a Git checkout and has no GitHub remote, so actual publication needs a target later. Do not create or publish a repository during this planning change.

Domain tests cover legal actions, heads-up ordering, short blinds, cumulative short raises, chip conservation, side pots, odd chips, undo, and payout idempotence. Playwright drives actual setup and action controls through full hands, correction, persistence, and the next hand. Use desktop Chromium and mobile WebKit projects; emulate a phone viewport and touch. Also serve the static files beneath /poker/ to catch project-subpath failures.

Capture and visually inspect screenshots at 1440×900 and 390×844 for setup, betting, reveal, showdown, and settlement, including nine players. Assert visible controls, no horizontal overflow/overlap, keyboard winner selection, and reduced-motion behavior. Record actual verification results and limitations in the README when implementing; no browser verification can be performed against an app in this planning-only change.

## Risks / Trade-offs

- Betting edge cases can corrupt an otherwise convincing demo → isolate the engine, use explicit responder/raise-right state, and verify numeric fixtures and conservation.
- A table can become crowded on a phone → provide a compact seat arrangement plus a full player list and inspect nine-player screenshots.
- Browser storage can be unavailable or cleared → show save failures, preserve in-memory play, validate loaded data, and describe device-local recovery.
- Static hosting does not synchronize phones → document one shared operator device and independent sessions on other devices.
- Winner correction is bounded by starting the next hand → make Next hand an explicit finalization step and keep Edit winners visible before it.

## Migration Plan

There is no existing application or stored data to migrate. Implement and test the static app locally, document Pages publication, then publish only when a repository target is available and publication is requested. Rollback consists of restoring the prior static files; unsupported saved-state versions must show the explicit reset flow rather than being interpreted with the wrong rules.
