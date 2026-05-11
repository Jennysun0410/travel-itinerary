## Why

目前 Gmail 掃描依賴 subject keyword 匹配，容易漏掉中文訂單信或冷門平台，且 Claude parser 沒有先判斷「是否為訂單信」，導致促銷信也被 insert。低信心訂單雖有 flagged 欄位但前端完全未呈現，用戶看到的資料品質無法保證。

## What Changes

- Gmail 搜尋 query 改為 `from:(已知平台 domain) OR subject:(通用關鍵字)`，取代純 subject keyword 做法
- Claude parser prompt 加入 `is_booking` 判斷欄位，回傳 false 時直接跳過不 insert
- Orders 頁面對 `flagged_for_review = true` 的訂單顯示「待確認」badge，用戶點一下確認後 flag 清除

## Capabilities

### New Capabilities

- `email-sender-filtering`: 以寄件 domain 為主要過濾條件，subject keyword 為輔助 fallback
- `booking-intent-detection`: Claude 在解析前先判斷是否為訂單確認信
- `flagged-order-review`: Orders 頁面顯示低信心訂單並提供確認操作

### Modified Capabilities

- `gmail-date-range-scan`: 搜尋 query 策略升級

## Impact

- Affected specs: email-sender-filtering, booking-intent-detection, flagged-order-review, gmail-date-range-scan
- Affected code:
  - Modified: packages/api/src/email/gmail.ts
  - Modified: packages/api/src/email/parser.ts
  - Modified: packages/web/src/app/trips/[id]/orders/page.tsx
  - New: packages/api/src/routes/orders.ts (PATCH /orders/:id/confirm endpoint)
