/**
 * What a verified session exposes to other modules: a structural subset of the better-auth
 * session so application code never imports the auth infrastructure (docs/01 §5 layering).
 */
export interface Principal {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly emailVerified: boolean;
  };
  readonly session: {
    readonly id: string;
    /** Active workspace (better-auth active organization), when one is selected. */
    readonly activeOrganizationId?: string | null | undefined;
  };
}
