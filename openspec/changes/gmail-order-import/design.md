## Context

目前 Gmail 匯入僅透過 PubSub webhook 接收即時推播（`newer_than:1d`），無法掃描歷史信件。Onboarding 流程只設定暱稱後即跳轉至行程列表，使用者無從得知 Gmail 連結功能。Orders 頁的「+ Add Order」只開啟手動表單，沒有信箱匯入選項。

## Goals / Non-Goals

**Goals:**

- 新增 `POST /email/gmail/scan` API，接受 `from` / `to`（YYYY-MM-DD）日期範圍，搜尋 Gmail 並解析訂單
- Onboarding 完成暱稱設定後，新增第二步驟「連結 Gmail（可略過）」
- Orders 頁「+ Add Order」改為先選擇方式：信箱匯入 / 手動新增

**Non-Goals:**

- 不支援 Outlook 的日期範圍掃描（維持現有 webhook 模式）
- 不在掃描前讓使用者預覽/確認哪些信件會被匯入
- 不支援重複匯入（`raw_email_id` 唯一約束已防止）

## Decisions

### D1: 日期範圍 API 端點設計

`POST /email/gmail/scan` 接受 `{ from: "YYYY-MM-DD", to: "YYYY-MM-DD" }`，回傳 `{ imported: number, skipped: number }`。

Gmail query 格式：`subject:(booking confirmation OR reservation OR order confirmation OR e-ticket) after:YYYY/MM/DD before:YYYY/MM/DD`

掃描上限 50 封（`maxResults: 50`），避免單次請求過長。

### D2: Onboarding 兩步驟流程

Step 1（現有）：設定暱稱 → PATCH /users/me → 進入 Step 2  
Step 2（新增）：顯示「連結 Gmail 取得訂單自動匯入」說明 + 兩個按鈕：「連結 Gmail」（導向 `/email/gmail/connect`）和「略過」（導向 `/trips`）

Step 2 使用 `step` state 控制，不新增頁面路由。

### D3: Orders 頁面加入方式選擇

點擊「+ Add Order」後，先顯示兩個選項卡：
- 「從信箱匯入」：展開日期範圍選擇器（開始日期、結束日期）+ 「開始匯入」按鈕，呼叫 `/email/gmail/scan`，完成後重新載入訂單列表並顯示匯入數量
- 「手動新增」：現有手動表單（不變）

若使用者尚未連結 Gmail，「從信箱匯入」選項顯示提示「尚未連結 Gmail」並附導向 Settings 的連結，不直接呼叫 scan API。

### D4: Gmail 連結狀態判斷

前端呼叫 `GET /email/connections` 判斷是否已連結 Gmail。此 API 已存在，直接複用。

## Risks / Trade-offs

- **掃描時間**：50 封信逐一 `messages.get` 可能需要 5–15 秒，前端需顯示 loading 狀態
- **Rate limit**：`checkParseRateLimit` 已存在於 parser.ts，scan API 複用同一限流邏輯
- **已連結才能掃描**：若 token 過期，Gmail API 呼叫會失敗；目前沒有 token 刷新邏輯，失敗時回傳 502
