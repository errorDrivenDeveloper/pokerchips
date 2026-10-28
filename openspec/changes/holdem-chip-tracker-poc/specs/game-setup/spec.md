# Spec Delta

## Purpose

Let a group configure a shared local session for tracking chips during a physical Texas Hold'em game.

## ADDED Requirements

### Requirement: Configure a session
The app SHALL accept 2–9 players in seat order, a nonempty name for each, an equal positive integer starting stack, positive integer small and big blinds, and an initial dealer. The big blind MUST be at least twice the small blind and no larger than the starting stack. Defaults SHALL be 1000 starting chips and blinds of 5/10. All chip inputs and the session total MUST be safe integers. Names SHALL be unique after trimming and case normalization.

#### Scenario: Start a valid session
- **WHEN** the operator starts a session with Alice, Bob, and Cara, 1000 chips each, blinds 5/10, and Alice as dealer
- **THEN** the first hand starts with Bob posting 5, Cara posting 10, and Alice acting first
- **AND** total stacks plus committed chips equal 3000

#### Scenario: Invalid setup
- **WHEN** setup contains duplicate or blank names, an unsupported player count, fractional or unsafe chip values, or invalid blinds
- **THEN** starting the session is blocked with a field-specific explanation and entered values are preserved

### Requirement: Local physical-game operation
The app SHALL operate on one shared browser screen without accounts or an application server and SHALL leave card dealing, card visibility, and hand ranking to the physical game. Starting a new session SHALL require confirmation when a session already exists.

#### Scenario: Begin another session
- **WHEN** the operator cancels the new-session confirmation
- **THEN** the existing session and all chip totals remain unchanged

### Requirement: Static hosting and local recovery
The app SHALL consist of static HTML, CSS, and JavaScript that can be hosted under a GitHub Pages repository subpath without application-server endpoints. It SHALL save accepted game changes in the current browser and restore the active hand, correction baseline, and undo history after reload. Saved data SHALL remain device/browser-local. Unavailable storage or invalid saved data SHALL show an explanation without crashing; unavailable storage SHALL allow continued play in memory, and invalid saved data SHALL require an explicit reset before replacement.

#### Scenario: Resume on a phone
- **WHEN** the operator reloads the page after a turn bet on the same browser with storage available
- **THEN** the same actor, street, contributions, stacks, and correction controls are restored

#### Scenario: GitHub Pages project URL
- **WHEN** the app is opened at a repository subpath on static hosting
- **THEN** assets load and a game can be set up and played without calls to an application API

#### Scenario: Storage cannot be used
- **WHEN** browser storage is unavailable or a save fails
- **THEN** an explanation says refresh recovery is unavailable and the current game remains playable in memory

#### Scenario: Invalid saved session
- **WHEN** stored data is malformed or uses an unsupported version
- **THEN** the app offers an explicit reset and does not silently overwrite the saved data
