/** DI tokens for ports (explicit @Inject everywhere — no reliance on decorator metadata). */
export const CLOCK = Symbol('Clock');
export const POLICY_REPOSITORY = Symbol('PolicyRepository');
export const CONFIG_READER = Symbol('ConfigReader');
export const CONFIG_SERVICE = Symbol('ConfigService');
export const APP_VERSION = Symbol('AppVersion');
export const DATABASE = Symbol('Database');
export const MEMBERSHIP_REPOSITORY = Symbol('MembershipRepository');
export const WORKSPACE_REPOSITORY = Symbol('WorkspaceRepository');
export const STALE_ALERT_SINK = Symbol('StaleAlertSink');
