/**
 * Message descriptors with hand-written ids (docs/06 §2: `context.screen.element`). The English
 * text is the source; catalogs under locales/<code>/messages.po translate by id.
 * No macros: descriptors are plain objects so the same code runs on Node, Next and Expo.
 */
export interface MessageDescriptor {
  readonly id: string;
  readonly message: string;
  readonly comment?: string;
}

const m = (id: string, message: string, comment?: string): MessageDescriptor =>
  comment ? { id, message, comment } : { id, message };

export const messages = {
  common: {
    approve: m('common.action.approve', 'Approve'),
    reject: m('common.action.reject', 'Reject'),
    regenerate: m('common.action.regenerate', 'Regenerate'),
    cancel: m('common.action.cancel', 'Cancel'),
    save: m('common.action.save', 'Save'),
    takeOver: m(
      'common.action.takeOver',
      "I'll take it from here",
      'Money/legal escalation button',
    ),
  },
  review: {
    queueTitle: m('review.queue.title', 'Approval queue'),
    pendingCount: m(
      'review.queue.pendingCount',
      '{count, plural, =0 {Nothing waiting} one {# item waiting} other {# items waiting}}',
    ),
    gatePassed: m('review.gate.passed', 'Passed {passed} of {total} checks'),
  },
  auth: {
    signInTitle: m('auth.signIn.title', 'Sign in'),
    signUpTitle: m('auth.signUp.title', 'Create your account'),
    email: m('auth.field.email', 'Email'),
    password: m('auth.field.password', 'Password'),
    passwordHint: m('auth.field.passwordHint', 'At least 10 characters'),
    name: m('auth.field.name', 'Name'),
    signIn: m('auth.action.signIn', 'Sign in'),
    signUp: m('auth.action.signUp', 'Create account'),
    signOut: m('auth.action.signOut', 'Sign out'),
    noAccount: m('auth.signIn.noAccount', 'No account yet?'),
    haveAccount: m('auth.signUp.haveAccount', 'Already have an account?'),
    invalidCredentials: m('auth.error.invalidCredentials', 'Email or password is wrong.'),
    emailTaken: m('auth.error.emailTaken', 'An account with this email already exists.'),
    generic: m('auth.error.generic', 'Something went wrong. Please try again.'),
    twoFactorTitle: m('auth.twoFactor.title', 'Second factor'),
    twoFactorHint: m('auth.twoFactor.hint', 'Enter the 6-digit code from your authenticator app.'),
    twoFactorCode: m('auth.twoFactor.code', 'Code'),
    twoFactorVerify: m('auth.twoFactor.verify', 'Verify'),
    twoFactorInvalid: m('auth.twoFactor.invalid', 'That code is not valid.'),
    verifyEmailTitle: m('auth.verifyEmail.title', 'Check your inbox'),
    verifyEmailBody: m(
      'auth.verifyEmail.body',
      'We sent a verification link to {email}. Open it to activate your account.',
    ),
  },
  consent: {
    title: m('consent.title', 'Before we start'),
    intro: m(
      'consent.intro',
      'Please review and accept the documents below. You can withdraw optional consents at any time in Settings.',
    ),
    acceptAll: m('consent.action.acceptAll', 'Accept and continue'),
    read: m('consent.action.read', 'Read'),
    doc: {
      terms: m('consent.doc.terms', 'Terms of Service'),
      privacy: m('consent.doc.privacy', 'Privacy Policy'),
      aup: m('consent.doc.aup', 'Acceptable Use Policy'),
      ai_processing: m(
        'consent.doc.aiProcessing',
        'Permission to process my content with third-party AI providers',
      ),
      kvkk_aydinlatma: m('consent.doc.kvkkAydinlatma', 'KVKK privacy notice'),
      distance_sale: m('consent.doc.distanceSale', 'Distance sales agreement'),
      cookies: m('consent.doc.cookies', 'Cookie policy'),
      kvkk_acik_riza_marketing: m(
        'consent.doc.kvkkAcikRizaMarketing',
        'Explicit consent for marketing communication',
      ),
      kvkk_acik_riza_voice: m(
        'consent.doc.kvkkAcikRizaVoice',
        'Explicit consent for voice cloning',
      ),
      kvkk_acik_riza_likeness: m(
        'consent.doc.kvkkAcikRizaLikeness',
        'Explicit consent for using my likeness',
      ),
    },
  },
  workspace: {
    createTitle: m('workspace.create.title', 'Create your workspace'),
    createIntro: m(
      'workspace.create.intro',
      'A workspace holds your personas, connected accounts and team.',
    ),
    name: m('workspace.field.name', 'Workspace name'),
    slug: m('workspace.field.slug', 'URL name'),
    slugHint: m('workspace.field.slugHint', 'Lowercase letters, numbers and dashes'),
    create: m('workspace.action.create', 'Create workspace'),
    switch: m('workspace.action.switch', 'Switch workspace'),
    active: m('workspace.label.active', 'Active'),
    role: m(
      'workspace.label.role',
      '{role, select, owner {Owner} admin {Admin} editor {Editor} viewer {Viewer} other {Member}}',
    ),
  },
  today: {
    title: m('today.title', 'Today'),
    welcome: m('today.welcome', 'Welcome, {name}'),
    empty: m(
      'today.empty',
      'Nothing is scheduled yet. Create a persona and connect a channel to light the first signal.',
    ),
    plan: m('today.plan', 'Plan: {plan}'),
    credits: m(
      'today.credits',
      '{balance, plural, =0 {No media credits} one {# media credit} other {# media credits}}',
    ),
  },
  nav: {
    today: m('nav.today', 'Today'),
    queue: m('nav.queue', 'Queue'),
    calendar: m('nav.calendar', 'Calendar'),
    trends: m('nav.trends', 'Trends'),
    inbox: m('nav.inbox', 'Inbox'),
    deals: m('nav.deals', 'Deals'),
    library: m('nav.library', 'Library'),
    analytics: m('nav.analytics', 'Analytics'),
    settings: m('nav.settings', 'Settings'),
    language: m('nav.language', 'Language'),
    skipToContent: m('nav.skipToContent', 'Skip to content'),
  },
  errors: {
    persona: {
      invalidTransition: m(
        'errors.persona.invalidTransition',
        'Cannot move this persona from {from} to {to}.',
      ),
    },
    identity: {
      notAMember: m('errors.identity.notAMember', 'You are not a member of this workspace.'),
      forbidden: m('errors.identity.forbidden', 'Your role ({role}) cannot {permission}.'),
      roleTooHigh: m('errors.identity.roleTooHigh', 'You cannot assign the {role} role.'),
      lastOwner: m('errors.identity.lastOwner', 'A workspace needs at least one owner.'),
    },
    billing: {
      featureNotInPlan: m(
        'errors.billing.featureNotInPlan',
        'Your plan does not include {feature}.',
      ),
      featureDisabled: m('errors.billing.featureDisabled', '{feature} is disabled on your plan.'),
      entitlementExceeded: m(
        'errors.billing.entitlementExceeded',
        'Limit reached: {used} of {limit} {feature} used.',
      ),
      insufficientCredits: m(
        'errors.billing.insufficientCredits',
        'Not enough credits: {amount} needed, {balance} left.',
      ),
      invalidAmount: m('errors.billing.invalidAmount', 'Invalid credit amount.'),
    },
    channel: {
      quotaExceeded: m(
        'errors.channel.quotaExceeded',
        '{channel} has no publishing quota left until {resetAt}.',
      ),
    },
    validation: {
      past: m('errors.validation.past', 'This time is in the past.'),
    },
  },
} as const;

export function allDescriptors(node: unknown = messages): MessageDescriptor[] {
  if (node && typeof node === 'object') {
    if ('id' in node && 'message' in node) return [node as MessageDescriptor];
    return Object.values(node).flatMap((v) => allDescriptors(v));
  }
  return [];
}
