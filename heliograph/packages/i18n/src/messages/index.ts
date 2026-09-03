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
