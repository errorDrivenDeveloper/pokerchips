# Spec Delta

## Purpose

Distribute chips accurately after folds or manually judged showdowns and let operators correct mistaken winner entries.

## ADDED Requirements

### Requirement: Eligible pots and uncalled chips
The app SHALL derive main and side pots from total hand contributions, include folded players' contributions, and exclude folded players from winning. Any unmatched contribution above every other player's contribution SHALL return to its contributor. A player SHALL only be eligible for pots covered by their contribution. A pot with one eligible player SHALL award automatically; a contested pot SHALL require at least one selected eligible winner.

#### Scenario: Different all-in amounts
- **WHEN** Alice contributes 50, Bob 100, and Cara 100 and all reach showdown
- **THEN** the main pot is 150 with all three eligible and the side pot is 100 with only Bob and Cara eligible
- **AND** selecting Alice for the side pot is blocked

#### Scenario: Uncalled bet and fold win
- **WHEN** Alice contributes 100, Bob contributes 40, and Bob folds as the last opponent
- **THEN** 60 uncalled chips return to Alice and Alice automatically wins the remaining 80

### Requirement: Editable and split winner selection
The operator SHALL be able to toggle one or more eligible winners independently for each contested pot, including two-player ties, and see a payout preview. Selection SHALL not change stacks until confirmation. Deselection SHALL be allowed, and confirming SHALL be blocked while any contested pot has no winner. Pots SHALL split in integer chips; remainder chips SHALL go one each to tied winners in clockwise order starting left of the dealer.

#### Scenario: Replace an accidentally selected winner
- **WHEN** Alice is selected and the operator deselects Alice then selects Bob
- **THEN** only Bob appears in that pot's payout preview and no stack changes before confirmation

#### Scenario: Two winners and an odd chip
- **WHEN** a pot of 15 is split between Alice and Bob, and Bob is first clockwise left of the dealer
- **THEN** the preview awards Bob 8 and Alice 7

### Requirement: Confirm and correct settlement
Confirming settlement SHALL transfer the previewed awards exactly once and show a hand summary. Before the next hand starts, an “Edit winners” action SHALL restore the pre-payout balances and selections, permit winner changes, and recalculate the payout from that baseline. Repeated confirmation SHALL never duplicate awards. Starting the next hand SHALL finalize the previous payout and remove access to its correction controls.

#### Scenario: Correct an already paid hand
- **WHEN** Alice receives a 100-chip pot, the operator chooses Edit winners, replaces Alice with Bob, and confirms
- **THEN** Alice's previous 100-chip award is removed and Bob receives exactly 100
- **AND** the session total is unchanged even if confirmation is triggered again

#### Scenario: Complete the hand
- **WHEN** all pots are paid and the operator starts the next hand
- **THEN** the settled stacks carry forward, the dealer rotates, and the previous hand cannot be edited
