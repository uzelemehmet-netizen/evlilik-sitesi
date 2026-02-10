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

test('detectForbiddenChatText: blocks explicit sexual keywords (conservative)', () => {
  expectForbidden('porno izliyorum', 'sexual');
  expectForbidden('onlyfans hesabım var', 'sexual');
  expectForbidden('nude foto', 'sexual');
  expectForbidden('xxx', 'sexual');
  expectForbidden('cinsel içerik', 'sexual');
  expectForbidden('telanjang', 'sexual');
});
