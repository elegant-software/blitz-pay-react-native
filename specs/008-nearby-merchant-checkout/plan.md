# Implementation Plan: Nearby Merchant Checkout

**Branch**: `[008-nearby-merchant-checkout]` | **Date**: 2026-04-24 | **Spec**: [spec.md](/Users/mehdi/MyProject/blitz-pay-prototype/specs/008-nearby-merchant-checkout/spec.md)
**Input**: Feature specification from `/specs/008-nearby-merchant-checkout/spec.md`

**Note**: This plan covers discovery of nearby merchants from live backend data, live active product browsing, multi-item quantity selection, and checkout handoff using the app’s existing payment flows.

## Summary

Replace mocked merchant and product content in the mobile explore and merchant flows with live backend-driven discovery based on the user’s location, resolve a shopping branch for each merchant, introduce a single-merchant basket with multi-product quantities, and hand the aggregated basket total into the existing checkout experience while preserving merchant and basket context.

## Technical Context

**Language/Version**: TypeScript 5.3, React 19.2, React Native 0.83.4, Expo SDK 55  
**Primary Dependencies**: React Navigation 6, Expo Location, Expo Task Manager, Expo Secure Store, existing TrueLayer/Stripe/Braintree payment integrations  
**Storage**: Expo Secure Store for auth/session state; controlled in-memory feature state for discovery, catalog, and basket  
**Testing**: `npm run lint` in `mobile/`; manual device/simulator verification for location, merchant discovery, basket edits, and checkout handoff  
**Target Platform**: iOS and Android mobile app via Expo Dev Client / native run flows  
**Project Type**: Mobile app  
**Performance Goals**: Nearby merchant list and merchant product list should become interactable within 2 seconds on a healthy network; basket updates should feel immediate on quantity changes  
**Constraints**: No mock merchant or product data in the landing and merchant purchase flows; use backend APIs already described in `api-doc.yml`; preserve existing payment methods; add required observability on money paths; all new UI strings must ship in German and English; new business logic must follow feature-based MVVM structure  
**Scale/Scope**: One mobile shopping journey for one merchant at a time, including nearby discovery, branch-scoped product browsing, basket composition, and payment handoff

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Observability on money paths**: PASS. Plan requires request/failure/result telemetry on basket-to-checkout handoff and on any new payment-init code paths.
- **Never swallow provider reasons**: PASS. Existing payment wrappers remain authoritative; new integration work will preserve raw backend/provider reasons before mapping to UI errors.
- **Single source of truth for env config**: PASS. Existing `mobile/src/lib/config.ts` remains the only source for backend and payment configuration.
- **Native config changes via Expo config only**: PASS. No native config changes are planned.
- **i18n in lockstep**: PASS. Any new merchant, basket, empty-state, and error strings will be added to both mobile language maps.
- **Feature-based MVVM architecture**: PASS with migration note. New discovery, catalog, and basket logic will be introduced under feature folders and consumed by existing screens as thin views.
- **Simplicity over abstraction**: PASS. Scope is limited to one merchant, one resolved branch, and one basket per session; no speculative cross-merchant cart or server-side order abstraction is introduced.

## Project Structure

### Documentation (this feature)

```text
specs/008-nearby-merchant-checkout/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── mobile-commerce-api.md
└── tasks.md
```

### Source Code (repository root)

```text
mobile/
├── src/
│   ├── navigation/
│   ├── screens/
│   │   ├── ExploreScreen.tsx
│   │   ├── MerchantScreen.tsx
│   │   └── CheckoutScreen.tsx
│   ├── lib/
│   │   ├── api/
│   │   ├── observability.ts
│   │   └── config.ts
│   ├── features/
│   │   ├── nearby-merchants/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   └── types/
│   │   ├── merchant-catalog/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   └── types/
│   │   └── basket/
│   │       ├── hooks/
│   │       ├── store/
│   │       └── types/
│   ├── services/
│   └── types/
└── package.json
```

**Structure Decision**: Keep existing navigation and screen files as view entry points, but add new feature-first modules for nearby merchants, merchant catalog, and basket state so the implementation complies with the repo’s MVVM constitution without rewriting unrelated screens.

## Phase 0: Research

1. Confirm the canonical nearby merchant source for the landing screen.
2. Decide how geofence events influence merchant discovery without making the UI dependent on a non-authoritative local region list.
3. Define the branch resolution rule needed for branch-scoped product queries.
4. Decide how a multi-item basket maps onto the current amount-driven checkout APIs.
5. Define an incremental feature-structure approach that fits the current mobile codebase.

## Phase 1: Design & Contracts

1. Model nearby merchants, branches, active products, basket items, and checkout context.
2. Document the backend contracts the mobile client will call for nearby discovery, branch resolution, product listing, and payment handoff.
3. Provide a quickstart for manual validation on device/simulator with seeded backend data.
4. Update agent context after plan artifacts are written.
5. Re-check the constitution after design completion.

## Post-Design Constitution Check

- **Observability on money paths**: PASS. Design keeps basket composition separate from payment execution and requires telemetry at checkout initiation, failure, and terminal result.
- **Single source of truth for config**: PASS. All backend and payment endpoints remain driven from config rather than inline constants.
- **Feature-based MVVM architecture**: PASS. Design introduces feature modules for data access, orchestration, and store ownership while retaining screens as views.
- **i18n completeness**: PASS. Design includes empty, loading, refresh, quantity, and basket validation states that must be added to both languages.
- **Simplicity over abstraction**: PASS. Basket scope remains single-merchant and client-owned; no extra backend order service is introduced in this feature.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations requiring justification.
