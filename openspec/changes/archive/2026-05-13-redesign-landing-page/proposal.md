## Summary

Replace the bare-bones sign-in page with a full-viewport hero landing page that reflects the quality of the product and creates a strong first impression before login.

## Motivation

The current landing page (`packages/web/src/app/page.tsx`) is a plain centered layout with a heading, one sentence, and a Google sign-in button — no visual identity, no emotional hook. First-time visitors have no reason to feel excited about signing up. The redesign establishes visual brand presence before the user logs in.

## Proposed Solution

Redesign `packages/web/src/app/page.tsx` as a full-viewport hero page:

- **Background**: CSS-only linear gradient (bright cyan `#22D3EE` → deep blue `#1E40AF`) — no image dependencies
- **Overlay**: semi-transparent dark overlay (`rgba(0,0,0,0.35)`) for text contrast
- **Logo / brand**: "Travel Itinerary" in large serif font, centered
- **Tagline**: *Every journey begins before you board.* in italic, below the title
- **CTA button**: white pill button with "Sign in with Google" linking to the existing Google OAuth endpoint
- **Top-right nav**: subtle "Sign in" text link as secondary entry point
- **Layout**: flexbox full-viewport center, all CSS-in-JS (inline styles, no new dependencies)

## Non-Goals

- No new authentication logic — the Google OAuth endpoint (`/auth/google`) is unchanged
- No mobile-specific breakpoints in this change (responsive polish is out of scope)
- No hero image or external asset — pure CSS gradient only
- No animation or parallax effects

## Impact

- Affected specs: none (no requirement-level behavior changes — this is a pure UI enhancement)
- Affected code:
  - Modified: `packages/web/src/app/page.tsx`
