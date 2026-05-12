## Why

Gmail 掃描回報「已匯入 N 筆訂單」但訂單不出現在行程 Orders 頁面，原因是 parser 的 INSERT 寫死 `trip_id = NULL`，訂單以「未分配」狀態存入資料庫，而 Orders 頁面只顯示綁定該行程的訂單。同時，使用者在匯入前無法預覽解析結果，難以判斷哪些信件會被納入。

## What Changes

- 修正 `packages/api/src/email/parser.ts`：INSERT 改為帶入 `trip_id`，使訂單直接綁定到行程
- 新增 `POST /email/gmail/preview` API：掃描並解析 Gmail，回傳解析結果但不寫入資料庫
- 新增 `POST /email/gmail/import` API：接受使用者選定的訂單清單，批次寫入資料庫並綁定 `trip_id`
- 更新 Orders 頁面匯入流程：改為三步驟（選日期 → 預覽清單 + 勾選 → 確認匯入）

## Capabilities

### New Capabilities

- `email-import-preview`: 使用者掃描 Gmail 後，先看到解析出的訂單清單（含類型、供應商、訂單號、日期、金額），勾選要加入的項目後再確認匯入，匯入後訂單直接出現在行程的 Orders 列表

### Modified Capabilities

- `email-import`: 修正掃描匯入的訂單必須綁定行程（trip_id 不得為 NULL）

## Impact

- Affected specs: email-import-preview (new), email-import (modified)
- Affected code:
  - New: packages/api/src/routes/email-preview.ts
  - Modified: packages/api/src/email/parser.ts
  - Modified: packages/api/src/email/gmail.ts
  - Modified: packages/api/src/index.ts
  - Modified: packages/web/src/app/trips/[id]/orders/page.tsx
