## 1. API: Change order sort to created_at DESC

- [x] In `packages/api/src/routes/orders.ts`, find the `GET /trips/:tripId/orders` query and change `ORDER BY start_datetime ASC` to `ORDER BY created_at DESC` so orders are returned newest first

## 2. Page header: Replace three buttons with single entry button

- [x] In `packages/web/src/app/trips/[id]/orders/page.tsx`, remove the `openDemo`, `showManual`, `demoOrders`, `isDemo`, and `demoStep` state variables; remove the manual-add form JSX block; replace the three header buttons (示範預覽, 從信箱匯入, + 手動新增) with a single `[+ 加入行程]` button that sets `showAddModal = true`

## 3. Add orders modal: list mode

- [x] Create an `AddOrdersModal` component in `packages/web/src/app/trips/[id]/orders/page.tsx` that renders as a full-screen overlay with title "Add orders" and × close button; the modal has a `modalMode` state (`'list' | 'import'`); in `list` mode it shows the order list (passed as props) and an `[import from mail]` button in the top-right of the inner card; clicking `[import from mail]` sets `modalMode = 'import'`

## 4. Add orders modal: embed import flow in import mode

- [x] Move the `ImportModal` 5-step flow (StepBar + step content components) into `AddOrdersModal` so when `modalMode = 'import'` the inner card shows the 5-step flow; when the user cancels (步驟0 取消 or 步驟2 ← 返回), set `modalMode = 'list'`; when import succeeds (step 4 完成), call `onImportSuccess()` which closes the modal and triggers `loadOrders()` on the parent page

## 5. Confirmation step: per-row inline edit

- [x] In the 確認訂單 step (step 2), add an `editingRowId` state (string | null); each order row gains an ✏ edit button; clicking it sets `editingRowId` to that order's `raw_email_id`; in edit mode the row expands showing input fields for vendor, type, booking_ref, start_datetime, end_datetime, price, currency; a Save button commits the changes to `previewOrders` state and sets `editingRowId = null`; a Cancel button discards changes and sets `editingRowId = null`; only one row can be in edit mode at a time

## 6. Confirmation step: per-row remove

- [x] In the 確認訂單 step (step 2), each order row gains a ✕ remove button; clicking it removes that order from `previewOrders` state (not just deselects — fully removes the row from the list); if the last order is removed, show the 未找到符合條件 empty state with a 關閉 button
