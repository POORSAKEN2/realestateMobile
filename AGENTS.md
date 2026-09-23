# Agent instructions for realestateMobile

This repository is Terrane's Expo/React Native application. These instructions guide work **only when a user requests the corresponding task**. The nine workflows below are not a standing request to build an app, clone a site, redesign screens, or change unrelated code. Bracketed phrases such as `[app name]`, `[technology]`, `[website URL]`, and `[feature name]` are inputs that must come from the user's request; never treat them as literal requirements or invent their values.

## Project context and working principles

- Follow the existing TypeScript, Expo Router, React Native, NativeWind/styling, component, hook, service, API, and navigation patterns before introducing new ones. This app also targets web, but do not assume that a website request authorizes replacing or rebuilding the mobile app as a web app.
- Orient yourself in the relevant parts of the repository before editing. Routes and layouts live in `app/`; shared UI belongs in `components/`; screen state and reusable behavior generally belong in `hooks/` or `context/`; API calls and integration logic belong in `api/` or `services/`; shared contracts and constants belong in `types/` and `constants/`. Prefer the existing location and conventions for the feature being changed.
- Apply SOLID principles pragmatically. Keep each module focused, separate presentation from data access and business rules, use clear interfaces at meaningful boundaries, and prefer composition over large conditional components. Do not add abstractions that make a simple change harder to follow.
- Reuse existing components, hooks, services, types, styles, tokens, and utilities where they fit. Avoid duplicating business rules, request handling, and UI patterns. Keep names descriptive and files easy to navigate.
- Consider time and space complexity. Avoid repeated full-list scans during render, redundant network requests, avoidable rerenders, unbounded in-memory collections, and unnecessary transformations. Optimize where the scale or measured behavior warrants it; do not sacrifice clarity for speculative micro-optimizations.
- Preserve existing behavior unless the request explicitly changes it. Account for loading, empty, error, success, retry, and disabled states in affected flows. Make visible controls perform real actions; a static screen, placeholder handler, mock response, or passing unit test alone does not make a feature functional.
- Respect existing authentication, permissions, subscription/access rules, and backend contracts. UI hiding is not a substitute for server-side authorization. When work spans the adjacent backend, verify the current contract and change the backend only when the request calls for it or when it is necessary to make the requested flow functional.
- Make the smallest coherent change that fulfills the request. Do not use a broad cleanup task as permission to remove unrelated code or rewrite stable features. Preserve user changes in the working tree.
- Verify in proportion to the change: use focused tests, the available Node tests in `tests/`, TypeScript checking (`npx tsc --noEmit`), and platform/runtime checks when relevant and feasible. Check the repository's actual scripts before invoking them; `package.json` does not define a generic `test` or `lint` script. Report what passed, what was not run, and any remaining limitations. Distinguish code/test evidence from native-device, store, server, or external-service verification.

## Workflow for any requested implementation

1. Establish the user's requested scope, target platform, relevant acceptance criteria, and existing behavior to preserve. If a missing choice would materially change the result, ask; otherwise make a reasonable, stated assumption.
2. Inspect the affected routes, components, hooks, services, contracts, tests, and documentation. Trace existing data and navigation paths before changing them.
3. Implement a complete vertical slice: UI, state, data access, validation, error handling, and navigation/integration as applicable. Favor focused modules and reusable pieces.
4. Verify important paths and regressions with the checks available in this repository. For visual work, inspect the result at the relevant screen sizes/platforms when possible.
5. Report the outcome concisely, including changed behavior, verification performed, anything incomplete or unverified, and any follow-up requiring the user's action.

## Task-specific workflows

### 1. Build a full app

Use this workflow only when asked to build a complete app, such as “Build a complete `[app name]` using `[technology]`.”

