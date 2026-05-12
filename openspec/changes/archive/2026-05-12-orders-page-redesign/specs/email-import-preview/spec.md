## MODIFIED Requirements

### Requirement: Orders page preview flow

The web Orders page SHALL embed the Gmail import flow inside the "Add orders" modal. The import flow SHALL run as an in-place mode switch (not a separate popup). The confirmation step (確認訂單) SHALL allow per-row inline editing of all parsed order fields and per-row removal from the import list before the user confirms import.

#### Scenario: Import flow runs inside Add orders modal

- **WHEN** a user clicks `[import from mail]` inside the "Add orders" modal
- **THEN** the modal SHALL switch to import mode, displaying the 5-step flow (選擇日期 → 掃描信箱 → 確認訂單 → 加入行程 → 加入成功) within the same overlay

#### Scenario: Per-row inline edit in confirmation step

- **WHEN** a user clicks the edit button on a parsed order row in the 確認訂單 step
- **THEN** the row SHALL expand to show editable fields for vendor, type, booking_ref, start_datetime, end_datetime, price, and currency
- **THEN** only one row SHALL be in edit mode at a time

#### Scenario: Per-row removal in confirmation step

- **WHEN** a user clicks the remove button on a parsed order row in the 確認訂單 step
- **THEN** that order SHALL be removed from the preview list and will not be imported

#### Scenario: All orders pre-selected including flagged

- **WHEN** the 確認訂單 step is displayed after scanning
- **THEN** ALL parsed orders SHALL be pre-selected (checked) by default, including those with `flagged_for_review = true`

#### Scenario: User cancels import and returns to list mode

- **WHEN** a user clicks 取消 on the 選擇日期 step or ← 返回 on the 確認訂單 step
- **THEN** the modal SHALL switch back to list mode without importing any orders
