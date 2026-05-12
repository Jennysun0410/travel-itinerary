## Context

Gmail 掃描目前的流程是「掃描 → 解析 → 直接寫入 DB（trip_id = NULL）→ 回傳計數」。訂單因 trip_id 為 NULL 而成為「未分配」狀態，不會出現在行程的 Orders 頁面。使用者在匯入前也無法得知哪些信件會被解析成訂單。

## Goals / Non-Goals

**Goals:**
- 修正訂單 trip_id 必須在匯入時綁定行程
- 新增預覽步驟：掃描後先展示解析結果，使用者勾選後才寫入

**Non-Goals:**
- 不改動 Gmail push notification 的即時匯入流程（仍維持 trip_id = NULL，待使用者手動分配）
- 不重構 email 解析邏輯（規則式解析維持不變）
- 不做行動裝置版 UI 更新

## Decisions

### Two-endpoint split: /preview and /import

掃描解析與寫入分成兩支 API：
- `POST /email/gmail/preview`：掃描並解析，回傳 `ParsedOrder[]`（不寫 DB）
- `POST /email/gmail/import`：接受使用者選定的 `ParsedOrder[]`，批次 INSERT 並帶入 `trip_id`

Alternatives considered:
- 單一 endpoint + confirm flag：增加 API 複雜度，且兩次請求都要重掃 Gmail，浪費 API quota
- 前端直接過濾後呼叫舊 /scan：需要先存再刪，容易產生殭屍訂單

### ParsedOrder response shape

preview 回傳的資料結構與 DB Order 分離，不帶 id/trip_id/created_by 等資料庫欄位：

```
ParsedOrder {
  raw_email_id: string   // Gmail message id，用來 dedupe
  type: OrderType
  vendor: string
  booking_ref: string | null
  start_datetime: string
  end_datetime: string
  price: number
  currency: string
  flagged_for_review: boolean
}
```

import endpoint 接受 `{ trip_id, orders: ParsedOrder[] }`，直接 INSERT，不再重掃 Gmail。

### parser.ts: parseEmail 改為 return 而非 INSERT

`parseEmail` 改為回傳 `ParsedOrder | null` 而不是直接寫 DB。`enqueueEmailForParsing`（供 push notification 使用）維持包裝函式，在拿到結果後自行 INSERT（trip_id = NULL）。新的 preview flow 直接呼叫 `parseEmail` 並收集結果。

## Risks / Trade-offs

- **Preview 結果與 import 結果可能不一致**：極少數情況下 Gmail token 在兩次請求之間過期，import 時可直接用 ParsedOrder 資料 INSERT 而不重新解析，所以不受影響
- **重複匯入**：import endpoint 以 `raw_email_id` 做 ON CONFLICT DO NOTHING，防止同一封信匯入兩次
