## Context

The Orders page (`packages/web/src/app/trips/[id]/orders/page.tsx`) currently uses three separate header buttons and an inline manual form. The Gmail import flow is a standalone 5-step modal. This redesign consolidates everything into a single "Add orders" modal with two internal modes.

## Goals / Non-Goals

**Goals:**
- Single entry point for adding orders (`[+ 加入行程]` button)
- Gmail import flow embedded inside the "Add orders" modal (same overlay, no nested popup)
- Per-row inline edit and remove in the import confirmation step
- Orders sorted by creation time (newest first) after import

**Non-Goals:**
- Manual order creation is out of scope for this change (form removed, not redesigned)
- The 5-step import flow internal logic (scanning, parsing, API calls) is unchanged
- Backend sort order changes — sorting is applied on the frontend by reversing the API response

### Dual-Mode Modal State Machine

The "Add orders" modal has two modes controlled by a `modalMode` state:

```
modalMode = 'list'
  → Shows order list + [import from mail] button
  → Clicking [import from mail] sets modalMode = 'import'

modalMode = 'import'
  → Shows StepBar + step content (steps 0–4)
  → Completing step 4 (success) calls onImportSuccess():
      1. Calls parent loadOrders() to refresh the list
      2. Sets modalMode = 'list'  ← modal stays open showing updated list
      ... BUT user confirmed: close modal instead
      So onImportSuccess() closes the modal entirely and parent reloads orders

  → User can exit import mode via:
      - Step 0 Cancel button → modalMode = 'list'
      - Step 2 ← 返回 button → modalMode = 'list'
      - × close button → closes modal entirely
```

**Decision: Close modal on import success (not switch to list mode)**
The user confirmed: after 加入成功, modal closes and Orders page shows updated list sorted newest-first. This is simpler than a list-mode transition and matches expected app behavior.

### Inline Edit in Confirmation Step

Step 2 (確認訂單) adds a per-row `editingRowId` state. When a row enters edit mode:
- Input fields replace the display text for: vendor, type, booking_ref, start_datetime, end_datetime, price, currency
- A Save button commits changes to `previewOrders` state
- A Cancel button discards changes
- Only one row can be in edit mode at a time

**Decision: Edit state is local to ImportFlow component, not lifted to parent**
Parsed orders are transient — they exist only during the import flow and are never persisted to a separate store.

### Orders Sort Order

After import, the page calls `loadOrders()`. The API endpoint returns orders ordered by `created_at DESC` (newest first). A delta spec updates `order-management` to reflect this sort order.

**Decision: Sort on the API side, not the frontend**
The existing `GET /orders/trips/:id/orders` endpoint controls the ORDER BY clause. Changing it in the API ensures consistent ordering regardless of which client fetches orders.

## Decisions

### Dual-mode modal vs nested popup

**Chosen**: Single modal with `modalMode` state switching between `list` and `import` views.
**Alternative rejected**: Keep import as a separate popup (current behavior) — creates two overlapping overlays, worse UX.

### Row-level edit vs separate edit modal

**Chosen**: Inline expand-in-place for the confirmation row.
**Alternative rejected**: Clicking ✏ opens a separate small modal — adds another overlay layer and breaks the confirmation flow.

## Risks / Trade-offs

- [Risk] Long confirmation lists (10+ orders) make the import modal very tall → Mitigation: modal already has `max-height: 88vh` with `overflow-y: auto` on the content area.
- [Risk] API sort order change (created_at DESC) may affect other pages that use the same orders list → Mitigation: only the Orders page for a trip is affected; the change is additive.

## Open Questions

(none — all decisions confirmed in discussion)
