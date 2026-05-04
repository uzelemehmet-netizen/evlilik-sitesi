import test from 'node:test';
import assert from 'node:assert/strict';

import { moveSlotToFront, normalizeSlotArray } from '../src/utils/photoManagerSlots.js';

test('moveSlotToFront swaps the selected filled slot into profile position', () => {
  const result = moveSlotToFront(['a', 'b', 'c', '', ''], 2);

  assert.deepEqual(result, ['c', 'b', 'a', '', '']);
});

test('moveSlotToFront preserves null placeholders for file arrays', () => {
  const fileA = { name: 'a.jpg' };
  const fileB = { name: 'b.jpg' };

  const result = moveSlotToFront([fileA, null, fileB], 2, { emptyValue: null });

  assert.equal(result[0], fileB);
  assert.equal(result[2], fileA);
  assert.equal(result[1], null);
  assert.equal(result[3], null);
  assert.equal(result[4], null);
});

test('moveSlotToFront ignores invalid indexes and returns normalized length', () => {
  const result = moveSlotToFront(['a', 'b'], 0);

  assert.deepEqual(result, ['a', 'b', '', '', '']);
});

test('normalizeSlotArray pads missing slots consistently', () => {
  assert.deepEqual(normalizeSlotArray(['x']), ['x', '', '', '', '']);
  assert.deepEqual(normalizeSlotArray([1, 2], 4, null), [1, 2, null, null]);
});