- Confirm the requested app concept, technology, target platforms, users, essential features, and any supplied design or data requirements. If these are already clear, proceed without unnecessary clarification.
- Map the main user journeys before implementation: entry/onboarding or sign-in if required, primary navigation, core create/read/update/delete or transaction flows, account/settings where relevant, and recovery from expected errors.
- Implement a modern, coherent UI with consistent typography, spacing, color, accessibility, safe-area behavior, and responsive layouts appropriate to the requested platforms. For this repository, use Expo/React Native conventions unless the user explicitly requests a different target or technology.
- Build the functional paths end to end. Connect controls to real state, persistence, services, or APIs; validate input; provide feedback for loading and failures; and ensure navigation works. Avoid decorative controls that appear interactive but do nothing.
- Keep code modular and reusable. Avoid placeholders, fake success states, and hardcoded sample data unless unavoidable or explicitly requested. Clearly identify any remaining mock or incomplete integration.
- Test the essential journeys and relevant platform behavior. Do not describe the app as complete if a required flow is only a visual stub or depends on unavailable credentials/services.

### 2. Clone a website

Use this workflow only when given a reference website and explicitly asked to recreate it.

- Inspect the provided URL or reference assets before implementing. Identify page structure, hierarchy, typography, color, spacing, imagery, breakpoints, responsive behavior, navigation, forms, hover/focus states, and interaction details.
- Clarify the target when it is ambiguous: cloning a website into this mobile repository could mean Expo web, a mobile-native adaptation, or a separate web implementation. Do not silently replace existing mobile flows.
- Match the reference as closely as the authorized platform allows. Reuse existing assets and design primitives where appropriate; do not copy inaccessible or unlicensed assets without considering their usage rights.
- Make layouts responsive for the requested viewport sizes. For web targets, account for mobile and desktop; for native targets, adapt the layout to touch interaction, safe areas, and device sizes rather than pretending desktop hover behavior exists.
- Implement visible buttons, links, menus, forms, and other interactions. Route them to real destinations or behavior; explicitly disclose any reference behavior that cannot be reproduced because its backend or assets are unavailable.
- Compare the finished output with the reference at representative sizes and correct the most visible discrepancies before handing it off.

### 3. Fix bugs in my project

Use this workflow when asked to diagnose and fix bugs, including a broad project-wide bug-fix request.

- Reproduce or otherwise establish evidence for each important issue. Review errors, affected flows, recent changes, tests, and relevant API contracts; do not infer a root cause from a symptom alone.
- For a project-wide request, triage by severity and user impact. Inspect the major functional areas systematically, but distinguish confirmed bugs from suspected issues and pre-existing limitations.
- Explain the root cause of significant confirmed issues in plain language, then make a focused fix at the correct layer. Add or update regression tests where practical.
- Preserve unrelated behavior. Remove duplicate or unnecessary code only when it is demonstrably safe and within the requested cleanup scope. Avoid unrelated rewrites during debugging.
- Re-run the reproduction path and affected tests. If a device, account, backend, or external service is required but unavailable, state exactly what remains unverified rather than claiming the bug is fully resolved.

### 4. Improve my existing project

Use this workflow when asked to improve specified parts of the app or the project overall while preserving behavior.

- Establish a baseline for the requested areas: code quality, UX, accessibility, performance, maintainability, or structure. Prioritize changes with clear user or developer value.
- Preserve the app's features, data semantics, routes, visual identity, and public interfaces unless the user asks to change them. Record any intentional behavior changes.
- Improve weak implementations through clearer ownership of state and business logic, reusable components, consistent design patterns, better feedback and accessibility, and simpler data flows.
- Measure or substantiate performance concerns before adding complexity. Address wasteful renders, repeated requests, inefficient list work, and unnecessary asset weight where relevant.
- Verify the main affected flows before and after changes. Describe concrete improvements and any tradeoffs; do not label an unverified broad cleanup as a complete project overhaul.

### 5. Add a new feature

Use this workflow when asked to add `[feature name]` to the existing app.

