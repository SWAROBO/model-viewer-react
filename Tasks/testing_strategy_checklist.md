# Testing Strategy Checklist for Model Viewer React Project

This checklist outlines the steps to implement comprehensive unit, integration, and end-to-end (E2E) tests for the `model-viewer-react` project, ensuring they can be integrated into a CI/CD pipeline.

## 1. Test Environment Setup & Configuration

-   [ ] **Verify Vitest Configuration:**
    -   [ ] Ensure `vitest.config.ts` (or equivalent in `vite.config.mts` or `package.json`) is correctly set up for React, TypeScript, and JSX.
    -   [ ] Confirm `jsdom` or a similar environment is configured for DOM testing.
    -   [ ] Review and extend existing mocks for PlayCanvas (`@playcanvas/react` and its submodules) to cover all used components/functions. Ensure mocks are comprehensive and prevent WebGL/browser-specific errors during tests.
-   [ ] **Install/Update Testing Libraries:**
    -   [ ] Ensure `@testing-library/react`, `@testing-library/jest-dom` (if not implicitly included via Vitest setup), and `vitest` are up-to-date.
    -   [ ] For E2E tests, decide on a framework (e.g., Playwright, Cypress). Install and configure it. Playwright is often preferred for Next.js due to its good integration.
-   [ ] **Setup Test Utilities:**
    -   [ ] Create helper functions for common testing scenarios (e.g., rendering components with providers, custom mock setups).
    -   [ ] Define a clear file naming convention for test files (e.g., `*.test.tsx`, `*.spec.tsx`). The existing `page.test.tsx` suggests `*.test.tsx`.

## 2. Unit Tests

*Focus: Test individual components, hooks, and utility functions in isolation.*

-   [ ] **`src/components`:**
    -   [ ] **`AutoRotate.tsx`**:
        -   [ ] Test if it renders correctly.
        -   [ ] Mock any PlayCanvas dependencies and verify interactions if applicable (e.g., if it calls a function to start/stop rotation).
    -   [ ] **`ModelLoadingProgress.tsx`**:
        -   [ ] Test rendering with different progress values (0%, 50%, 100%).
        -   [ ] Test visibility based on loading state.
    -   [ ] **`ModelViewer.tsx`**:
        -   [ ] Test basic rendering.
        -   [ ] Mock `ModelViewerCore` and other child components.
        -   [ ] Test prop passing to `ModelViewerCore`.
    -   [ ] **`ModelViewerCore.tsx`**:
        -   [ ] This is a complex component. Test its core logic, possibly breaking it down.
        -   [ ] Mock PlayCanvas application and entity setup.
        -   [ ] Test conditional rendering of features like auto-rotate, splat handling.
        -   [ ] Test event handling (e.g., model load, error).
    -   [ ] **`SwaroboLogo.tsx`**:
        -   [ ] Test if it renders the logo SVG.
-   [ ] **`src/hooks`:**
    -   [ ] **`useModelData.ts`**:
        -   [ ] Mock `fetch` or any data fetching mechanism.
        -   [ ] Test successful data fetching and parsing.
        -   [ ] Test error handling during data fetching.
        -   [ ] Test different states (loading, success, error).
    -   [ ] **`usePlayCanvasSetup.ts`**:
        -   [ ] Mock PlayCanvas `pc.Application` and related setup calls.
        -   [ ] Test initialization logic.
        -   [ ] Test cleanup logic (e.g., `app.destroy()`).
    -   [ ] **`useSplatWithProgress.ts`**:
        -   [ ] Mock PlayCanvas splat loading and `CustomSplatHandler`.
        -   [ ] Test progress updates.
        -   [ ] Test successful splat loading.
        -   [ ] Test error handling.
-   [ ] **`src/lib/playcanvas/CustomSplatHandler.ts`**:
    -   [ ] If it contains complex logic independent of PlayCanvas runtime, test those parts.
    -   [ ] Mock any `pc` dependencies if necessary.

## 3. Integration Tests

