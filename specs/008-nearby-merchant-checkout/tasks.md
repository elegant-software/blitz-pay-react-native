# Tasks: Nearby Merchant Checkout

**Input**: Design documents from `/specs/008-nearby-merchant-checkout/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No dedicated automated test tasks are included because the feature spec did not request a TDD or test-first workflow. Validation is performed with `npm run lint` in `mobile/` and the manual flows documented in `quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Mobile implementation lives under `mobile/src/`
- Feature modules for this work live under `mobile/src/features/`
- Existing screens remain the view entry points under `mobile/src/screens/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the feature-first structure and shared types needed for the new merchant commerce flow

- [X] T001 Create feature module directories under `mobile/src/features/nearby-merchants/`, `mobile/src/features/merchant-catalog/`, and `mobile/src/features/basket/`
- [X] T002 [P] Create shared commerce type definitions in `mobile/src/features/nearby-merchants/types/nearbyMerchant.ts`, `mobile/src/features/merchant-catalog/types/catalog.ts`, and `mobile/src/features/basket/types/basket.ts`
- [X] T003 [P] Add shared API URL builders and response mappers for merchant commerce endpoints in `mobile/src/lib/api/merchantCommerce.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create nearby merchant data service for `/{version}/merchants/nearby` and `/{version}/geofence/regions` in `mobile/src/features/nearby-merchants/services/nearbyMerchantService.ts`
- [X] T005 [P] Create merchant branch and product catalog services for `/{version}/merchants/{merchantId}/branches` and `/{version}/merchants/{merchantId}/products` in `mobile/src/features/merchant-catalog/services/merchantCatalogService.ts`
- [X] T006 [P] Create basket store and actions for single-merchant selection state in `mobile/src/features/basket/store/basketStore.ts`
- [X] T007 Create nearby merchant view-model hook for location-driven loading and refresh orchestration in `mobile/src/features/nearby-merchants/hooks/useNearbyMerchants.ts`
- [X] T008 [P] Create merchant catalog view-model hook for branch resolution and active product loading in `mobile/src/features/merchant-catalog/hooks/useMerchantCatalog.ts`
- [X] T009 [P] Create basket view-model hook for item add/remove, quantity changes, and totals in `mobile/src/features/basket/hooks/useBasket.ts`
- [X] T010 Add shared merchant commerce loading, empty, and error translation keys to `mobile/src/lib/translations.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Discover Nearby Merchants (Priority: P1) 🎯 MVP

**Goal**: Replace mocked landing merchants with live nearby merchants driven by current location and geofence-aware refresh behavior

**Independent Test**: Open the landing screen with location permission enabled and verify nearby merchants load from the backend, remain ordered by proximity, and show a clear empty state when no merchants are returned

### Implementation for User Story 1

- [X] T011 [P] [US1] Implement nearby merchant response normalization and sorting in `mobile/src/features/nearby-merchants/services/nearbyMerchantService.ts`
- [X] T012 [US1] Implement location permission, initial fetch, and refresh state handling in `mobile/src/features/nearby-merchants/hooks/useNearbyMerchants.ts`
- [X] T013 [US1] Wire geofence-triggered merchant refresh into `mobile/src/tasks/geofenceTask.ts` and `mobile/src/features/nearby-merchants/hooks/useNearbyMerchants.ts`
- [X] T014 [US1] Replace mocked merchant cards and landing empty/loading states in `mobile/src/screens/ExploreScreen.tsx`
- [X] T015 [US1] Update navigation payloads to pass live merchant identifiers and names from discovery cards in `mobile/src/screens/ExploreScreen.tsx` and `mobile/src/types.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Browse Active Merchant Products (Priority: P2)

**Goal**: Load a selected merchant’s resolved branch and active products from the backend instead of mocked merchant detail content

**Independent Test**: Select a merchant from the live landing screen and verify the merchant detail screen resolves one active branch, loads active products, and shows a non-purchasable empty state when no products are available

### Implementation for User Story 2

