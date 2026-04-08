import test from 'node:test';
import assert from 'node:assert/strict';

import { isLeadApplyPath, sanitizePostAuthTarget, shouldIgnorePostAuthState } from '../src/utils/postAuthRedirect.js';

test('postAuthRedirect: recognizes lead apply paths', () => {
  assert.equal(isLeadApplyPath('/aracilik'), true);
  assert.equal(isLeadApplyPath('/evlilik/aracilik-basvurusu'), true);
  assert.equal(isLeadApplyPath('/aracilik?x=1'), true);
  assert.equal(isLeadApplyPath('/profilim'), false);
});

test('postAuthRedirect: sanitizes lead apply path to profile', () => {
  assert.equal(sanitizePostAuthTarget('/aracilik', '/profilim'), '/profilim');
  assert.equal(sanitizePostAuthTarget('/evlilik/aracilik-basvurusu?from=auth', '/profilim'), '/profilim');
  assert.equal(sanitizePostAuthTarget('/app/pool', '/profilim'), '/app/pool');
});

test('postAuthRedirect: ignores saved route state for lead apply path', () => {
  assert.equal(shouldIgnorePostAuthState('/aracilik'), true);
  assert.equal(shouldIgnorePostAuthState('/evlilik/aracilik-basvurusu'), true);
  assert.equal(shouldIgnorePostAuthState('/profilim'), false);
});