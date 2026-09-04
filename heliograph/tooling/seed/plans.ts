/**
 * Plan catalogue seed (docs/15 §3.2). Lives in the `plans` / `plan_entitlements` tables and is
 * edited from the admin panel after launch; this file only bootstraps an empty database.
 * Prices are USD minor units per month; `null` limit = unlimited, `0` = feature off.
 */
export interface SeedPlan {
  code: string;
  name: string;
  interval: 'month' | 'year';
  priceMinor: number;
  currency: string;
  public: boolean;
  sort: number;
  entitlements: Record<string, number | null>;
}

const base = (over: Partial<Record<string, number | null>>): Record<string, number | null> => ({
  connected_accounts: 2,
  personas: 1,
  daily_posts: 1,
  daily_videos: 0,
  ai_credits_month: 30,
  team_members: 1,
  manual_library: null,
  video_pipeline: 0,
  voice_clone: 0,
  crm: 0,
  api_access: 0,
  white_label: 0,
  ...over,
});

export const planSeed: SeedPlan[] = [
  {
    code: 'free',
    name: 'Free',
    interval: 'month',
    priceMinor: 0,
    currency: 'USD',
    public: true,
    sort: 0,
    entitlements: base({}),
  },
  {
    code: 'solo',
    name: 'Solo',
    interval: 'month',
    priceMinor: 1900,
    currency: 'USD',
    public: true,
    sort: 10,
    entitlements: base({
      connected_accounts: 3,
      personas: 1,
      daily_posts: 5,
      daily_videos: 1,
      ai_credits_month: 300,
    }),
  },
  {
    code: 'creator',
    name: 'Creator',
    interval: 'month',
    priceMinor: 4900,
    currency: 'USD',
    public: true,
    sort: 20,
    entitlements: base({
      connected_accounts: 6,
      personas: 3,
      daily_posts: 8,
      daily_videos: 3,
      ai_credits_month: 1200,
      video_pipeline: null,
      voice_clone: null,
      crm: null,
    }),
  },
  {
    code: 'studio',
    name: 'Studio',
    interval: 'month',
    priceMinor: 14900,
    currency: 'USD',
    public: true,
    sort: 30,
    entitlements: base({
      connected_accounts: 20,
      personas: 10,
      daily_posts: 10,
      daily_videos: 5,
      ai_credits_month: 5000,
      team_members: 5,
      video_pipeline: null,
      voice_clone: null,
      crm: null,
      api_access: null,
    }),
  },
  {
    code: 'agency',
    name: 'Agency',
    interval: 'month',
    priceMinor: 39900,
    currency: 'USD',
    public: true,
    sort: 40,
    entitlements: base({
      connected_accounts: 60,
      personas: 30,
      daily_posts: 12,
      daily_videos: 6,
      ai_credits_month: 15000,
      team_members: 15,
      video_pipeline: null,
      voice_clone: null,
      crm: null,
      api_access: null,
      white_label: null,
    }),
  },
  {
    code: 'internal',
    name: 'Internal',
    interval: 'month',
    priceMinor: 0,
    currency: 'USD',
    public: false,
    sort: 100,
    entitlements: base({
      connected_accounts: null,
      personas: null,
      daily_posts: null,
      daily_videos: null,
      ai_credits_month: null,
      team_members: null,
      video_pipeline: null,
      voice_clone: null,
      crm: null,
      api_access: null,
      white_label: null,
    }),
  },
];
