// ABOUTME: Vitest global setup — registers jest-dom matchers for all tests.
// ABOUTME: Referenced by vite.config.ts `test.setupFiles`.
import '@testing-library/jest-dom/vitest';

// jsdom has no 2D canvas; make getContext quietly return null (components must tolerate that).
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
