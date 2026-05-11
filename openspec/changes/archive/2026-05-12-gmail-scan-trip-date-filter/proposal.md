## Why

當使用者從某趟行程的訂單頁掃描 Gmail 時，系統匯入所有日期範圍內的訂單確認信，不論信件內的行程時間是否屬於這趟旅行，導致不相關的訂單被加入行程中。

## What Changes

- Gmail 掃描時，在 Claude 解析完信件後，額外比對 `start_datetime` 是否落在行程的 `start_date`–`end_date` 範圍內
- 不在範圍內的信件直接跳過，不 insert 進 orders table
- 前端掃描請求攜帶 `trip_id`，後端 scan endpoint 查詢行程日期後傳入 parser
- parser 的 `parseEmail` 函式新增 `tripStart` / `tripEnd` 可選參數，有傳入時才進行日期過濾

## Capabilities

### New Capabilities

- `gmail-scan-trip-date-filter`: Gmail 掃描時依據行程日期過濾，只匯入 start_datetime 落在行程區間內的訂單

### Modified Capabilities

- `email-import`: 掃描請求新增 trip_id 參數，scan endpoint 查詢行程日期並傳入 parser

## Impact

- Affected specs: gmail-scan-trip-date-filter (new), email-import (modified)
- Affected code:
  - Modified: packages/api/src/routes/email.ts
  - Modified: packages/api/src/email/gmail.ts
  - Modified: packages/api/src/email/parser.ts
  - Modified: packages/web/src/app/trips/[id]/orders/page.tsx
