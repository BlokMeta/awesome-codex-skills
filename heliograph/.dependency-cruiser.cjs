/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-is-pure',
      comment:
        'packages/domain must not import frameworks or infrastructure (docs/01 §5, CLAUDE.md rule 2)',
      severity: 'error',
      from: { path: '^packages/domain/' },
      to: {
        path: '^(apps/|packages/(adapters|contracts|ui|i18n))',
      },
    },
    {
      name: 'domain-no-node-modules-except-allowlist',
      comment: 'Domain may only depend on tiny, pure libraries',
      severity: 'error',
      from: { path: '^packages/domain/' },
      to: {
        dependencyTypes: ['npm', 'npm-dev'],
        pathNot: 'node_modules/(zod|ulid|fast-check|vitest|@vitest)(/|$)',
      },
    },
    {
      name: 'no-deep-imports-across-packages',
      comment: 'Other packages/apps import a package through its public entry (index.ts) only',
      severity: 'error',
      from: { path: '^(apps|packages)/([^/]+)/' },
      to: {
        path: '^packages/(?!$2/)[^/]+/src/(?!index\\.ts$).+',
      },
    },
    {
      name: 'layers-application-not-interface',
      comment: 'application may not import interface',
      severity: 'error',
      from: { path: '^apps/api/src/modules/[^/]+/application/', pathNot: '\\.test\\.ts$' },
      to: { path: '^apps/api/src/modules/[^/]+/interface/' },
    },
    {
      name: 'layers-domain-not-infra',
      comment: "a module's domain/application may not import its infrastructure",
      severity: 'error',
      from: {
        path: '^apps/api/src/modules/([^/]+)/(domain|application)/',
        pathNot: '\\.test\\.ts$',
      },
      to: { path: '^apps/api/src/modules/[^/]+/infrastructure/' },
    },
    {
      name: 'modules-do-not-cross-into-infra',
      comment: "one module may not touch another module's infrastructure or repositories",
      severity: 'error',
      from: { path: '^apps/api/src/modules/([^/]+)/' },
      to: { path: '^apps/api/src/modules/(?!$1/)[^/]+/infrastructure/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(dist|build|coverage|storybook-static)/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'default', 'types'],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
