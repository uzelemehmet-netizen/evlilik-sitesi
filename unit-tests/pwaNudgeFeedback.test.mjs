import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getPwaActionSuccessMessageKey,
  PWA_ACTION_FEEDBACK_TTL_MS,
  shouldEnableNotificationsAfterInstallAction,
} from '../src/components/tutorial/pwaNudgeFeedback.js';

test('pwaNudgeFeedback: enables notification step only when install is usable', () => {
  assert.equal(
    shouldEnableNotificationsAfterInstallAction({ alreadyInstalled: false, installAvailable: true, installAccepted: false }),
    false
  );
  assert.equal(
    shouldEnableNotificationsAfterInstallAction({ alreadyInstalled: false, installAvailable: true, installAccepted: true }),
    true
  );
  assert.equal(
    shouldEnableNotificationsAfterInstallAction({ alreadyInstalled: true, installAvailable: true, installAccepted: false }),
    true
  );
  assert.equal(
    shouldEnableNotificationsAfterInstallAction({ alreadyInstalled: false, installAvailable: false, installAccepted: false }),
    true
  );
});

test('pwaNudgeFeedback: returns success message key for actual successful outcomes', () => {
  assert.equal(getPwaActionSuccessMessageKey({ actionKey: 'install_only', installDone: true }), 'tour.pwaNudge.success.install');
  assert.equal(getPwaActionSuccessMessageKey({ actionKey: 'notify_only', pushEnabled: true }), 'tour.pwaNudge.success.notify');
  assert.equal(
    getPwaActionSuccessMessageKey({ actionKey: 'install_and_notify', installDone: true, pushEnabled: true }),
    'tour.pwaNudge.success.installAndNotify'
  );
  assert.equal(
    getPwaActionSuccessMessageKey({ actionKey: 'install_and_notify', installDone: true, pushEnabled: false }),
    'tour.pwaNudge.success.install'
  );
  assert.equal(
    getPwaActionSuccessMessageKey({ actionKey: 'install_and_notify', installDone: false, pushEnabled: true }),
    'tour.pwaNudge.success.notify'
  );
  assert.equal(getPwaActionSuccessMessageKey({ actionKey: 'notify_only', pushEnabled: false }), '');
});

test('pwaNudgeFeedback: success message timeout stays within requested range', () => {
  assert.ok(PWA_ACTION_FEEDBACK_TTL_MS >= 3000);
  assert.ok(PWA_ACTION_FEEDBACK_TTL_MS <= 5000);
  assert.equal(PWA_ACTION_FEEDBACK_TTL_MS, 4000);
});