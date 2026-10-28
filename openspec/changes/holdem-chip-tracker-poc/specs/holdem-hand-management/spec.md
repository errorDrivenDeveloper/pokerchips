# Spec Delta

## Purpose

Guide the action and streets of a physical Hold'em hand while maintaining valid bets and conserving chips.

## ADDED Requirements

### Requirement: Blinds and seat rotation
The app SHALL post blinds automatically from available stacks and identify the dealer, small blind, and big blind. Preflop action SHALL start left of the big blind, and postflop action SHALL start with the first actionable player left of the dealer. Heads-up, the dealer SHALL post the small blind and act first preflop; the other player SHALL act first postflop. Next hand SHALL rotate the dealer clockwise among players with chips and skip busted seats. Fewer than two funded players SHALL end play and identify the remaining player.

#### Scenario: Heads-up action
- **WHEN** a two-player hand begins with Alice as dealer
- **THEN** Alice posts the small blind and acts first preflop, and Bob acts first on the flop if both can act

#### Scenario: Short blind and busted seat
- **WHEN** a player with 3 chips must post a 5-chip small blind
- **THEN** only 3 chips are posted and that player becomes all-in
- **AND** a player with zero chips at the next hand's start is skipped for blinds and turns

### Requirement: Legal betting actions
Only the current actor SHALL be able to fold, check with nothing owed, call up to their remaining stack, bet, raise, or go all-in. Amount entry SHALL mean total chips committed on this street, with the additional debit displayed. The opening minimum bet and initial minimum raise increment SHALL equal the configured big blind, including when the big blind is short. A full raise SHALL be at least the previous full raise increment above the current target; a smaller raise SHALL be allowed only as an all-in. A short all-in SHALL not reopen raising for someone who already acted unless the cumulative increase faced since their last action reaches a full raise. Invalid actions SHALL leave state unchanged and explain why.

#### Scenario: Big blind option
- **WHEN** all other players call the big blind without raising
- **THEN** the big blind still receives a check or raise action before preflop closes

#### Scenario: Validate and record a raise
- **WHEN** blinds are 5/10 and the actor raises to 30 after committing 5
- **THEN** 25 additional chips leave their stack, their street bet becomes 30, and the next minimum full raise is to 50
- **AND** an attempted non-all-in raise to 40 is rejected without changing balances

#### Scenario: Short all-in does not reopen raising
- **WHEN** Alice bets 100, Bob calls 100, and Cara goes all-in for 150 with a full raise increment of 100
- **THEN** Alice and Bob can fold or call the extra 50 but cannot raise

### Requirement: Street progression and physical reveal prompts
The app SHALL progress through preflop, flop, turn, river, and showdown. A betting street SHALL close only once all nonfolded players with chips have acted as required and matched the target. Before the next community street, the app SHALL require explicit confirmation to reveal three flop cards, one turn card, or one river card. Advancing SHALL reset street bets while preserving hand contributions. If at most one player can act and nobody owes an actionable call, betting SHALL be skipped and remaining reveal confirmations SHALL still occur. If only one player remains nonfolded, the hand SHALL finish without further reveal prompts.

#### Scenario: Progress to flop
- **WHEN** preflop betting closes
- **THEN** the operator sees “Reveal flop — 3 cards” and cannot take a flop action until confirming the reveal
- **AND** confirming sets street bets to zero while retaining the pot and hand contributions

#### Scenario: All-in runout
- **WHEN** all remaining contenders are all-in preflop
- **THEN** the app guides flop, turn, and river reveals in order without offering betting actions, then opens showdown

### Requirement: Accounting and undo
The app SHALL show remaining stacks, each player's street bet and hand contribution, and the total pot. The total pot SHALL already include all street bets. Stacks plus committed chips before payout, and stacks after payout, SHALL equal the initial session total. Undo SHALL restore the preceding accepted action or street transition, including turn, folded/all-in status, amounts, and reveal state, within the current hand. Undo history SHALL reset when the next hand starts.

#### Scenario: Correct an accidental fold
- **WHEN** the operator undoes the latest fold
- **THEN** that player becomes the current actor again with their preceding balances and status restored

#### Scenario: Return to the previous street
- **WHEN** the operator undoes a reveal confirmation before any further action
- **THEN** the previous street's closed betting state and reveal prompt are restored
