## MODIFIED Requirements

### Requirement: Orders page add-order flow supports email import

The Orders page SHALL present a method-selection UI when the user clicks "+ Add Order", offering two options: import from Gmail by date range, or manual entry.

#### Scenario: User selects email import and has Gmail connected

- **GIVEN** a trip member is on the Orders page and has a connected Gmail account
- **WHEN** they click "+ Add Order" and select "從信箱匯入"
- **THEN** a date range picker appears with "開始日期" and "結束日期" inputs and an "開始匯入" button

#### Scenario: User triggers email scan

- **GIVEN** the email import panel is open with a valid date range selected
- **WHEN** the user clicks "開始匯入"
- **THEN** the frontend calls `POST /email/gmail/scan` with the selected dates, shows a loading state, and on success displays "已匯入 N 筆訂單" and refreshes the order list

#### Scenario: User has no Gmail connected

- **GIVEN** a trip member is on the Orders page and has NOT connected Gmail
- **WHEN** they click "+ Add Order" and select "從信箱匯入"
- **THEN** the panel shows "尚未連結 Gmail" with a link to the email settings page

#### Scenario: User selects manual entry

- **GIVEN** a trip member is on the Orders page
- **WHEN** they click "+ Add Order" and select "手動新增"
- **THEN** the existing manual order form is shown (unchanged behavior)

##### Example:

- User clicks "+ Add Order" → sees two buttons: "從信箱匯入" and "手動新增"
- Selects "從信箱匯入" → date pickers appear, user sets from=2026-04-01, to=2026-04-30, clicks "開始匯入"
- Loading spinner → POST /email/gmail/scan → response { imported: 2, skipped: 0 } → "已匯入 2 筆訂單" → order list reloads
