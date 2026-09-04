import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, expect, vi } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

expect.extend(axeMatchers);
afterEach(() => cleanup());

export const routerMock = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() };
vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(),
}));
