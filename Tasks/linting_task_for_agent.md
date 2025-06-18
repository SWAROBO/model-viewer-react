# Linting Task for Coding Agent

This document outlines the linting errors found in the `model-viewer-react` project and provides a detailed action plan with checklists for a coding agent to resolve these issues.

## Linting Errors Found

The following linting errors were identified by running `npm run lint`:

*   **Unused Variables (`@typescript-eslint/no-unused-vars`):** Variables, functions, or imports that are declared but never used.
*   **Explicit `any` Type (`@typescript-eslint/no-explicit-any`):** Usage of the `any` type, which bypasses TypeScript's type checking.
*   **React Hook Rules Violations (`react-hooks/rules-of-hooks`):** React Hooks being called conditionally or in a way that violates the rules of hooks.
*   **Next.js Specific Errors:**
    *   `@next/next/no-img-element`: Usage of `<img>` tag instead of Next.js `<Image>` component for image optimization.
    *   `@next/next/no-assign-module-variable`: Assignment to the `module` variable, which is disallowed in Next.js.
*   **Unsafe Function Type (`@typescript-eslint/no-unsafe-function-type`):** Usage of the generic `Function` type, which is not type-safe.

## Detailed Action Plan

The following steps should be taken to address the linting issues. Each step includes a goal, affected files, and a checklist of actions.

### 1. Fix Unused Variables (`@typescript-eslint/no-unused-vars`)

**Goal:** Remove all declared but unused variables, functions, and imports to clean up the codebase and prevent potential errors.

**Files to Modify:**
*   `./src/app/page.test.tsx`
*   `./src/app/page.tsx`
*   `./src/components/AutoRotate.test.tsx`
*   `./src/components/DualRangeSliderControl.test.tsx`
*   `./src/components/ModelViewer.integration.test.tsx`
*   `./src/components/ModelViewer.test.tsx`
*   `./src/components/ModelViewerCore.test.tsx`
*   `./src/components/ModelViewerCore.tsx`
*   `./src/components/ServiceWorkerRegistrar.tsx`
*   `./src/components/SingleValueSliderControl.test.tsx`
*   `./src/hooks/useModelData.test.ts`
*   `./src/hooks/usePlayCanvasSetup.test.ts`

**Action Checklist:**
- [x] For each file, identify variables, functions, or imports that are declared but not used.
- [x] Safely remove the unused declarations. Ensure that removing them does not break any existing functionality.

**Example:**
```typescript
// Before:
import { Application } from 'pc'; // 'Application' is defined but never used.
const unusedVar = 10;

// After:
// (Remove the import if not used anywhere else in the file)
// (Remove the unused variable declaration)
```

### 2. Fix Next.js `no-img-element`

**Goal:** Replace the `<img>` tag with the Next.js `<Image>` component for optimized image handling.

**Files to Modify:**
*   `./src/components/SwaroboLogo.tsx`

**Action Checklist:**
- [x] Import `Image` from `next/image`.
- [x] Replace the `<img>` tag with `<Image />`.
- [x] Ensure `width`, `height`, and `alt` props are correctly set on the `<Image />` component.

**Example:**
```typescript
// Before:
import Image from 'next/image'; // Add this import
// ...
// <img src="/logo-swarobo.png" alt="Swarobo Logo" width={100} height={50} />

// After:
// <Image src="/logo-swarobo.png" alt="Swarobo Logo" width={100} height={50} />
```

### 3. Fix React Hook Rules Violations (`react-hooks/rules-of-hooks`)

**Goal:** Refactor the `useSplatWithProgress` hook to ensure all React Hooks are called unconditionally at the top level of the component or hook.

**Files to Modify:**
*   `./src/hooks/useSplatWithProgress.ts`

**Action Checklist:**
- [ ] Review the conditional calls to `useApp`, `useState`, `useCallback`, and `useEffect`.
- [ ] Restructure the code to ensure these hooks are always called in the same order on every render. This might involve moving conditional logic inside the hooks or using early returns before hook calls.

**Example (Conceptual):**
```typescript
// Before (problematic):
if (condition) {
  const [state, setState] = useState(0); // Conditional hook call
}

// After (correct):
const [state, setState] = useState(0); // Unconditional hook call
if (condition) {
  // Logic that depends on 'state'
}
```

### 4. Fix Explicit `any` Types (`@typescript-eslint/no-explicit-any`)

**Goal:** Replace `any` type annotations with more specific and accurate TypeScript types to improve type safety and code clarity.

**Files to Modify:**
*   `./src/app/page.tsx`
*   `./src/components/AutoRotate.test.tsx`
*   `./src/components/ModelViewerCore.test.tsx`
*   `./src/components/ModelViewerCore.tsx`
*   `./src/hooks/useModelData.test.ts`
*   `./src/hooks/useModelData.ts`
*   `./src/hooks/usePlayCanvasSetup.test.ts`
*   `./src/hooks/usePlayCanvasSetup.ts`
*   `./src/hooks/useSplatWithProgress.test.ts`
*   `./src/hooks/useSplatWithProgress.ts`
*   `./src/lib/@playcanvas/react/orbit-controls/orbit-camera.d.ts`
*   `./src/lib/playcanvas/CustomSplatHandler.ts`

**Action Checklist:**
- [ ] For each instance of `any`, determine the correct type based on the context and expected data structure.
- [ ] Define interfaces or types if complex objects are involved.
- [ ] Replace `any` with the inferred or defined type.

**Example:**
```typescript
// Before:
function processData(data: any) { /* ... */ }

// After:
interface MyData {
  id: number;
  name: string;
}
function processData(data: MyData) { /* ... */ }
```

### 5. Address Other Errors

**Goal:** Resolve remaining specific linting issues.

**Files to Modify:**
*   `./src/components/AutoRotate.test.tsx`
*   `./src/components/DualRangeSliderControl.test.tsx`
*   `./src/components/ModelViewer.test.tsx`
*   `./src/hooks/useSplatWithProgress.test.ts`

**Action Checklist:**
- [ ] **`@next/next/no-assign-module-variable`:** In `src/components/AutoRotate.test.tsx`, `src/components/DualRangeSliderControl.test.tsx`, and `src/components/ModelViewer.test.tsx`, remove or refactor any assignments to the `module` variable. This often occurs in test files when mocking modules.
- [ ] **`@typescript-eslint/no-unsafe-function-type`:** In `src/hooks/useSplatWithProgress.test.ts`, replace the generic `Function` type with more specific function signatures (e.g., `() => void`, `(arg: string) => number`).

## Verification

After implementing the fixes:
- Run the linter again to verify that all errors have been resolved:
```bash
npm run lint
```
- Run unit tests:
```bash
npm run test
```
- Run e2e tests:
```bash
npm run test:e2e
```

- Run the application to ensure it functions correctly without any runtime/console errors. The server is already running at 3000:
  - http://localhost:3000
  - http://localhost:3000/?settings=true


The command should ideally output no errors or warnings.
