/**
 * The one place that imports every module's `infrastructure/schema.ts`, so drizzle-kit and the
 * migration runner see the whole database (docs/03 §6). Application code never imports this
 * file — modules use their own schema through their own repositories.
 */
export * from '../modules/billing/infrastructure/schema.js';
export * from '../modules/config/infrastructure/schema.js';
export * from '../modules/identity/infrastructure/schema.js';
export * from '../modules/persona/infrastructure/schema.js';
export * from '../modules/privacy/infrastructure/schema.js';
