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
  persona: {
    listTitle: m('persona.list.title', 'Personas'),
    newPersona: m('persona.list.new', 'New persona'),
    empty: m('persona.list.empty', 'No personas yet'),
    emptyHint: m(
      'persona.list.emptyHint',
      'A persona is one voice with its own channels, schedule and topics.',
    ),
    loadMore: m('persona.list.loadMore', 'Load more'),
    status: {
      draft: m('persona.status.draft', 'Draft'),
      warming: m('persona.status.warming', 'Warming up'),
      active: m('persona.status.active', 'Active'),
      paused: m('persona.status.paused', 'Paused'),
      archived: m('persona.status.archived', 'Archived'),
    },
    niche: {
      devops: m('persona.niche.devops', 'DevOps'),
      ai: m('persona.niche.ai', 'AI'),
      both: m('persona.niche.both', 'DevOps + AI'),
      personal: m('persona.niche.personal', 'Personal'),
    },
    wizard: {
      title: m('persona.wizard.title', 'Persona wizard'),
      stepIdentity: m('persona.wizard.step.identity', 'Identity'),
      stepVoice: m('persona.wizard.step.voice', 'Voice bible'),
      stepVisual: m('persona.wizard.step.visual', 'Visual kit'),
      stepChannels: m('persona.wizard.step.channels', 'Channels'),
      stepPolicy: m('persona.wizard.step.policy', 'Policy'),
      stepPreview: m('persona.wizard.step.preview', 'Preview & start'),
      next: m('persona.wizard.next', 'Save and continue'),
      back: m('persona.wizard.back', 'Back'),
      saved: m('persona.wizard.saved', 'Saved'),
      start: m('persona.wizard.start', 'Start persona'),
      pause: m('persona.wizard.pause', 'Pause'),
      resume: m('persona.wizard.resume', 'Resume'),
      archive: m('persona.wizard.archive', 'Archive'),
      stepOf: m('persona.wizard.stepOf', 'Step {current} of {total}'),
    },
    field: {
      name: m('persona.field.name', 'Persona name'),
      slug: m('persona.field.slug', 'URL name'),
      niche: m('persona.field.niche', 'Niche'),
      language: m('persona.field.language', 'Content language'),
      timezone: m('persona.field.timezone', 'Time zone'),
    },
    voice: {
      summary: m('persona.voice.summary', 'Who is speaking?'),
      summaryHint: m(
        'persona.voice.summaryHint',
        'One paragraph: background, why they post, what they never do. At least 40 characters.',
      ),
      audience: m('persona.voice.audience', 'Audience'),
      tone: m('persona.voice.tone', 'Tone words'),
      toneHint: m('persona.voice.toneHint', 'Press Enter to add; e.g. dry, concrete, curious'),
      register: m('persona.voice.register', 'Register'),
      registerCasual: m('persona.voice.register.casual', 'Casual'),
      registerPlain: m('persona.voice.register.plain', 'Plain'),
      registerProfessional: m('persona.voice.register.professional', 'Professional'),
      registerPlayful: m('persona.voice.register.playful', 'Playful'),
      doList: m('persona.voice.doList', 'Always'),
      dontList: m('persona.voice.dontList', 'Never'),
      samplePosts: m('persona.voice.samplePosts', 'Sample posts'),
      samplePostsHint: m(
        'persona.voice.samplePostsHint',
        'Paste 3–5 posts written in this voice, one per line. They anchor every draft.',
      ),
      experiencePool: m('persona.voice.experiencePool', 'Experience pool'),
      experiencePoolHint: m(
        'persona.voice.experiencePoolHint',
        'Real anecdotes the persona may reuse, one per line. The antidote to generic AI text.',
      ),
      emojiMax: m('persona.voice.emojiMax', 'Max emoji per post'),
      hashtagMax: m('persona.voice.hashtagMax', 'Max hashtags per post'),
      topicsInclude: m('persona.topics.include', 'Topics to cover'),
      topicsExclude: m('persona.topics.exclude', 'Topics to avoid'),
    },
    visual: {
      primary: m('persona.visual.primary', 'Primary colour'),
      accent: m('persona.visual.accent', 'Accent colour'),
      ground: m('persona.visual.ground', 'Background'),
      font: m('persona.visual.font', 'Typeface'),
      fontDisplay: m('persona.visual.font.display', 'Display'),
      fontBody: m('persona.visual.font.body', 'Body'),
      fontMono: m('persona.visual.font.mono', 'Mono'),
      watermark: m('persona.visual.watermark', 'Watermark posts with the persona handle'),
      preview: m('persona.visual.preview', 'Preview'),
    },
    channels: {
      soon: m('persona.channels.soon', 'Channel connections arrive with the next milestone.'),
      hint: m(
        'persona.channels.hint',
        'You will connect Telegram, Threads, X, Instagram, YouTube and TikTok here; the capability matrix shows what each channel can publish.',
      ),
    },
    policy: {
      dailyPosts: m('persona.policy.dailyPosts', 'Posts per day'),
      dailyVideos: m('persona.policy.dailyVideos', 'Videos per day'),
      min: m('persona.policy.min', 'Min'),
      max: m('persona.policy.max', 'Max'),
      windows: m('persona.policy.windows', 'Posting windows'),
      windowFrom: m('persona.policy.windowFrom', 'From'),
      windowTo: m('persona.policy.windowTo', 'To'),
      weekdays: m('persona.policy.weekdays', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
      addWindow: m('persona.policy.addWindow', 'Add window'),
      removeWindow: m('persona.policy.removeWindow', 'Remove window'),
      jitter: m('persona.policy.jitter', 'Jitter (minutes)'),
      weekendFactor: m('persona.policy.weekendFactor', 'Weekend factor (0–1)'),
      autoReply: m('persona.policy.autoReply', 'Reply to comments automatically'),
      autoReplyHint: m(
        'persona.policy.autoReplyHint',
        'Replies still pass the quality gate; money and legal topics always escalate to you.',
      ),
      replyRatio: m('persona.policy.replyRatio', 'Share of comments answered (0–1)'),
      humanReview: m('persona.policy.humanReview', 'Human review'),
      humanReviewAlways: m('persona.policy.humanReview.always', 'Always'),
      humanReviewFirst30: m('persona.policy.humanReview.first30', 'First 30 days'),
      humanReviewBelow: m('persona.policy.humanReview.below', 'Only below the score threshold'),
      humanReviewNever: m('persona.policy.humanReview.never', 'Never'),
      minScore: m('persona.policy.minScore', 'Minimum quality score (0–10)'),
    },
    preview: {
      ready: m('persona.preview.ready', 'Ready to start'),
      missing: m('persona.preview.missing', 'Before starting, complete:'),
      missingSummary: m('persona.preview.missing.summary', 'Voice bible: who is speaking'),
      missingTone: m('persona.preview.missing.tone', 'Voice bible: tone words'),
      missingTopics: m('persona.preview.missing.topics', 'Topics to cover'),
      warmup: m('persona.preview.warmup', 'The first {days} days run at reduced volume (warm-up).'),
      started: m('persona.preview.started', 'Persona started. It is warming up.'),
    },
    error: {
      slugTaken: m('persona.error.slugTaken', 'That URL name is already used in this workspace.'),
      limit: m(
        'persona.error.limit',
        'Your plan allows {limit, plural, one {# persona} other {# personas}}. Upgrade to add more.',
      ),
      incomplete: m('persona.error.incomplete', 'Complete the missing steps before starting.'),
    },
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
