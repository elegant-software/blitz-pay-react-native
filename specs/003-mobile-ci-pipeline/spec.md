# Feature Specification: Mobile CI/CD Alignment — BlitzPay Mobile Pipeline

**Feature Branch**: `003-mobile-ci-pipeline`
**Created**: 2026-04-02
**Status**: Draft
**Input**: User description: "Align the mobile React Native workflow with a standard Expo/EAS CI/CD pattern so that JS checks, device tests, cloud builds, and distribution steps all have explicit coverage."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent JavaScript Quality Gate (Priority: P1)
A developer or reviewer triggers the mobile workflow (either manually or via a downstream call) and immediately sees whether the Expo app still passes lint, TypeScript, and npm test coverage before any build or release steps proceed.

**Why this priority**: Quality regressions in the React Native codebase are cheapest to catch before the native artifacts are produced. Without a strict JS gate the team risks shipping broken UI, type errors, or failing tests.

**Independent Test**: Run the `quality` job in isolation (the only required job) and verify that linting, TypeScript checking, and the placeholder test command all succeed. If any step fails, the job aborts before reaching build or distribution.

**Acceptance Scenarios**:

1. **Given** the repo is checked out, **When** the `quality` job runs, **Then** it runs lint, typecheck, `npm test` (even if a placeholder), and `expo-doctor` in that order without depending on downstream jobs.
2. **Given** the TypeScript or lint script is missing in `package.json`, **When** the job is recalculated, **Then** it fails fast with a clear message referencing the missing script before the installer completes.
3. **Given** the commands all succeed, **When** the job finishes, **Then** the workflow can proceed to builds or additional jobs because the `needs` relationship is satisfied.

---

### User Story 2 - Optional Device/Emulator Coverage (Priority: P2)
A QA engineer needs to run instrumented device or emulator tests using Maestro flows on demand without touching the default CI path; they trigger the job via the `run-device-tests` input and watch a dedicated macOS runner exercise the configured script (with Detox left as a future option when deeper white-box tests are necessary).

**Why this priority**: Device tests are expensive and fragile, so they should only run when the team asks for them. However, they must be easy to trigger when regression or release candidates require extra validation.

**Independent Test**: Invoke the workflow with `run-device-tests` enabled and verify that a macOS job starts, installs the same dependencies as the `quality` job, and runs the `test:device` script (which currently reports that device tests are not configured yet).

**Acceptance Scenarios**:

1. **Given** `run-device-tests` is `true`, **When** the workflow reaches the device job, **Then** it runs the macOS-based job, installs dependencies, and executes the `test:device` script (Maestro flow placeholders for now, with Detox as a future replacement) before reporting success.
2. **Given** `run-device-tests` is `false`, **When** the workflow triggers, **Then** the device job is skipped entirely so downstream jobs still have valid inputs.
3. **Given** the device script logs a placeholder message, **When** the job finishes, **Then** the log includes instructions about the next steps (e.g., add Detox/Maestro configuration) so the team can extend it without changing the workflow again.

---

### User Story 3 - Expo/EAS Build and Distribution (Priority: P3)
A release owner triggers the workflow with `run-eas-build` and optional distribution flags so that Expo builds run in the cloud (Android `.aab` and iOS `.ipa`), followed by an optional EAS Update publish and optional store submission when credentials are attached.

**Why this priority**: Building native output on every run is expensive, so the team gates it behind `run-eas-build`, but once a build exists, publishing the artifact to testers or the public is the only way to demonstrate progress.

**Independent Test**: With `run-eas-build` enabled and `EXPO_TOKEN` set, run the workflow and confirm the EAS build job produces artifacts for the requested platform(s). If the maintainer also flips `run-eas-update` or `submit-to-app-stores`, verify that the additional jobs run only when the necessary GitHub secrets exist.

**Acceptance Scenarios**:

1. **Given** `run-eas-build` is `true` and `EXPO_TOKEN` is provided, **When** the build job executes, **Then** it builds the Expo app for the selected platform, surfaces the build ID, and passes the `needs` requirement for downstream jobs.
2. **Given** `run-eas-update` is `true`, **When** the update job runs, **Then** it publishes an EAS Update to a branch derived from the current git ref (or `preview` fallback) using the same Expo token.
3. **Given** `submit-to-app-stores` is `true` and all store secrets are available, **When** the store submission job runs, **Then** it launches EAS Submit for Android and iOS, writes the Google service account JSON to disk, and supplies the Apple app-specific password so the submission can succeed.

