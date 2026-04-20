# React Native Architecture Guidelines (BlitzPay)

## Purpose
This document defines the standard architecture for all React Native applications within BlitzPay.  
The goal is to ensure scalability, maintainability, and consistency across teams and products.

---

## Core Principles

1. **Feature-first organization**
    - Code is grouped by business capability, not by file type.
    - Each feature is self-contained and independently evolvable.

2. **Separation of concerns**
    - UI, logic, and data access must be clearly separated.
    - Business logic must not live inside UI components.

3. **Scalability over simplicity**
    - Prefer structure that scales to multiple teams and products.
    - Avoid shortcuts that create long-term coupling.

4. **Testability**
    - Logic should be testable without rendering UI.
    - Side effects should be isolated.

---

## Recommended Architecture

We adopt a hybrid approach combining:

- **Feature-Based Structure** — code organised by business capability
- **MVVM (Model–View–ViewModel)** — clear separation of UI, orchestration, and data
- **Controlled State Management** — state owned at the right layer; no uncontrolled global mutations

---

## Folder Structure

```
/src
  /app                  # App setup (navigation, providers, theme)
  /shared               # Reusable modules across features
    /components
    /hooks
    /utils
    /types

  /features
    /auth
      /components
      /screens          # View
      /hooks            # ViewModel
      /services         # Model (API calls)
      /store            # Controlled state (Redux slice / Zustand store)
      /types
    /payments
      /components
      /screens
      /hooks
      /services
      /store
      /types
    /parking
    /pos
    /invoicing
```

---

## Layer Responsibilities

### 1. Presentation Layer (View)
- Location: `components/`, `screens/`
- Responsibilities:
    - Rendering UI
    - Handling user interaction
    - Calling ViewModel hooks

**Rules:**
- No API calls
- No business logic
- Keep components as dumb as possible

---

### 2. ViewModel Layer (Hooks)
- Location: `hooks/`
- Responsibilities:
    - Business logic
    - State orchestration
    - Calling services
    - Preparing UI-ready data

**Example:**
```ts
export const usePayment = () => {
  const { createPayment } = usePaymentService();

  const pay = async (amount: number) => {
    return await createPayment(amount);
  };

  return { pay };
};
```

**Rules:**
- No JSX / UI imports
- Returns only what the View needs (derived, UI-ready state)
- May read from and dispatch to the feature store

---

### 3. Model Layer (Services)
- Location: `services/`
- Responsibilities:
    - All API / SDK calls
    - Data transformation and normalisation
    - Error mapping to domain errors

**Example:**
```ts
export const usePaymentService = () => {
  const createPayment = async (amount: number): Promise<PaymentResult> => {
    const res = await fetch('/api/payments', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new DomainError('payment_failed', await res.text());
    return res.json();
  };

  return { createPayment };
};
```

**Rules:**
- No UI state, no navigation
- Throws typed domain errors — never raw `fetch` errors
- Stateless; all state lives in the store

---

### 4. Controlled State Management (Store)
- Location: `store/` inside each feature
- Responsibilities:
    - Own the feature's runtime state
    - Expose controlled actions / selectors (Redux slices or Zustand stores)
    - No direct mutation from Views — all writes go through actions

**Rules:**
- State shape is defined per-feature; cross-feature state goes in `/app/store`
- Selectors must be the only read path (no direct `state.someFeature.x` in components)
- Async side effects live in the ViewModel, not the store

---

## Data Flow

```
View (screen/component)
  ↓  calls
ViewModel (hook)
  ↓  calls          ↕ reads/dispatches
Service (API)     Store (state)
```

1. **View** calls a ViewModel hook on user action.
2. **ViewModel** calls the Service and dispatches the result to the Store.
3. **View** re-renders from Store selectors exposed by the ViewModel.

---

## Enforcement

- PRs that place API calls in a screen component or business logic in a service will be rejected in review.
- New features must mirror the folder structure above; deviations require a note in the PR explaining the constraint.
- This document is binding. Amendments require updating this file and `CONSTITUTION.md` in the same PR.