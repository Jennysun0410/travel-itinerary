## Context

Gmail scan 目前的流程：前端送出 `{ from, to }` 收信日期範圍 → `POST /email/gmail/scan` → `scanGmailByDateRange` → Claude 解析信件 → 直接 insert。整個流程沒有考慮解析出的行程時間是否符合當前行程。

trips table 已有 `start_date DATE` 與 `end_date DATE` 欄位可直接使用。

## Goals / Non-Goals

**Goals:**
- Gmail 掃描時，只匯入 `start_datetime` 落在行程 `start_date`–`end_date`（含端點，比對到日期即可）範圍內的訂單
- 不符合範圍的信件 silent skip，不回傳錯誤

**Non-Goals:**
- 不過濾 `end_datetime`，只看 `start_datetime`
- 不影響「手動新增訂單」流程
- 不支援無 trip_id 的獨立掃描（未來功能）
- 不改變 unassigned orders 流程

## Decisions

**D1: trip_id 由前端帶入**
前端在訂單頁已有 `params.id`（即 trip_id），掃描時一併送到後端。後端 scan endpoint 用 trip_id 查詢 `start_date` / `end_date`，不需前端額外 fetch 行程資料。

**D2: 日期比對在 parseEmail 內，parser 層處理**
`parseEmail` 新增可選參數 `tripDateRange?: { start: string; end: string }`（ISO date string，例如 `"2026-01-20"`）。解析完 Claude response 後，若有傳入 tripDateRange 且 `start_datetime` 不在區間內，直接 return，不 insert。

比對邏輯：取 `start_datetime` 的日期部分（`YYYY-MM-DD`），與 `tripDateRange.start`、`tripDateRange.end` 做字串比較（ISO date 可直接字串比大小）。

**D3: scanGmailByDateRange 新增 tripDateRange 參數**
函式簽名改為 `scanGmailByDateRange(userId, from, to, tripDateRange?: { start: string; end: string })`，透傳給 `enqueueEmailForParsing`，再傳入 `parseEmail`。

**D4: scan endpoint 查詢行程日期**
`POST /email/gmail/scan` body 新增選用欄位 `trip_id?: string`。若有帶入，endpoint 查詢 `SELECT start_date, end_date FROM trips WHERE id = $1`，查到後建構 `tripDateRange` 傳入 `scanGmailByDateRange`。若查無 trip 或未帶 trip_id，則不過濾（行為與現在相同）。

## Risks / Trade-offs

- **Claude 解析失敗時 start_datetime 為空**：`parseEmail` 原本在 `start_datetime` 為 null 時 fallback 為 `new Date().toISOString()`，加上日期比對後今天的日期可能不在行程區間，導致本來能 insert 的 flagged 訂單被 skip。
  緩解：日期比對只在 `start_datetime` 確實有值時進行（非 fallback 值）；或者，Claude 解析不到 `start_datetime` 時直接 return（本來就會 flagged，改成 skip 更合理）。本設計採後者：`start_datetime` 為 null 且有 tripDateRange 時，skip 該信件。
