## Context

目前 Gmail 掃描使用純 subject keyword 過濾（booking confirmation, reservation 等），無法覆蓋中文訂單信或各平台差異化的 subject 格式。Claude parser 直接解析所有收到的信件內容，沒有事先過濾非訂單信，導致促銷信也可能被 insert 進 orders table（雖然 flagged=true 但前端無呈現）。

## Goals / Non-Goals

**Goals:**
- 以寄件者 domain 為主要過濾條件，提升搜尋精準度
- Claude 單次 API call 同時判斷「是否為訂單信」與「解析訂單資料」
- 前端對低信心訂單顯示「待確認」badge，提供一鍵確認操作
- 支援 `from:` 已知平台 domain + `subject:` 關鍵字 fallback 的混合 query

**Non-Goals:**
- 不支援 Outlook 的同等改動（保持現狀）
- 不實作批次確認（一次確認多筆）
- 不變更 rate limit 邏輯

## Decisions

**D1: Gmail query 策略**
改為：
```
(from:(agoda.com OR booking.com OR airbnb.com OR klook.com OR trip.com OR evaair.com OR china-airlines.com OR flyscoot.com OR airasia.com OR tigerairtw.com OR flypeach.com) OR subject:(confirmation OR 確認 OR 預訂 OR 訂單 OR itinerary OR e-ticket OR booking)) after:YYYY/MM/DD before:YYYY/MM/DD
```
理由：已知平台 domain 精準命中，subject fallback 補漏冷門平台，不需維護純關鍵字清單。

**D2: Claude parser 加入 is_booking 欄位（單段式）**
在現有 prompt 加入 `is_booking: boolean` 欄位。回傳 `false` 時直接 return，不 insert。不拆成兩段式，避免多一次 API call。

**D3: 待確認訂單流程**
- `flagged_for_review = true` 的訂單在 Orders 列表顯示橘色「待確認」badge
- 點 badge 後呼叫 `PATCH /orders/:id/confirm`，將 `flagged_for_review` 設為 `false`
- 未確認訂單正常顯示，不從列表隱藏，不影響行程統計

## Risks / Trade-offs

- **已知 domain 清單需維護**：新平台上線時需手動更新 query string。風險低，因為 subject fallback 會補漏。
- **is_booking 判斷依賴 Claude**：如果 Claude 誤判訂單信為 false，信件會被丟棄。緩解：prompt 明確說明「訂單確認信的定義」，降低誤判率。
