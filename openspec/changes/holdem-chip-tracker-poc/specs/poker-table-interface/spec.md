# Spec Delta

## Purpose

Give players an immediately readable shared poker table with clear controls for physical-game chip tracking.

## ADDED Requirements

### Requirement: Table and game information
The main game view SHALL feature a prominent round green table, arranged player seats, the hand number and street, the total pot and any side pots, and a clear current actor indicator. Each seat SHALL show name, stack, current street bet, total hand contribution, dealer/blind markers, and folded or all-in status. The current actor's panel SHALL display the amount to call, legal actions, and minimum and maximum bet or raise totals. Turn information SHALL use text as well as color.

#### Scenario: Actor faces a bet
- **WHEN** Bob faces a target of 30 after committing 10
- **THEN** Bob is identified as the current actor and the call control displays 20, or the remaining stack if smaller
- **AND** every seat's bet and stack remain readable

### Requirement: Responsive and accessible controls
At viewport sizes 1440×900 and 390×844, setup, table information, betting, reveal prompts, and settlement SHALL remain usable without horizontal page overflow or overlapping controls. Vertical scrolling SHALL be allowed. Controls SHALL have accessible names, visible keyboard focus, associated input labels, and text explanations for disabled or invalid actions. Winner toggles SHALL expose their selection state to assistive technology.

#### Scenario: Mobile nine-player session
- **WHEN** nine players are shown at 390×844
- **THEN** all player information is reachable and readable, with a compact seat layout or supporting player list and no clipped action or settlement controls

#### Scenario: Keyboard correction
- **WHEN** the operator navigates winner selection by keyboard
- **THEN** they can select, deselect, and replace a winner, inspect the preview, and confirm with visible focus

### Requirement: Lightweight motion and reveal guidance
The app SHALL animate chip commitments or pot changes and transitions between streets, while retaining immediately correct text values. Motion SHALL respect reduced-motion preferences and SHALL not gate user actions. Reveal prompts SHALL name the next street and card count and SHALL not generate or display actual card identities.

#### Scenario: Reduced-motion reveal
- **WHEN** reduced motion is enabled and the operator confirms the flop reveal
- **THEN** the street updates without motion-dependent delay and the interface continues to display physical-game guidance
