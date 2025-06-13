# Note to Next Agent: Learnings from ModelViewerCore.tsx Testing Task

This note summarizes key challenges and solutions encountered while implementing unit tests for `src/components/ModelViewerCore.tsx` and refactoring its state management. These insights should be valuable for future testing and development tasks, especially those involving PlayCanvas React components.

## 1. PlayCanvas React Component Testing in JSDOM is Tricky

-   **Comprehensive Mocking is Essential**: The `@playcanvas/react` library and its sub-modules (`@playcanvas/react/components`, `../lib/@playcanvas/react`) are designed for a 3D engine context. Unit testing them in a JSDOM environment (like Vitest) requires thorough mocking to prevent crashes and unexpected behavior.
    -   **Explicit Mocks**: Ensure explicit `vi.mock` calls for each specific import path used by the component (e.g., `vi.mock('@playcanvas/react', ...)`, `vi.mock('@playcanvas/react/components', ...)`, `vi.mock('../lib/@playcanvas/react', ...)`). Relying solely on `_mocks_` directory structure for complex packages might not be sufficient, as internal module resolutions can still fail.
    -   **Mocked Component Assertions**: When asserting on props passed to mocked components (like `Camera`, `GSplat`, `OrbitControls`), use `vi.mocked(Component).toHaveBeenCalledWith(expect.objectContaining({ ...props }), undefined);`. The `undefined` second argument is crucial as React often passes `undefined` for the `ref` argument to functional components.

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

By keeping these points in mind, the next agent should have a smoother experience when working on similar tasks.
