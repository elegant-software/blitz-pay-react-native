# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BlitzPay is a mobile-first fintech prototype with AI-powered checkout, QR-based payments, and a voice assistant. It's a Google AI Studio app (deployed to Cloud Run) built as a single-page application with screen-based navigation.

## Commands

```bash
npm run dev       # Start dev server on port 3000
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # TypeScript type check (tsc --noEmit)
npm run clean     # Remove dist directory
```

## Architecture

**Navigation model**: `App.tsx` owns all navigation state (`currentScreen`). Screens are rendered via a switch statement and communicate back through callbacks (`onBack`, `onNavigate`, etc.). There is no router library — screen transitions are managed manually with the Motion library.

**Screen inventory** (`src/types.ts` defines the `Screen` union type):
- `explore` → Home/merchant discovery
- `merchant` → Merchant detail
- `checkout` → Payment confirmation (receives `invoiceToPay` state)
- `assistant` → Gemini voice assistant
- `vault` → Wallet/funds
- `account` → Profile/settings
- `myQRCode`, `qrScanner`, `invoices`, `sendInvoice`, `notifications`

**Adding a new screen**: Create `src/screens/NewScreen.tsx`, add to the `Screen` type in `types.ts`, import and add a case in `App.tsx`'s `renderScreen()`.

**Internationalization**: All UI text goes through `useLanguage()` from `src/lib/LanguageContext.tsx`. Add translation keys to both `de` and `en` objects in `src/lib/translations.ts`. Default language is German.

**Animation**: Uses `motion/react` (not `framer-motion`). Screens use `AnimatePresence` for exit animations. Interactive elements use `whileTap={{ scale: 0.95 }}`.

**Bottom nav spacing**: All screen content uses `pb-32` to avoid overlap with the fixed bottom navigation bar.

## Environment Variables

```
GEMINI_API_KEY=   # Google AI API key (exposed to browser via Vite)
APP_URL=          # Cloud Run service URL
DISABLE_HMR=true  # Set in AI Studio environment only
```

## Tech Stack

- React 19, TypeScript 5.8, Vite 6.2, Tailwind CSS 4.1
- `motion/react` (v12) for animations
- `lucide-react` for icons
- `@google/genai` for Gemini API
- Path alias `@/` resolves to project root

## Design System

Custom Tailwind theme colors: `primary` (#00C2FF cyan), `secondary` (#5856D6 purple), `surface` (#F2F2F7), `on-surface` (#1C1C1E). Fonts: Inter (body), Manrope (headlines). Radius scale: `rounded-xl` (1rem), `rounded-2xl` (1.5rem), `rounded-3xl` (2rem). Glass effect pattern: `bg-surface/60 backdrop-blur-xl`.

## Authentication

The app uses Keycloak for identity. All auth state flows through `useAuth()` from `src/lib/keycloak.ts`.

**`useAuth()` returns**: `{ initialized, authenticated, token, user, isWebAuthnAvailable, biometricEnrolled, login, loginWithBiometric, logout, enrollBiometric }`

**Login flow**: ROPC grant (direct `fetch` to Keycloak token endpoint — no redirect). Tokens stored in `sessionStorage` (`blitzpay_session`). Proactive refresh scheduled 60s before expiry.

**Face ID**: `loginWithBiometric()` triggers a Keycloak WebAuthn passwordless redirect. `enrollBiometric()` triggers the `webauthn-register-passwordless` Application-Initiated Action. Enrollment flag stored in `localStorage` (`blitzpay_biometric_{userId}`).

**Auth gate**: `App.tsx` watches `{ initialized, authenticated }` from `useAuth()`. When `initialized && !authenticated`, `currentScreen` is forced to `'login'`.

**`KeycloakProvider`** is placed in `main.tsx` outside `<StrictMode>` — required to prevent double-init in React 19.

**New screens**: `'login'` and `'signup'` are in the `Screen` union. Both are in the `showHeader`/`showBottomNav`/`showFloatingAvatar` exclusion lists (no chrome on auth screens).

**Express server**: `server.ts` at project root — run with `npm run server` (port 3001). Exposes `POST /api/register` which proxies user creation to Keycloak Admin REST API using `KEYCLOAK_ADMIN_SECRET`.

**Required env vars** (add to `.env`):
```
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=blitzpay
VITE_KEYCLOAK_CLIENT_ID=blitzpay-spa
KEYCLOAK_ADMIN_SECRET=<service-account-secret>   # server-side only, no VITE_ prefix
```

See `specs/001-keycloak-auth-login/quickstart.md` for Keycloak server setup steps.

## Current State

Merchant, invoice, and product data are hardcoded/mocked in components. The TrueLayer payment component is UI-only. No test suite is configured.

## Recent Changes
- 001-keycloak-auth-login: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]
