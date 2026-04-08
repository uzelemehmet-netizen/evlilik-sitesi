import test from 'node:test';
import assert from 'node:assert/strict';

import { isStubMatchmakingApplication } from '../src/utils/matchmakingProfileCompletion.js';

test('isStubMatchmakingApplication: stale autoBootstrap on complete apply_submit is treated as real', () => {
  const app = {
    source: 'apply_submit',
    username: 'eva',
    fullName: 'Evalia Mentari',
    age: 28,
    gender: 'female',
    whatsapp: '08123456789',
    city: 'Bandung',
    photoUrls: ['https://example.com/photo.jpg'],
    details: {
      autoBootstrap: true,
      occupation: 'Wiraswasta',
      maritalStatus: 'divorced',
      hasChildren: 'no',
    },
  };

  assert.equal(isStubMatchmakingApplication(app), false);
});

test('isStubMatchmakingApplication: incomplete apply_submit with autoBootstrap stays stub', () => {
  const app = {
    source: 'apply_submit',
    username: 'eva',
    age: 28,
    gender: 'female',
    details: {
      autoBootstrap: true,
    },
  };

  assert.equal(isStubMatchmakingApplication(app), true);
});

test('isStubMatchmakingApplication: explicit auto_stub stays stub', () => {
  const app = {
    source: 'auto_stub',
    username: 'eva',
    fullName: 'Evalia Mentari',
    age: 28,
    gender: 'female',
    whatsapp: '08123456789',
    city: 'Bandung',
    photoUrls: ['https://example.com/photo.jpg'],
    details: {
      autoBootstrap: false,
      occupation: 'Wiraswasta',
      maritalStatus: 'single',
    },
  };

  assert.equal(isStubMatchmakingApplication(app), true);
});