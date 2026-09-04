import type { IdentityModuleOptions } from '../../src/modules/identity/identity.module.js';
import { LogEmailSender } from '../../src/modules/identity/infrastructure/log-email-sender.js';

/** Deterministic auth configuration for tests (no environment reads). */
export function testIdentityOptions(emailSender = new LogEmailSender()): IdentityModuleOptions {
  return {
    emailSender,
    authConfig: {
      secret: 'test-secret-test-secret-test-secret-0123456789',
      apiUrl: 'http://localhost:4000',
      webUrl: 'http://localhost:3000',
      mobileScheme: 'heliograph',
      requireEmailVerification: false,
      production: false,
    },
  };
}
