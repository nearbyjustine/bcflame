import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Set up environment variables for tests
process.env.NEXT_PUBLIC_STRAPI_URL = 'http://localhost:1337';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
