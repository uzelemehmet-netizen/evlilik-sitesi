import test from 'node:test';
import assert from 'node:assert/strict';

import { inferProfileTextLang, normalizeProfileLang, oppositeProfileLang } from '../apiRoutes/_matchmakingProfileText.js';

test('matchmakingProfileText: normalizes and flips profile languages', () => {
  assert.equal(normalizeProfileLang('TR'), 'tr');
  assert.equal(normalizeProfileLang('id'), 'id');
  assert.equal(normalizeProfileLang('en'), '');
  assert.equal(oppositeProfileLang('tr'), 'id');
  assert.equal(oppositeProfileLang('id'), 'tr');
});

test('matchmakingProfileText: prefers explicit source language', () => {
  assert.equal(inferProfileTextLang({ sourceLang: 'id', original: 'Merhaba' }), 'id');
  assert.equal(inferProfileTextLang({ sourceLang: 'tr', original: 'Halo' }), 'tr');
});

test('matchmakingProfileText: infers source from existing bilingual fields', () => {
  assert.equal(
    inferProfileTextLang({
      original: 'Merhaba ben ciddi bir evlilik istiyorum',
      trValue: 'Merhaba ben ciddi bir evlilik istiyorum',
      idValue: '',
    }),
    'tr'
  );
  assert.equal(
    inferProfileTextLang({
      original: 'Saya mencari pasangan yang serius untuk menikah',
      trValue: '',
      idValue: 'Saya mencari pasangan yang serius untuk menikah',
    }),
    'id'
  );
});

test('matchmakingProfileText: uses heuristics for Turkish and Indonesian text', () => {
  assert.equal(inferProfileTextLang({ original: 'Kendimi gelistirmeyi seven, dürüst ve ciddi bir insanim' }), 'tr');
  assert.equal(inferProfileTextLang({ original: 'Saya mencari pasangan yang jujur dan serius untuk menikah' }), 'id');
});

test('matchmakingProfileText: leaves ambiguous latin text unresolved', () => {
  assert.equal(inferProfileTextLang({ original: 'serious honest person family' }), '');
});