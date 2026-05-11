## ADDED Requirements

### Requirement: Post-onboarding Gmail connection prompt

After a new user sets their username during onboarding, the system SHALL present a second step prompting them to connect their Gmail account for automatic order import. The step SHALL be skippable.

#### Scenario: User connects Gmail during onboarding

- **GIVEN** a user has just completed the username step
- **WHEN** the onboarding page advances to step 2 and the user clicks "連結 Gmail"
- **THEN** the user is redirected to `/email/gmail/connect` to complete Gmail OAuth, and after returning they are redirected to `/trips`

#### Scenario: User skips Gmail connection

- **GIVEN** the onboarding page is on step 2 (Gmail prompt)
- **WHEN** the user clicks "略過"
- **THEN** the user is redirected directly to `/trips` without connecting Gmail

##### Example:

- Step 1: User enters username "Jenny" and clicks "開始使用" → PATCH /users/me succeeds → step advances to 2
- Step 2: Page shows "連結 Gmail 以自動匯入訂單確認信" with buttons "連結 Gmail" and "略過"
- User clicks "略過" → router.replace('/trips')
