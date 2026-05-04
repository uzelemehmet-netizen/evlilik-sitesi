import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isDeferredPhotoInteractionRequiredFromApplication,
  isDeferredPhotoInteractionRequiredFromUserDoc,
  isDeferredWhatsappInteractionRequiredFromApplication,
  isDeferredWhatsappInteractionRequiredFromUserDoc,
  isStubMatchmakingApplication,
} from '../src/utils/matchmakingProfileCompletion.js';

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

test('deferred photo requirement: active only while deferred flag exists and photo is still missing', () => {
  const appWithoutPhoto = {
    source: 'apply_submit',
    username: 'eva',
    fullName: 'Evalia Mentari',
    age: 28,
    whatsapp: '08123456789',
    city: 'Bandung',
    deferredPhotoRequiredForInteraction: true,
    details: {
      occupation: 'Wiraswasta',
      maritalStatus: 'single',
    },
  };

  const appWithPhoto = {
    ...appWithoutPhoto,
    photoUrls: ['https://example.com/photo.jpg'],
  };

  assert.equal(isDeferredPhotoInteractionRequiredFromApplication(appWithoutPhoto), true);
  assert.equal(isDeferredPhotoInteractionRequiredFromApplication(appWithPhoto), false);
});

test('deferred photo requirement: older users without flag stay unaffected', () => {
  const oldUserWithoutPhoto = {
    application: {
      username: 'legacy',
      fullName: 'Legacy User',
      age: 31,
      whatsapp: '08123456789',
      city: 'Istanbul',
      details: {
        occupation: 'Engineer',
        maritalStatus: 'single',
      },
    },
  };

  const flaggedUserWithoutPhoto = {
    deferredPhotoRequiredForInteraction: true,
    application: oldUserWithoutPhoto.application,
  };

  assert.equal(isDeferredPhotoInteractionRequiredFromUserDoc(oldUserWithoutPhoto), false);
  assert.equal(isDeferredPhotoInteractionRequiredFromUserDoc(flaggedUserWithoutPhoto), true);
});

test('deferred whatsapp requirement: activates only after required timestamp while whatsapp is still missing', () => {
  const requiredAfterMs = Date.now() - 1000;
  const appMissingWhatsapp = {
    source: 'apply_submit',
    username: 'eva',
    fullName: 'Evalia Mentari',
    age: 28,
    city: 'Bandung',
    photoUrls: ['https://example.com/photo.jpg'],
    deferredWhatsappRequiredAfterMs: requiredAfterMs,
    details: {
      occupation: 'Wiraswasta',
      maritalStatus: 'single',
    },
  };

  const appWithWhatsapp = {
    ...appMissingWhatsapp,
    whatsapp: '08123456789',
  };

  assert.equal(isDeferredWhatsappInteractionRequiredFromApplication(appMissingWhatsapp), true);
  assert.equal(isDeferredWhatsappInteractionRequiredFromApplication(appWithWhatsapp), false);
});

test('deferred whatsapp requirement: older users without flag or before due time stay unaffected', () => {
  const oldUserWithoutWhatsapp = {
    application: {
      username: 'legacy',
      fullName: 'Legacy User',
      age: 31,
      city: 'Istanbul',
      photoUrls: ['https://example.com/photo.jpg'],
      details: {
        occupation: 'Engineer',
        maritalStatus: 'single',
      },
    },
  };

  const futureFlaggedUser = {
    deferredWhatsappRequiredAfterMs: Date.now() + 60_000,
    application: oldUserWithoutWhatsapp.application,
  };

  assert.equal(isDeferredWhatsappInteractionRequiredFromUserDoc(oldUserWithoutWhatsapp), false);
  assert.equal(isDeferredWhatsappInteractionRequiredFromUserDoc(futureFlaggedUser), false);
});