*Focus: Test interactions between components and how they work together.*

-   [ ] **Model Loading Flow:**
    -   [ ] Test the interaction between `ModelViewer`, `ModelViewerCore`, `useModelData`, and `useSplatWithProgress`.
    -   [ ] Simulate a model URL being provided and verify that `ModelLoadingProgress` shows, then hides, and the (mocked) model appears.
-   [ ] **`src/app/page.tsx`:**
    -   [ ] Expand `page.test.tsx` to cover more interactions.
    -   [ ] Test that `ModelViewer` is rendered with default props.
    -   [ ] If there are user interactions on the page that affect the model viewer (e.g., changing model URL via UI elements if added later), test these.
-   [ ] **Component Composition:**
    -   [ ] Test how `ModelViewer` integrates `AutoRotate` and other sub-components, verifying props are passed correctly and (mocked) interactions occur as expected.

## 4. End-to-End (E2E) Tests

*Focus: Test user flows from the perspective of a user interacting with the application in a browser.*
*Chosen Framework: (Decide: Playwright or Cypress)*

-   [ ] **Setup E2E Framework:**
    -   [ ] Install and configure the chosen E2E testing framework (e.g., Playwright).
    -   [ ] Add scripts to `package.json` for running E2E tests (e.g., `test:e2e`).
-   [ ] **Basic Page Load Test:**
    -   [ ] Test that the main page (`/`) loads correctly.
    -   [ ] Verify that the `ModelViewer` component is present on the page.
    -   [ ] Check for any console errors on page load.
-   [ ] **Model Interaction (Visual Regression or DOM checks):**
    -   [ ] If possible with mocked 3D data or a simple test model, verify the model appears.
    -   [ ] Test basic interactions if implemented (e.g., clicking a button to toggle auto-rotation, though this might be better as an integration test if the 3D view itself isn't asserted).
    -   *Note: Full 3D model rendering verification in E2E can be complex. Start with DOM presence and basic interactions.*
-   [ ] **Accessibility Checks (Optional but Recommended):**
    -   [ ] Integrate accessibility checks (e.g., using `axe-core` with Playwright/Cypress).

## 5. CI/CD Integration

-   [ ] **Configure CI Environment:**
    -   [ ] Choose a CI/CD platform (e.g., GitHub Actions, GitLab CI, Jenkins).
    -   [ ] Create a CI workflow file (e.g., `.github/workflows/ci.yml`).
-   [ ] **Define CI Pipeline Steps:**
    -   [ ] **Checkout Code:** Fetch the latest code.
    -   [ ] **Setup Environment:** Install Node.js, dependencies (`npm ci` or `yarn install --frozen-lockfile`).
    -   [ ] **Linting:** Run `npm run lint`.
    -   [ ] **Unit & Integration Tests:** Run `npm test` (which executes `vitest`).
    -   [ ] **Build Project:** Run `npm run build` (to catch build errors).
    -   [ ] **E2E Tests (if applicable):**
        -   [ ] Setup browser environment for E2E tests (e.g., using browser binaries provided by Playwright).
        -   [ ] Run E2E tests.
-   [ ] **Test Reports & Artifacts:**
    -   [ ] Configure test runners to output reports (e.g., JUnit XML).
    -   [ ] Upload test reports and coverage reports as CI artifacts.
-   [ ] **Branching Strategy:**
    -   [ ] Ensure tests run on pull requests to the main branch.
    -   [ ] Optionally, run tests on every push to feature branches.

## 6. Documentation & Maintenance

-   [ ] **Document Testing Strategy:**
    -   [ ] Briefly document the testing approach, tools used, and how to run tests in the `README.md` or a dedicated testing guide.
-   [ ] **Maintain Tests:**
    -   [ ] Regularly update tests as the codebase evolves.
    -   [ ] Ensure new features and components are accompanied by tests.

This checklist provides a comprehensive plan. The next step would be to start implementing these, likely beginning with refining the Vitest setup and then moving to unit tests for individual components and hooks.
