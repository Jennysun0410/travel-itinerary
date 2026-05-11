## Summary

Add a help modal to the My Trips page so users understand how the app works after first login.

## Motivation

The app has no onboarding hints after the display name step. New users land on an empty trips list with no guidance on next steps.

## Proposed Solution

Add a `?` button next to `+ New Trip` in the header. Clicking it opens a modal with 5 steps explaining the core workflow: create trip → import orders → assign to trip → arrange timeline → share with members.

## Impact

- Affected code:
  - Modified: packages/web/src/app/trips/page.tsx