- [X] T016 [P] [US2] Implement branch resolution rules and branch-to-product query orchestration in `mobile/src/features/merchant-catalog/hooks/useMerchantCatalog.ts`
- [X] T017 [P] [US2] Implement active product normalization and unavailable-catalog handling in `mobile/src/features/merchant-catalog/services/merchantCatalogService.ts`
- [X] T018 [US2] Replace mocked merchant banner and featured product content with live merchant and catalog data in `mobile/src/screens/MerchantScreen.tsx`
- [X] T019 [US2] Add empty, retry, and branch-unavailable UI states for merchant catalog loading in `mobile/src/screens/MerchantScreen.tsx`
- [X] T020 [US2] Persist resolved merchant branch context for downstream basket and checkout usage in `mobile/src/features/merchant-catalog/hooks/useMerchantCatalog.ts` and `mobile/src/features/basket/store/basketStore.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Build a Basket and Pay (Priority: P3)

**Goal**: Allow multi-product selection with quantities and pass the validated basket total into the existing checkout flow

**Independent Test**: Select multiple active products for one merchant, adjust counts, confirm the basket total updates immediately, then proceed to checkout and verify the merchant context and aggregated amount are correct

### Implementation for User Story 3

- [X] T021 [P] [US3] Implement basket item add, remove, quantity, and subtotal selectors in `mobile/src/features/basket/store/basketStore.ts`
- [X] T022 [P] [US3] Implement basket validation and checkout-context builder in `mobile/src/features/basket/hooks/useBasket.ts`
- [X] T023 [US3] Add multi-product selection controls and quantity steppers to the merchant catalog UI in `mobile/src/screens/MerchantScreen.tsx`
- [X] T024 [US3] Add basket summary, line totals, and checkout entry CTA in `mobile/src/screens/MerchantScreen.tsx`
- [X] T025 [US3] Extend checkout navigation params to carry merchant, branch, basket summary, and aggregated amount in `mobile/src/types.ts`
- [X] T026 [US3] Revalidate selected products before payment and block stale baskets with user-facing refresh messaging in `mobile/src/features/merchant-catalog/services/merchantCatalogService.ts` and `mobile/src/features/basket/hooks/useBasket.ts`
- [X] T027 [US3] Update `CheckoutScreen` to consume live basket context and preserve merchant-aware payment handoff in `mobile/src/screens/CheckoutScreen.tsx`
- [X] T028 [US3] Add required observability request, failure, and result logging for basket-to-payment handoff in `mobile/src/screens/CheckoutScreen.tsx` and `mobile/src/lib/truelayer.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, validation, and cross-story refinement

- [X] T029 [P] Remove obsolete mock merchant and product constants from `mobile/src/screens/ExploreScreen.tsx` and `mobile/src/screens/MerchantScreen.tsx`
- [X] T030 [P] Align merchant commerce copy in both languages in `mobile/src/lib/translations.ts`
- [ ] T031 Run quickstart validation flow and capture any required adjustments in `specs/008-nearby-merchant-checkout/quickstart.md`
- [X] T032 Run `npm run lint` in `mobile/package.json` and fix any type regressions across `mobile/src/features/`, `mobile/src/screens/`, and `mobile/src/types.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion and benefits from User Story 1 live merchant navigation
- **User Story 3 (Phase 5)**: Depends on Foundational completion and on User Story 2 live catalog + branch context
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Depends on live merchant selection from User Story 1 to be fully demonstrable end-to-end
- **User Story 3 (P3)**: Depends on live product loading and branch resolution from User Story 2

### Within Each User Story

- Services and hooks before screen integration
- Catalog branch resolution before product-driven basket work
- Basket validation before checkout integration
- Checkout context and observability before final validation

### Parallel Opportunities

- T002 and T003 can run in parallel after T001
- T004, T005, and T006 can run in parallel once setup is complete
- T008 and T009 can run in parallel after the corresponding services and store exist
- T011 can run in parallel with T012 once the nearby merchant service exists
- T016 and T017 can run in parallel in User Story 2
- T021 and T022 can run in parallel in User Story 3
- T029 and T030 can run in parallel during polish

---

## Parallel Example: User Story 2

```bash
# Launch branch resolution and catalog mapping work together:
Task: "Implement branch resolution rules and branch-to-product query orchestration in mobile/src/features/merchant-catalog/hooks/useMerchantCatalog.ts"
Task: "Implement active product normalization and unavailable-catalog handling in mobile/src/features/merchant-catalog/services/merchantCatalogService.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm landing merchants are live and mock discovery content is gone

### Incremental Delivery

1. Deliver live nearby merchant discovery
2. Add live merchant detail and active product browsing
3. Add basket quantities and checkout handoff
4. Finish with translation, mock cleanup, and lint/manual validation

### Parallel Team Strategy

With multiple developers:

1. One developer owns foundational nearby merchant services and hook setup
2. One developer owns merchant catalog branch/product resolution
3. One developer owns basket state and checkout handoff after catalog contracts stabilize

---

## Notes

- [P] tasks = different files, no dependencies
- [US1], [US2], [US3] labels map tasks to the three user stories in `spec.md`
- Each user story remains independently testable at its phase checkpoint
- The payment contract gap for multi-line-item orders is intentionally handled by a client-owned basket and aggregated checkout total for this feature
