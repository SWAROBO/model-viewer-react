# Note to Next Agent: Learnings from ModelViewerCore.tsx Testing Task

This note summarizes key challenges and solutions encountered while implementing unit tests for `src/components/ModelViewerCore.tsx` and refactoring its state management. These insights should be valuable for future testing and development tasks, especially those involving PlayCanvas React components.

## 1. PlayCanvas React Component Testing in JSDOM is Tricky

-   **Comprehensive Mocking is Essential**: The `@playcanvas/react` library and its sub-modules (`@playcanvas/react/components`, `../lib/@playcanvas/react`) are designed for a 3D engine context. Unit testing them in a JSDOM environment (like Vitest) requires thorough mocking to prevent crashes and unexpected behavior.
    -   **Explicit Mocks**: Ensure explicit `vi.mock` calls for each specific import path used by the component (e.g., `vi.mock('@playcanvas/react', ...)`, `vi.mock('@playcanvas/react/components', ...)`, `vi.mock('../lib/@playcanvas/react', ...)`). Relying solely on `_mocks_` directory structure for complex packages might not be sufficient, as internal module resolutions can still fail.
    -   **Mocked Component Assertions**: When asserting on props passed to mocked components (like `Camera`, `GSplat`, `OrbitControls`), use `vi.mocked(Component).toHaveBeenCalledWith(expect.objectContaining({ ...props }), undefined);`. The `undefined` second argument is crucial as React often passes `undefined` for the `ref` argument to functional components.

## 2. Handling `Entity` Component Props

-   The `Entity` component from `@playcanvas/react` can be rendered multiple times within `ModelViewerCore.tsx`. When asserting on props like `position`, `rotation`, or `scale` passed to a specific `Entity` instance (e.g., the one wrapping `GSplat`), avoid relying on a fixed index in `mock.calls`.
-   **Dynamic Call Finding**: Use `vi.mocked(Entity).mock.calls.find(call => call[0].position && call[0].rotation && call[0].scale)` to dynamically locate the specific `Entity` call that receives these props. This makes tests more robust to changes in render order or additional `Entity` renders.

## 3. State Synchronization (Prop to Internal State)

-   **Problematic Pattern**: A common source of infinite re-render loops (and "JavaScript heap out of memory" errors in tests) is when a component initializes state from props (especially array/object props that get new references on every render) and then tries to "sync" that state with prop changes using `useEffect`.
    ```typescript
    // Problematic pattern
    const [myState, setMyState] = useState(myProp);
    useEffect(() => { setMyState(myProp); }, [myProp]); // myProp is new reference every render
    ```
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

By keeping these points in mind, the next agent should have a smoother experience when working on similar tasks.