- Read the adjacent flow before editing: relevant screens, routes, components, hooks, services, API types, permissions, plan gates, and tests. Confirm how the new feature should fit into existing navigation and design.
- Define the feature's inputs, outputs, states, permissions, and failure modes. Reuse existing contracts and UI patterns, adding new interfaces or abstractions only where they clarify responsibilities.
- Integrate the feature end to end. Wire visible controls to real actions and data; handle validation, loading, empty results, errors, retries, success feedback, and cleanup where applicable.
- Keep client and server responsibilities separate. When the feature needs backend changes, verify the backend contract and authorization rather than relying on client-side checks.
- Add focused tests for critical behavior and check nearby flows for regressions. Call out dependencies such as unavailable credentials, store configuration, or external deployment that prevent full runtime verification.

### 6. Build a landing page

Use this workflow only when a landing page is explicitly requested; it is not a default addition to this mobile app.

- Establish the product or service, target audience, primary conversion action, brand constraints, and target platform. Determine whether this belongs in Expo web or another explicitly requested surface.
- Create a clear narrative: strong headline and supporting copy, product value, relevant proof or benefits, concise sections, and prominent calls to action. Keep copy accurate; do not invent testimonials, metrics, or guarantees.
- Make the design modern, responsive, accessible, and easy to scan. Support keyboard and screen-reader use on web, and optimize images and layout for reasonable load performance.
- Ensure calls to action, navigation, and forms work and have appropriate success/error feedback. If an external destination is unavailable, disclose that dependency instead of silently using a dead link.
- Check the page at mobile and desktop sizes and verify its main conversion path.

### 7. Build an admin dashboard

Use this workflow only when an admin dashboard is explicitly requested.

- Establish the intended administrators, allowed actions, data sources, definitions of metrics, and permission boundaries. Do not treat the word “admin” as authorization to expose all data.
- Provide an appropriate information hierarchy: overview cards, useful charts, searchable/sortable tables, filters, and key actions when the underlying data and use case support them. Avoid charts or cards that merely decorate the screen.
- Connect metrics and tables to real data or clearly label unavailable/demo data. Handle loading, empty, error, refresh, pagination, filter-reset, and stale-data states as applicable.
- Keep controls intuitive and functional, including drill-down navigation, filters, and actions. Confirm important or destructive actions and reflect results in the UI.
- Consider mobile/tablet layouts and accessibility. Avoid expensive client-side processing or unrestricted data fetches for large datasets; prefer backend pagination and aggregation where supported.
- Verify role-specific visibility and the main dashboard actions. Remember that server-side authorization must protect the data and mutations.

### 8. Refactor my codebase

Use this workflow when explicitly asked to refactor code while preserving behavior.

- Identify specific duplication, complexity, unclear boundaries, or navigation/file-organization problems before changing structure. Keep a clear boundary between refactoring and new feature work.
- Refactor in coherent increments: extract focused modules, clarify names and interfaces, consolidate duplicated logic, simplify control flow, and place files according to established project conventions.
- Preserve existing functionality, API behavior, navigation, state transitions, and user-facing copy unless the user authorizes a change. Avoid introducing abstraction layers solely to satisfy a pattern.
- Run relevant tests and TypeScript checks after each substantial change; add characterization tests for fragile behavior when needed. Inspect the diff for accidental behavior changes.
- State any areas deliberately left untouched because a safe refactor requires more context or runtime access.

### 9. Add tests and documentation

Use this workflow when asked to improve test coverage and project documentation.

- Identify critical user flows and business rules first, then prioritize tests for high-risk behavior, regressions, validation, permissions, and error paths. Use the repository's existing test conventions in `tests/` and add new tooling only when justified.
- Write deterministic, meaningful tests that exercise observable behavior. Keep mocks at external boundaries, avoid tests that simply duplicate implementation details, and ensure failures point to a useful cause.
- Document actual setup and usage: prerequisites, environment configuration without secrets, local run commands, platform-specific steps, core architecture, relevant API dependencies, and test commands. Update existing docs instead of creating competing versions when possible.
- Keep examples and claims aligned with implemented behavior. Do not document a placeholder or unverified external setup as a finished feature.
- Run the new tests and review the documentation by following its steps where feasible. Report coverage or environment limits honestly.
