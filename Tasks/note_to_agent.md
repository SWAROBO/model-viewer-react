# Note to Next Agent: Learnings from ModelViewerCore.tsx Testing Task

This note summarizes key challenges and solutions encountered while implementing unit tests for `src/components/ModelViewerCore.tsx` and refactoring its state management. These insights should be valuable for future testing and development tasks, especially those involving PlayCanvas React components.

## 1. PlayCanvas React Component Testing in JSDOM is Tricky

-   **Comprehensive Global Mocking in `src/test-setup.tsx` is Essential**: The `@playcanvas/react` library and its sub-modules (`@playcanvas/react/components`, `@playcanvas/react/hooks`, `@playcanvas/react/scripts`, `../lib/@playcanvas/react`) are designed for a 3D engine context. Unit/integration testing them in a JSDOM environment (like Vitest) requires thorough mocking to prevent crashes and unexpected behavior.
    -   **Centralized Mocks**: It is most effective to centralize all `@playcanvas/react` related mocks in `src/test-setup.tsx` using `vi.mock` for each specific import path (e.g., `vi.mock('@playcanvas/react', ...)`, `vi.mock('@playcanvas/react/components', ...)`, etc.). This ensures that Vitest intercepts all imports from these paths and uses the mocked versions, preventing attempts to resolve real `node_modules` files and their internal dependencies.
    -   **Mocking Internal Dependencies**: Be prepared to mock internal exports like `useComponent` or `AutoRotator` if they are imported by components under test. The mock for `useApp` must also be comprehensive, including `loader` and `assets` properties with their respective methods (`getHandler`, `addHandler`, `add`, `load`).
    -   **JSX in Setup Files**: If mocks involve rendering JSX (e.g., for `Entity` or `Script` components), ensure the setup file is a `.tsx` file (e.g., `src/test-setup.tsx`) and `vite.config.mts` is updated to point to it.
    -   **Mocked Component Assertions**: When asserting on props passed to mocked components (like `Camera`, `GSplat`, `OrbitControls`), use `vi.mocked(Component).toHaveBeenCalledWith(expect.objectContaining({ ...props }), undefined);`. The `undefined` second argument is crucial as React often passes `undefined` for the `ref` argument to functional components.
    -   **Testing Actual Component Behavior**: For integration tests, avoid mocking the component under test (e.g., `ModelViewerCore`) if its children's interactions are part of the test. Instead, let the real component render and rely on global mocks for its external dependencies. Assert on the rendered DOM elements or the behavior of the real components.
    -   **`useSearchParams` Mocking**: When testing Next.js components that use `useSearchParams`, ensure `next/navigation` is mocked in `src/test-setup.tsx` to provide a mock `get` method.

## 2. Handling `Entity` Component Props

-   The `Entity` component from `@playcanvas/react` can be rendered multiple times within `ModelViewerCore.tsx`. When asserting on props like `position`, `rotation`, or `scale` passed to a specific `Entity` instance (e.g., the one wrapping `GSplat`), avoid relying on a fixed index in `mock.calls`.
-   **Dynamic Call Finding**: Use `vi.mocked(Entity).mock.calls.find(call => call[0].position && call[0].rotation && call[0].scale)` to dynamically locate the specific `Entity` call that receives these props. This makes tests more robust to changes in render order or additional `Entity` renders.
-   **Asserting on Last Render**: For components that re-render with updated props, using `vi.mocked(Component).mock.lastCall` is often the most reliable way to assert on the final props received by the component after an interaction or state update.

## 3. State Synchronization (Prop to Internal State)

