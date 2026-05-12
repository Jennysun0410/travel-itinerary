## Why

The Orders page currently has three separate buttons (示範預覽, 從信箱匯入, + 手動新增) that fragment the user journey. The Gmail import flow opens as a separate popup, creating a disjointed experience, and the confirmation step does not allow users to edit parsed order fields before importing.

## What Changes

- The three header buttons are replaced with a single `[+ 加入行程]` button
- Clicking `[+ 加入行程]` opens an "Add orders" modal overlay
- Inside the modal, an `[import from mail]` button in the top-right of the inner card triggers the Gmail import flow
- The Gmail import flow (5-step: 選擇日期 → 掃描信箱 → 確認訂單 → 加入行程 → 加入成功) runs inside the same modal rather than as a separate popup
- The confirmation step (確認訂單) allows inline editing of each parsed order's fields and individual removal of orders from the import list; all orders are pre-selected by default including those flagged_for_review
- After successful import, the modal closes and the Orders page reloads with orders sorted by creation time (newest first)
- The manual-add form and the demo/tutorial button are removed from the page

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `order-management`: Orders list is now sorted by creation time (newest first) instead of start datetime; the add-order entry point is a single modal button
- `email-import-preview`: The Gmail import flow runs inside the Add orders modal; confirmation step gains per-row inline edit and remove

## Impact

- Affected specs: order-management, email-import-preview
- Affected code:
  - Modified: packages/web/src/app/trips/[id]/orders/page.tsx
