## Why

目前訂單只能手動逐筆輸入，且 Gmail 連結入口隱藏在 Settings 頁面，使用者難以發現。新使用者無從得知可以自動匯入訂單，導致功能使用率低。

## What Changes

- 登入後的 onboarding 流程新增 Gmail 連結提示步驟，讓使用者在首次登入後可選擇連結 Gmail
- Orders 頁面的「+ Add Order」按鈕展開為兩個選項：從信箱匯入（指定日期範圍搜尋）或手動新增
- 後端新增 `POST /email/gmail/scan` API，接受 `from` / `to` 日期參數，搜尋指定範圍內的訂單確認信並解析為訂單

## Capabilities

### New Capabilities

- `gmail-date-range-scan`: 使用者可指定日期範圍，從已連結的 Gmail 信箱中批次搜尋並匯入訂單確認信
- `onboarding-gmail-prompt`: 新使用者首次登入後，onboarding 頁面引導連結 Gmail 信箱

### Modified Capabilities

- `email-import`: 擴充現有 Gmail 匯入，支援歷史信件批次掃描（原僅支援 `newer_than:1d` 的即時 push）
- `order-management`: Orders 頁面「+ Add Order」改為先選擇新增方式（信箱匯入 / 手動）

## Impact

- Affected specs: gmail-date-range-scan (new), onboarding-gmail-prompt (new), email-import (modified), order-management (modified)
- Affected code:
  - New: packages/api/src/routes/email-scan.ts
  - Modified: packages/api/src/email/gmail.ts
  - Modified: packages/api/src/routes/email.ts
  - Modified: packages/web/src/app/onboarding/page.tsx
  - Modified: packages/web/src/app/trips/[id]/orders/page.tsx
  - Modified: packages/api/src/index.ts
