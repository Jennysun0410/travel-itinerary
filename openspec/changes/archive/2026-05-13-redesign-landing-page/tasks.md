## 1. Redesign landing page

- [x] In `packages/web/src/app/page.tsx`, replace the entire component with a full-viewport hero layout: set `<main>` to `position: fixed; inset: 0` with a CSS linear-gradient background from `#22D3EE` (bright cyan) to `#1E40AF` (deep blue); add a `position: absolute; inset: 0; background: rgba(0,0,0,0.35)` overlay div for text contrast; center all content with flexbox (`display: flex; flexDirection: column; alignItems: center; justifyContent: center`)

- [x] Inside the hero, add the brand block: an `<h1>` "Travel Itinerary" in a large serif font (`font-family: Georgia, serif; font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 700; color: #fff; letter-spacing: -0.02em; margin: 0`) followed by a `<p>` tagline "*Every journey begins before you board.*" in italic (`font-style: italic; font-size: clamp(1rem, 2.5vw, 1.35rem); color: rgba(255,255,255,0.85); margin: 16px 0 40px`)

- [x] Add the Google sign-in CTA button: an `<a>` linking to `getApiUrl('/auth/google')` styled as a white pill button (`display: inline-block; padding: 14px 36px; background: #fff; color: #1E40AF; border-radius: 9999px; font-size: 1rem; font-weight: 600; text-decoration: none; box-shadow: 0 4px 20px rgba(0,0,0,0.18)`) with text "Sign in with Google"

- [x] Add a top-right secondary sign-in link: a `position: absolute; top: 24px; right: 32px` container holding an `<a>` linking to `getApiUrl('/auth/google')` with text "Sign in" styled in white (`color: rgba(255,255,255,0.85); font-size: 0.9rem; text-decoration: none; font-weight: 500`)
