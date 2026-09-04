import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { proxy } from '../proxy';

const req = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost:3000${path}`, cookie ? { headers: { cookie } } : undefined);

describe('proxy (edge gate)', () => {
  it('redirects anonymous visitors of the app shell to sign-in with a return path', () => {
    const res = proxy(req('/queue'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/sign-in?next=%2Fqueue');
  });

  it('lets anonymous visitors reach public routes and signed-in users reach the shell', () => {
    expect(proxy(req('/sign-up')).status).toBe(200);
    expect(proxy(req('/invite/abc')).status).toBe(200);
    expect(proxy(req('/', 'hg.session_token=x')).status).toBe(200);
  });

  it('sends signed-in users away from sign-in', () => {
    const res = proxy(req('/sign-in', 'hg.session_token=x'));
    expect(res.headers.get('location')).toBe('http://localhost:3000/');
  });
});
