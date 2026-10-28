# Proposal

## Why

A physical Texas Hold'em game needs a simple shared screen to replace manual chip accounting and keep players aligned on turns, bets, and street progression. A small browser proof of concept can demonstrate this flow while making input mistakes easy to reverse.

## What Changes

- Add setup for 2–9 named players, equal starting chip stacks, blind amounts, and the initial dealer.
- Track no-limit betting, blinds, action order, checks, calls, folds, raises, all-ins, street completion, and dealer rotation.
- Prompt the physical dealer to reveal the flop, turn, and river; cards remain outside the app.
- Track each player's stack, current street bet, total hand contribution, the pot, and side pots.
- Allow manual winner selection, including ties, a preview before payout, and correction of a payout before the next hand. Provide undo for other hand-entry mistakes.
- Present a responsive green round table with visible turn and role markers, clear legal actions, and lightweight animations.
- Deliver plain static HTML, CSS, and JavaScript suitable for GitHub Pages and save the active session on the same device across refreshes.
- Verify the complete interaction and accounting flows plus desktop and mobile presentation using Playwright.

## Capabilities

### New Capabilities

- `game-setup`: Configure and begin a local chip-tracking session.
- `holdem-hand-management`: Manage blinds, betting, streets, eligibility, and chip accounting.
- `pot-settlement`: Select and correct winners and distribute main and side pots, including split wins.
- `poker-table-interface`: Show a readable table, action controls, reveal prompts, and accessible animations.

### Modified Capabilities

None; this repository has no existing capability specs.

## Impact

The repository currently contains OpenSpec configuration and skills only. Implementation will introduce a standalone static HTML/CSS/JavaScript app, domain tests, Playwright browser tests, and GitHub Pages deployment instructions. No application server, frontend framework, or production build is required. Session state is stored locally in the phone's browser; there are no accounts, cross-device synchronization, network multiplayer, card dealing, hand evaluation, real-money handling, or tournament features. The proof of concept uses integer chip units and fixed blinds. Publishing remains a separate action once a GitHub repository and deployment target are available.
