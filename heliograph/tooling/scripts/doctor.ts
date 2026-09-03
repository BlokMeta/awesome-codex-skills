/**
 * `pnpm doctor` — reads .env.example, checks the current environment and reports
 * every missing or malformed variable in one pass (docs/14 §F).
 *
 * Tags in .env.example comments drive the rules:
 *   [required]            → must be non-empty
 *   [required-for:<cap>]  → must be non-empty when that capability is enabled
 *   [optional]            → informational
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

export type Rule = {
  key: string;
  required: boolean;
  requiredFor: string | undefined;
  hint: string;
};
export type Report = { problems: string[]; warnings: string[] };

export function parseExample(text: string): Rule[] {
  const rules: Rule[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [assignment, ...commentParts] = line.split('#');
    const key = assignment?.split('=')[0]?.trim();
    if (!key) continue;
    const comment = commentParts.join('#').trim();
    const requiredFor = /\[required-for:([a-z]+)\]/.exec(comment)?.[1];
    rules.push({
      key,
      required: comment.includes('[required]'),
      requiredFor,
      hint: comment.replace(/\[[^\]]+\]/g, '').trim(),
    });
  }
  return rules;
}

const urlLike = z.string().url();
const formatChecks: Record<string, (v: string) => string | null> = {
  HG_PUBLIC_WEB_URL: (v) => (urlLike.safeParse(v).success ? null : 'geçerli bir URL değil'),
  HG_PUBLIC_API_URL: (v) => (urlLike.safeParse(v).success ? null : 'geçerli bir URL değil'),
  HG_DATABASE_URL: (v) => (v.startsWith('postgres') ? null : 'postgres:// ile başlamalı'),
  HG_REDIS_URL: (v) => (v.startsWith('redis') ? null : 'redis:// ile başlamalı'),
  HG_APP_SECRET: (v) => (v.length >= 32 ? null : 'en az 32 karakter olmalı'),
  HG_ENCRYPTION_MASTER_KEY: (v) => (v.length >= 32 ? null : 'en az 32 karakter olmalı'),
};

function isNeeded(rule: Rule, capabilities: ReadonlySet<string>): boolean {
  return rule.required || (rule.requiredFor !== undefined && capabilities.has(rule.requiredFor));
}

function missingValueEntry(rule: Rule, capabilities: ReadonlySet<string>): Partial<Report> {
  if (isNeeded(rule, capabilities)) {
    const why = rule.requiredFor ? ` (${rule.requiredFor} için)` : '';
    return { problems: [`${rule.key} eksik${why}: ${rule.hint}`] };
  }
  if (rule.requiredFor) {
    return { warnings: [`${rule.key} boş; ${rule.requiredFor} kapalı olduğu için sorun değil`] };
  }
  return {};
}

export function evaluate(
  rules: readonly Rule[],
  env: Readonly<Record<string, string | undefined>>,
  capabilities: ReadonlySet<string>,
): Report {
  const report: Report = { problems: [], warnings: [] };
  for (const rule of rules) {
    const value = env[rule.key] ?? '';
    if (value === '') {
      const entry = missingValueEntry(rule, capabilities);
      report.problems.push(...(entry.problems ?? []));
      report.warnings.push(...(entry.warnings ?? []));
      continue;
    }
    const issue = formatChecks[rule.key]?.(value);
    if (issue) report.problems.push(`${rule.key} ${issue}`);
  }
  return report;
}

function print(report: Report, ruleCount: number, capabilities: ReadonlySet<string>): number {
  const out = process.stdout;
  out.write(
    `Heliograph doctor — ${ruleCount} değişken, kapasiteler: ${[...capabilities].join(', ')}\n`,
  );
  for (const w of report.warnings) out.write(`  · ${w}\n`);
  if (report.problems.length === 0) {
    out.write('  ✓ tüm zorunlu değişkenler tamam\n');
    return 0;
  }
  for (const p of report.problems) out.write(`  ✗ ${p}\n`);
  out.write(`\n${report.problems.length} sorun. Bkz. docs/14-operator-kurulum-listesi.md\n`);
  return 1;
}

function main(): number {
  const capabilities = new Set(
    (process.env['HG_CAPABILITIES'] ?? 'telegram,threads,x')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const rules = parseExample(readFileSync(resolve(process.cwd(), '.env.example'), 'utf8'));
  return print(evaluate(rules, process.env, capabilities), rules.length, capabilities);
}

process.exitCode = main();
