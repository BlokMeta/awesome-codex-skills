import { randomBytes } from 'node:crypto';
import type { ChannelModuleOptions } from '../../src/modules/channel/channel.module.js';
import { MasterKeyWrapper } from '../../src/modules/channel/infrastructure/envelope.js';

/** Channel module without environment reads: a throwaway master key and no outbound HTTP. */
export function testChannelOptions(over: Partial<ChannelModuleOptions> = {}): ChannelModuleOptions {
  return {
    keyWrapper: new MasterKeyWrapper(randomBytes(32).toString('base64')),
    fetch: async (url) => {
      throw new Error(`unexpected outbound request in test: ${url}`);
    },
    env: {},
    ...over,
  };
}
