import type { PolicyEntry, PolicyRepository } from '@heliograph/domain';

/** Dev/test implementation; Drizzle-backed repository lands with M1 (docs/11 §12b). */
export class InMemoryPolicyRepository implements PolicyRepository {
  private readonly entries: PolicyEntry[] = [];

  constructor(seed: readonly PolicyEntry[] = []) {
    this.entries.push(...seed);
  }

  async findByKey(key: string): Promise<PolicyEntry[]> {
    return this.entries.filter((e) => e.key === key);
  }

  async listEffective(): Promise<PolicyEntry[]> {
    return [...this.entries];
  }

  async save(entry: PolicyEntry): Promise<void> {
    const i = this.entries.findIndex((e) => e.id === entry.id);
    if (i >= 0) this.entries[i] = entry;
    else this.entries.push(entry);
  }
}
