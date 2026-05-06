# Phase 6 Plan: PWA Polish + Deployment

## Goal
Ship CafeTrac v1.0 as a production-ready PWA with robust offline UX, install flow, UI polish, responsive fixes, and free hosting deployment artifacts.

## Constraints
- Create this plan before implementation changes.
- Preserve existing Phase 1-5 behavior.
- Keep secrets out of source and examples only in `.env.example`.
- Finish with working CI, clean high/critical audits, and final commit message format requested.

## Implementation Plan

### 1) Baseline + Gap Audit
- Inspect current offline sync, service worker, routing, and existing loading states.
- Verify build scripts and TypeScript output settings in backend/frontend.
- Identify all pages/components requiring skeleton/animation/responsive adjustments.

### 2) Offline UX Foundation
- Add `frontend/src/hooks/useNetworkStatus.ts` with `isOnline` + `wasOffline`.
- Wire network banners into app shell:
  - Offline amber banner with slide-down animation.
  - Reconnect green banner auto-hide and global `queryClient.invalidateQueries()`.
- Add route-aware offline availability rules:
  - Cached-enabled: `/`, `/waste`, `/inventory`.
  - Requires connection messaging: `/reports`, `/suppliers`, `/purchase-orders`.

### 3) Offline Sync Enhancement
- Update `useOfflineSync` to:
  - Detect reconnect transitions.
  - Replay pending IndexedDB waste logs to `/api/v1/waste-logs`.
  - Remove synced entries and show success toast with synced count.
  - Invalidate React Query caches after sync.
- Expose unsynced pending count and display badge on Waste nav item (desktop + mobile).

### 4) PWA Install Experience
- Add `frontend/src/hooks/usePWAInstall.ts`:
  - Handle `beforeinstallprompt`.
  - Detect installed state via display mode.
  - Provide `install()` action.
- Implement install banners:
  - Trigger only after first waste log event flag in localStorage.
  - Respect installed state and 7-day dismissal cooldown.
  - Android/Desktop CTA banner with Install/Maybe Later.
  - iOS Safari instructions banner with dismiss action.

### 5) Service Worker + Workbox (vite-plugin-pwa)
- Install and configure `vite-plugin-pwa`.
- Move to plugin-managed SW registration (`autoUpdate`) and manifest config.
- Add required runtime caching rules:
  - NetworkFirst for `/api/v1/*`.
  - CacheFirst for static assets.
- Ensure existing push notification behavior remains available (custom worker integration as needed).
- Validate icons/manifest asset paths.

### 6) Skeleton Screen Audit
- Replace remaining spinner/loading placeholders with skeletons on:
  - `/` dashboard KPIs
  - `/waste` logs list
  - `/inventory` table rows/cards
  - `/suppliers` cards/list
  - `/purchase-orders` table
  - `/reports` chart regions
  - `/notifications` list items
- Standardize Tailwind skeleton patterns and consistent spacing.

### 7) Micro Animations Pass
- Waste submit success: temporary green check state + reset in 1.5s + drawer close animation.
- Inventory stock number flash color on stock-in/stock-out actions.
- Notification unread badge scale-in animation.
- Route mount fade-in (`duration-200`) standardization.
- PO status badge color transition.
- Low stock badge subtle pulse.

### 8) Responsive QA (375, 390, 768, 1280, 1440)
- Enforce min readable text sizing on mobile.
- Eliminate horizontal overflow globally.
- Ensure mobile content bottom spacing (`pb-20`) vs fixed nav.
- Ensure interactive controls meet 44px target height.
- Add horizontal scroll wrappers for mobile tables.
- Ensure mobile modals are full-screen patterns.
- Ensure chart minimum heights and full-width behavior.
- Desktop: persistent sidebar, centered max-width 1200px, side-by-side charts, full table columns.

### 9) Deployment Artifacts + Env Hardening
- Finalize `backend/.env.example` and `frontend/.env.example` to spec.
- Add `backend/render.yaml`.
- Add `frontend/vercel.json`.
- Verify/update scripts:
  - backend: `build`, `start`, `dev`.
  - frontend: `build`, `preview`.
- Confirm backend `tsconfig.json` root/out dir settings.

### 10) CI + Security Validation
- Create `.github/workflows/ci.yml` for backend/frontend jobs and audit checks.
- Run `npm audit --audit-level=high` in backend and frontend; remediate where feasible.
- Verify:
  - `.gitignore` includes `.env`.
  - No hardcoded secrets.
  - `helmet()` active.
  - production CORS restriction behavior.
  - auth rate limiting active.
  - ownership checks on protected resources.
  - JWT secret length requirements (64+ chars expectation documented/enforced where applicable).

### 11) Docs + Finalization
- Update `README.md` with deployment steps (Render + Vercel + production smoke test).
- Run type-check/build validation for both apps.
- Run lints on changed files and fix regressions.
- Prepare final commit:
  - `feat: CafeTrac complete v1.0`

## Verification Checklist
- [ ] Offline amber/green banners work with reconnect refresh.
- [ ] Waste logs queue and sync on reconnect with count toast.
- [ ] Waste nav shows unsynced badge count.
- [ ] Install prompt behaves correctly for Android/Desktop and iOS.
- [ ] PWA manifest + caching + SW registration are functional.
- [ ] No spinner regressions where skeletons are required.
- [ ] All specified animations are visible and non-janky.
- [ ] Layout passes required breakpoints without overflow.
- [ ] Render + Vercel config files present and correct.
- [ ] CI workflow runs backend/frontend checks and audits.
- [ ] High/critical audits resolved or explicitly justified.
- [ ] README deployment instructions complete.
