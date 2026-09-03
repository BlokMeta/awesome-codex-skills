/** DI tokens for ports (explicit @Inject everywhere — no reliance on decorator metadata). */
export const CLOCK = Symbol('Clock');
export const POLICY_REPOSITORY = Symbol('PolicyRepository');
export const CONFIG_READER = Symbol('ConfigReader');
export const CONFIG_SERVICE = Symbol('ConfigService');
export const APP_VERSION = Symbol('AppVersion');
