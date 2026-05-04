import test from 'node:test';
import assert from 'node:assert/strict';

import { detectForbiddenChatText } from '../apiRoutes/_chatTextFilter.js';

function expectAllowed(text) {
  const result = detectForbiddenChatText(text);
  assert.equal(result.forbidden, false, `Expected allowed but was forbidden: ${text} -> ${JSON.stringify(result)}`);
  assert.deepEqual(result.reasons, [], `Expected no reasons for allowed text: ${text}`);
}

function expectForbidden(text, reason) {
  const result = detectForbiddenChatText(text);
  assert.equal(result.forbidden, true, `Expected forbidden but was allowed: ${text} -> ${JSON.stringify(result)}`);
  assert.ok(result.reasons.includes(reason), `Expected reason '${reason}' for text: ${text} -> ${JSON.stringify(result)}`);
}

test('detectForbiddenChatText: allows normal chat', () => {
  expectAllowed('Merhaba, nasılsın?');
  expectAllowed('Bugün 170 cm yazdım ama bu telefon değil.');
  expectAllowed('Saat 12:30 gibi konuşalım.');
  expectAllowed('Profilini okudum, çok güzel yazmışsın.');
});

test('detectForbiddenChatText: blocks contact-like text', () => {
  expectForbidden('instagram: ali.veli', 'contact');
  expectForbidden('t.me/ali_veli', 'contact');
  expectForbidden('wa.me/905550000000', 'contact');
  expectForbidden('Bana www.ornek.com dan yaz', 'contact');
  expectForbidden('Mailim test@example.com', 'contact');
  expectForbidden('Numaram +90 555 000 0000', 'contact');
  expectForbidden('05550000000', 'contact');
  expectForbidden('Beni @ali_veli_123 ekle', 'contact');
});

test('detectForbiddenChatText: blocks split phone fragments with recent context', () => {
  const result = detectForbiddenChatText('516930', { recentTexts: ['089603'] });
  assert.equal(result.forbidden, true, `Expected forbidden but was allowed: ${JSON.stringify(result)}`);
  assert.ok(result.reasons.includes('contact'), `Expected contact reason: ${JSON.stringify(result)}`);
});

test('detectForbiddenChatText: allows normal text after prior split-phone attempt', () => {
  const result = detectForbiddenChatText('Tamam, burada yazmaya devam edelim.', { recentTexts: ['089603', '516930'] });
  assert.equal(result.forbidden, false, `Expected allowed but was forbidden: ${JSON.stringify(result)}`);
  assert.deepEqual(result.reasons, [], `Expected no reasons for allowed text: ${JSON.stringify(result)}`);
});

test('detectForbiddenChatText: does not block unrelated short numbers without context', () => {
  expectAllowed('516930');
  const result = detectForbiddenChatText('12345', { recentTexts: ['bugun 31 yasindayim'] });
  assert.equal(result.forbidden, false, `Expected allowed but was forbidden: ${JSON.stringify(result)}`);
});

test('detectForbiddenChatText: blocks explicit sexual keywords (conservative)', () => {
  expectForbidden('porno izliyorum', 'sexual');
  expectForbidden('onlyfans hesabım var', 'sexual');
  expectForbidden('nude foto', 'sexual');
  expectForbidden('xxx', 'sexual');
  expectForbidden('cinsel içerik', 'sexual');
  expectForbidden('telanjang', 'sexual');
});
