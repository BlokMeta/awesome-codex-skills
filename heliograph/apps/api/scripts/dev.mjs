/**
 * Dev runner: `tsc -b --watch` + `node --watch dist/main.js`. tsx cannot host the Nest app —
 * its ESM loader instantiates `@nestjs/core` separately from the CJS copy nestjs-pino requires,
 * so DI class identities never match (docs/02, NestJS row). Compiled output has one instance.
 */
import { spawn } from 'node:child_process';

const tsc = spawn('pnpm', ['exec', 'tsc', '-b', '--watch', '--preserveWatchOutput'], { stdio: 'inherit' });
const node = spawn('node', ['--watch', '--enable-source-maps', 'dist/main.js'], {
  stdio: 'inherit',
  env: process.env,
});
const stop = () => {
  tsc.kill('SIGTERM');
  node.kill('SIGTERM');
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
node.on('exit', (code) => {
  tsc.kill('SIGTERM');
  process.exit(code ?? 0);
});