---

### Edge Cases

- What happens when `EXPO_TOKEN` is unset but `run-eas-build` is `true`? The EAS build job is skipped with a clear log telling the maintainer to provision a token (and no downstream jobs run because `needs` fail).  
- What happens if the team forgets to define `lint`, `typecheck`, or `test` scripts? The `quality` job now exits before running builds, and the log explains which script is missing.  
- What happens if `submit-to-app-stores` is enabled but store secrets are missing? The store job is skipped, and the final log explicitly states which secret(s) are required.  
- What happens when device tests are requested but not yet wired to Detox or Maestro? The placeholder script logs a short explanation with pointers and exits successfully so the workflow still reports a successful run.  
- What happens when a maintainer triggers the workflow from a fork or non-standard ref? The EAS Update job resolves the branch name from `github.ref_name` and uses `preview` as fallback, avoiding an empty branch argument.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `quality` job must run lint, TypeScript checking, the configured npm test script, and `expo-doctor` on every execution before any build or distribution jobs start.
- **FR-002**: The workflow must expose a `run-device-tests` toggle that spawns a macOS job, installs the same dependencies, and runs `test:device` so device regressions can be validated when needed.
- **FR-003**: The workflow must trigger EAS cloud builds (Android `.aab` and/or iOS `.ipa`) when `run-eas-build` is enabled and `EXPO_TOKEN` is supplied.
- **FR-004**: The workflow must publish an EAS Update via `eas update` when `run-eas-update` is enabled and the Expo token is provided so testers can receive OTA updates.
- **FR-005**: The workflow must submit artifacts to Google Play and App Store Connect through `eas submit` when `submit-to-app-stores` is enabled and the required secrets (`GOOGLE_SERVICE_ACCOUNT_JSON`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`) are populated.
- **FR-006**: The Expo/mobile package directory must expose `lint`, `typecheck`, `test`, and `test:device` scripts so the jobs can execute predictable commands without runtime errors.
- **FR-007**: Every optional job must skip gracefully when either the corresponding input is `false` or the required secrets are missing; the workflow should log which condition caused the job to skip.

### Key Entities *(include if feature involves data)*

- **Quality Job**: The canonical pipeline stage that validates JS quality.  
- **Device Tests Job**: A macOS-only runner that executes `test:device` when requested.  
- **EAS Build Job**: Runs cloud builds for Android and/or iOS via Expo Application Services.  
- **EAS Update Job**: Publishes an EAS Update branch for tester distribution when requested.  
- **Store Submission Job**: Uses `eas submit` to deliver builds to Google Play and TestFlight when credentials are provided.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The `quality` job completes within 15 minutes with `lint`, `typecheck`, `npm test`, and `expo-doctor` finishing successfully and logging the commands executed.
- **SC-002**: When `run-device-tests` is `true`, the device job starts on a macOS runner, installs dependencies, executes `test:device` (even if it currently logs a placeholder), and exits cleanly in under 20 minutes.
- **SC-003**: When `run-eas-build` is `true`, the EAS build job finishes with at least one build ID reported for each requested platform (`android`, `ios`, or `all`).
- **SC-004**: When `run-eas-update` is `true`, the update job publishes to the branch derived from `github.ref_name` (or `preview`) and prints the update ID in the log; failure or missing tokens abort the job clearly.
- **SC-005**: When `submit-to-app-stores` is `true` and all store secrets are present, the store submission job invokes `eas submit` for both Google Play and App Store Connect, writing the Google key to disk and supplying the Apple app-specific password without exposing secrets in logs.

## Assumptions

- The Expo mobile app lives in the provided `app-directory`; running jobs inside that directory is sufficient for configuration validation, linting, and building.  
- The placeholder `test` and `test:device` scripts only log guidance today; future efforts will replace them with Detox/Maestro suites without modifying the workflow structure.  
- Store submission requires secrets, so the team will only flip `submit-to-app-stores` to `true` when they have uploaded `GOOGLE_SERVICE_ACCOUNT_JSON`, `APPLE_ID`, and `APPLE_APP_SPECIFIC_PASSWORD` to GitHub Secrets.  
- EAS Update uses the current git reference name (or `preview`), and the team will maintain meaningful branch names so OTA updates can be grouped per branch.  
- The Expo/EAS tooling is compatible with Node.js 20, which is already the default for the workflow.
- Device/emulator coverage will initially rely on Maestro flow scripts (via `test:device`), but there is room to switch to Detox later if deeper white-box automation becomes necessary.