-   **Problematic Pattern**: A common source of infinite re-render loops (and "JavaScript heap out of memory" errors in tests) is when a component initializes state from props (especially array/object props that get new references on every render) and then tries to "sync" that state with prop changes using `useEffect`.
-   **`JSON.stringify` Hack (Temporary Fix)**: Using `if (JSON.stringify(myState) !== JSON.stringify(myProp))` inside the `useEffect` can prevent the infinite loop by performing a deep value comparison. However, this is a hack and can be inefficient.
-   **Proper Solution: `useSyncedState` Hook**: The `src/hooks/useSyncedState.ts` custom hook was implemented to properly handle this pattern. It provides a clean, reusable way to manage state that is synced with a prop but can also be updated independently, without causing infinite loops or memory issues.
    -   **Recommendation**: For future components requiring this pattern, use `useSyncedState` instead of manual `useState`/`useEffect` combinations.

## 4. `act` Utility for Asynchronous Updates

-   Always wrap `render` calls and any subsequent state updates or asynchronous operations in `await act(async () => { ... });`. This ensures that all React updates and effects are flushed before assertions are made, preventing flaky tests due to timing issues.

## 5. Memory Issues (`JavaScript heap out of memory`)

-   If this error occurs during tests, the primary suspect is an infinite re-render loop within a component's `useEffect`s, especially when dealing with array/object dependencies that are new references on every render.
-   **Debugging Strategy**:
    1.  Isolate the problematic component/test file.
    2.  Temporarily comment out tests to narrow down the source.
    3.  Add `console.log(mockedComponent.mock.calls)` to inspect what props/arguments are actually being passed and how many times components are rendered.
    4.  Implement proper state synchronization patterns (like `useSyncedState`) or refine mocks to prevent unintended re-renders.
-   **Avoid Workarounds**: Increasing Node.js memory (`--max-old-space-size`) is a temporary workaround. Always strive to fix the underlying component or test setup issue.

## 6. "Props Testing" for Components/Hooks without Explicit Props

-   For components or hooks that do not accept explicit `props` (e.g., `ServiceWorkerRegistrar`, `SwaroboLogo`, `usePlayCanvasSetup`), "Props Testing" (as per the checklist) is considered complete if their behavior, which might depend on global objects, context, or internal logic, is thoroughly tested under various relevant conditions.
-   The existing tests for `ServiceWorkerRegistrar`, `SwaroboLogo`, `useModelData`, `usePlayCanvasSetup`, and `useSplatWithProgress` were found to be sufficient in this regard, as they covered the component/hook's reaction to different environmental states or data inputs that implicitly act as their "props."

## 7. Handling `data-testid` in Unit Tests

-   When adding `data-testid` attributes to components for E2E testing, remember that these attributes are passed as props to the underlying elements/components.
-   If you are mocking a child component and asserting on the props it receives, you must update your unit tests to expect the `data-testid` prop if it's being passed. Use `expect.objectContaining` to include the `data-testid` in your expected props.

## 8. Verifying Existing Tests

-   Before implementing new tests for a component, always check its corresponding `*.test.tsx` file. It's possible that the required tests (e.g., interaction tests) have already been implemented. If so, verify their correctness by running `npm run test` and checking the application in the browser.

## 9. Purely Presentational Components

-   For components that are purely presentational and do not manage internal state or handle user interactions (e.g., `Grid.tsx`, `ModelLoadingProgress.tsx`), "State & Interaction Testing" as defined in the checklist is not applicable. Their testing should focus on ensuring correct rendering based on the props they receive, which falls under "Props Testing."

## 10. Components Reacting to Hook States

-   For components that do not have direct user interaction but whose internal state or rendered output changes based on the return values or callbacks of custom hooks (e.g., `ModelViewer.tsx` reacting to `useSplatWithProgress`), "State & Interaction Testing" should focus on simulating these hook-driven state changes and asserting the component's response. This often involves mocking the hook's return values and using `act` to simulate updates.

## 11. Reliable Interaction Testing with Mocked Child Components

-   When testing a parent component's interaction with its mocked child components (e.g., invoking a callback prop on the mocked child), relying on `vi.mocked(ChildComponent).mock.calls.find(...)` to retrieve the callback can be unreliable due to timing or unexpected re-renders.
-   **Robust Solution**: A more robust approach is to modify the child component's mock definition to store the `onInput` (or other callback) function in a globally accessible `Map` or variable, keyed by a unique identifier (like `title` or `label` for multiple instances). The test can then directly retrieve and invoke this stored function. This ensures that the correct, most recent callback is always accessed.

## 12. Components with No UI or Direct Interaction

-   For components that do not render any UI elements and whose primary function is to perform side effects (e.g., `ServiceWorkerRegistrar.tsx`), "State & Interaction Testing" as defined in the checklist is not applicable. Testing should focus on verifying that their intended side effects occur under the correct conditions, which typically involves mocking global APIs (like `navigator.serviceWorker`) and asserting their invocation.

## 13. Interpreting "State & Interaction Testing" for Hooks and Page Components

-   For custom hooks (e.g., `useModelData.ts`, `usePlayCanvasSetup.ts`, `useSplatWithProgress.ts`), "State & Interaction Testing" should be interpreted as "Hook Testing" (checklist section 2.e). This involves testing their initial state, how they update, and the values/functions they return, often requiring heavy mocking of their dependencies.
-   For page components (e.g., `src/app/page.tsx`), "State & Interaction Testing" should be interpreted as ensuring "Basic rendering and presence of key components" (checklist section 2.m) and how the page reacts to URL parameters or other external inputs that influence its state and the props passed to its children. Direct user interaction simulation (clicks, input changes) is typically less relevant for page-level tests unless the page itself contains interactive elements not covered by child component tests.

## 14. Always Verify Existing Tests First

-   Before implementing new tests for a component or hook, always check its corresponding `*.test.tsx` or `*.test.ts` file. As demonstrated in the "Hook Testing" task, many required tests might already be implemented. Verifying existing tests by running `npm run test` and checking the application in the browser (if applicable) is crucial to avoid redundant work and ensure correctness.

By keeping these points in mind, the next agent should have a smoother experience when working on similar tasks.

## 15. Playwright E2E Testing for 3D Applications

-   **Playwright `webServer` and headless browser issues with 3D rendering**: Playwright's `webServer` might not always fully emulate a real browser environment for complex 3D rendering libraries like PlayCanvas, leading to elements being reported as "hidden" even when they are visually present in a non-headless browser.
-   **Robust E2E assertions for 3D viewers**: Instead of relying on `toBeVisible()` for the main container of a 3D viewer, it's more reliable to assert on the presence and dimensions of the `canvas` element that the 3D engine renders, with an increased timeout to account for initialization time.
-   **Separating Vitest and Playwright test runs**: It's crucial to configure `vite.config.mts` to exclude Playwright test files (`*.spec.ts`) from Vitest runs (`npm run test`) and run Playwright tests separately using `npm run test:e2e`.
-   **Installing Playwright browsers**: Remember to run `npx playwright install` if browser executables are not found.

## 16. E2E Testing for Model Loading

-   The existing `e2e/app-load.spec.ts` test can be adapted to test model loading by adding a `splatURL` query parameter to the `page.goto` call. This triggers the `useSplatWithProgress` hook and the `ModelLoadingProgress` component.
-   Creating a dummy `.splat` file (e.g., `public/test.splat`) is necessary to simulate a model load without requiring a real, large model file.
-   Assertions on the `model-loading-progress-container` to be hidden and the `canvas` element to be visible are sufficient to verify successful model loading in E2E tests.
-   **Mocking `useModelData` in Playwright**: When mocking `useModelData` using `page.addInitScript` (e.g., `window.__MOCKED_USE_MODEL_DATA__`), ensure that the `useModelData` hook itself (`src/hooks/useModelData.ts`) explicitly checks for and uses this global mock. Without this check, the hook will attempt to fetch real data, bypassing the mock and leading to test failures, especially when trying to force error states. The fix involved modifying `src/hooks/useModelData.ts` to prioritize the `window.__MOCKED_USE_MODEL_DATA__` if it exists.
